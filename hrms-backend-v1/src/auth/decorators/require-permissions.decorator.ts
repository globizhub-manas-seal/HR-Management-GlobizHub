import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

// This allows us to write @RequirePermissions('employee.create', 'employee.delete')
export const RequirePermissions = (...permissions: string[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);