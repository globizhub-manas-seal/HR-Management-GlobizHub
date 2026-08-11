import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  ForbiddenException 
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Get the required permissions for this specific route
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    // If the route doesn't require any specific permissions, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // This was attached by AuthGuard earlier

    if (!user) throw new ForbiddenException('User not authenticated');

    // 2. System Admins & Owners bypass all granular permission checks
    if (user.role === 'SUPER_ADMIN' || user.role === 'OWNER') {
      return true;
    }

    // 3. Fetch the user's custom role and permissions from the database
    const employee = await this.prisma.employee.findUnique({
      where: { id: user.sub },
      include: { customRole: true },
    });

    const userPermissions = employee?.customRole?.permissions || [];

    // 4. Check if the user has ALL the required permissions for this route
    const hasPermission = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Action denied. You need the following permissions: ${requiredPermissions.join(', ')}`
      );
    }

    return true;
  }
}