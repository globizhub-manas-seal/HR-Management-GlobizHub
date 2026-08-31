import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSwapRequestDto } from './dto/create-swap-request.dto';
import { ShiftSwapStatus, OverrideSource } from '../../generated/prisma/client';

@Injectable()
export class ShiftSwapService {
  constructor(private prisma: PrismaService) {}

  // Helpers to combine Date and Time string (e.g. "13:00") into a single Date object
  private getShiftStartDateTime(date: Date, timeStr: string): Date {
    const combined = new Date(date);
    const [hours, minutes] = timeStr.split(':').map(Number);
    combined.setHours(hours || 0, minutes || 0, 0, 0);
    return combined;
  }

  // 1. Create a Shift Transfer Request (A -> B)
  async createRequest(requesterId: string, companyId: string, dto: CreateSwapRequestDto) {
    const targetDate = new Date(dto.date);
    targetDate.setUTCHours(0, 0, 0, 0);

    if (requesterId === dto.targetEmployeeId) {
      throw new BadRequestException('You cannot request a shift transfer with yourself.');
    }

    // A. Verify Target Employee (B) exists and is in the same company
    const targetEmployee = await this.prisma.employee.findFirst({
      where: { id: dto.targetEmployeeId, companyId },
    });
    if (!targetEmployee) {
      throw new NotFoundException('Target employee not found in your organization.');
    }
    if (!targetEmployee.reportingManagerId) {
      throw new BadRequestException('Target employee must have a reporting manager assigned to approve the shift transfer.');
    }

    // B. Check for existing active/pending requests
    const existing = await this.prisma.shiftSwapRequest.findFirst({
      where: {
        companyId,
        date: targetDate,
        requesterEmployeeId: requesterId,
        targetEmployeeId: dto.targetEmployeeId,
        status: {
          in: [ShiftSwapStatus.PENDING_EMPLOYEE, ShiftSwapStatus.PENDING_MANAGER, ShiftSwapStatus.APPROVED],
        },
      },
    });
    if (existing) {
      throw new BadRequestException('An active or pending shift transfer request already exists for this date.');
    }

    // C. Fetch B's schedule on that date
    const bSchedule = await this.prisma.schedule.findFirst({
      where: {
        employeeId: dto.targetEmployeeId,
        date: targetDate,
      },
      include: { shift: true },
    });
    if (!bSchedule || bSchedule.isDayOff || !bSchedule.shift) {
      throw new BadRequestException('The target employee has no shift assigned (or has a Day Off) on this date.');
    }

    if (bSchedule.shiftId !== dto.targetShiftId) {
      throw new BadRequestException("Requested shift does not match the target employee's scheduled shift.");
    }

    const targetShift = bSchedule.shift;

    // D. Fetch A's schedule on that date (if any)
    const aSchedule = await this.prisma.schedule.findFirst({
      where: {
        employeeId: requesterId,
        date: targetDate,
      },
    });

    const requesterOriginalShiftId = aSchedule?.shiftId || null;

    // E. Save Request with snapshots of the original shift
    return this.prisma.shiftSwapRequest.create({
      data: {
        companyId,
        requesterEmployeeId: requesterId,
        targetEmployeeId: dto.targetEmployeeId,
        date: targetDate,
        requesterOriginalShiftId,
        targetShiftId: dto.targetShiftId,
        originalShiftId: targetShift.id,
        originalShiftName: targetShift.name,
        originalShiftStart: targetShift.startTime,
        originalShiftEnd: targetShift.endTime,
        reason: dto.reason || null,
        managerId: targetEmployee.reportingManagerId, // snapshot manager at creation time
        status: ShiftSwapStatus.PENDING_EMPLOYEE,
      },
      include: {
        requester: { select: { firstName: true, lastName: true, email: true } },
        target: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }

  // 2. B Accepts/Rejects (Target Response)
  async respondToRequest(targetId: string, requestId: string, accept: boolean) {
    const request = await this.prisma.shiftSwapRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Shift transfer request not found.');
    }
    if (request.targetEmployeeId !== targetId) {
      throw new ForbiddenException('You are not authorized to respond to this request.');
    }
    if (request.status !== ShiftSwapStatus.PENDING_EMPLOYEE) {
      throw new BadRequestException('Request is no longer pending employee response.');
    }

    const updatedStatus = accept ? ShiftSwapStatus.PENDING_MANAGER : ShiftSwapStatus.REJECTED_BY_EMPLOYEE;
    const responseText = accept ? 'ACCEPTED' : 'REJECTED';

    return this.prisma.shiftSwapRequest.update({
      where: { id: requestId },
      data: {
        status: updatedStatus,
        targetEmployeeResponse: responseText,
      },
    });
  }

  // 3. Manager Approves/Rejects
  async approveRequest(managerId: string, requestId: string, approve: boolean) {
    const request = await this.prisma.shiftSwapRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Shift transfer request not found.');
    }
    if (request.managerId !== managerId) {
      throw new ForbiddenException('You are not authorized to approve/reject this request.');
    }
    if (request.status !== ShiftSwapStatus.PENDING_MANAGER) {
      throw new BadRequestException('Request is not pending manager approval.');
    }

    if (!approve) {
      return this.prisma.shiftSwapRequest.update({
        where: { id: requestId },
        data: {
          status: ShiftSwapStatus.REJECTED_BY_MANAGER,
          managerResponse: 'REJECTED',
        },
      });
    }

    // Approve: create overrides for A and B in a transaction
    return this.prisma.$transaction(async (tx) => {
      // Create override for A (requester) -> works B's shift
      await tx.shiftAssignmentOverride.upsert({
        where: {
          employeeId_date: {
            employeeId: request.requesterEmployeeId,
            date: request.date,
          },
        },
        update: {
          originalShiftId: request.requesterOriginalShiftId,
          overrideShiftId: request.targetShiftId,
          source: OverrideSource.SHIFT_SWAP,
          relatedSwapRequestId: request.id,
          status: 'ACTIVE',
        },
        create: {
          companyId: request.companyId,
          employeeId: request.requesterEmployeeId,
          date: request.date,
          originalShiftId: request.requesterOriginalShiftId,
          overrideShiftId: request.targetShiftId,
          source: OverrideSource.SHIFT_SWAP,
          relatedSwapRequestId: request.id,
          status: 'ACTIVE',
        },
      });

      // Create override for B (target/giver) -> Day off / Shift given (null overrideShiftId)
      await tx.shiftAssignmentOverride.upsert({
        where: {
          employeeId_date: {
            employeeId: request.targetEmployeeId,
            date: request.date,
          },
        },
        update: {
          originalShiftId: request.targetShiftId,
          overrideShiftId: null, // no work expected
          source: OverrideSource.SHIFT_SWAP,
          relatedSwapRequestId: request.id,
          status: 'ACTIVE',
        },
        create: {
          companyId: request.companyId,
          employeeId: request.targetEmployeeId,
          date: request.date,
          originalShiftId: request.targetShiftId,
          overrideShiftId: null,
          source: OverrideSource.SHIFT_SWAP,
          relatedSwapRequestId: request.id,
          status: 'ACTIVE',
        },
      });

      // Update request status to APPROVED
      return tx.shiftSwapRequest.update({
        where: { id: requestId },
        data: {
          status: ShiftSwapStatus.APPROVED,
          managerResponse: 'APPROVED',
          approvedAt: new Date(),
        },
      });
    });
  }

  // 4. Cancellation Flow
  async cancelRequest(userId: string, userRole: string, requestId: string, reason?: string) {
    const request = await this.prisma.shiftSwapRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Shift transfer request not found.');
    }

    const isRequester = request.requesterEmployeeId === userId;
    const isTarget = request.targetEmployeeId === userId;
    const isManager = request.managerId === userId || userRole === 'SUPER_ADMIN' || userRole === 'HR_HEAD';

    if (!isRequester && !isTarget && !isManager) {
      throw new ForbiddenException('You are not authorized to cancel this request.');
    }

    // A. Cancellation before manager approval
    if (request.status === ShiftSwapStatus.PENDING_EMPLOYEE || request.status === ShiftSwapStatus.PENDING_MANAGER) {
      return this.prisma.shiftSwapRequest.update({
        where: { id: requestId },
        data: { status: ShiftSwapStatus.CANCELLED },
      });
    }

    // B. Cancellation after manager approval
    if (request.status === ShiftSwapStatus.APPROVED) {
      const shiftStart = this.getShiftStartDateTime(request.date, request.originalShiftStart);
      const now = new Date();

      if (now >= shiftStart) {
        throw new BadRequestException('Cannot cancel a shift transfer after the shift has started.');
      }

      const diffMs = shiftStart.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // B1. If manager cancels directly (at any time before shift start), cancel immediately
      if (isManager) {
        return this.prisma.$transaction(async (tx) => {
          // Deactivate overrides
          await tx.shiftAssignmentOverride.deleteMany({
            where: { relatedSwapRequestId: request.id },
          });

          return tx.shiftSwapRequest.update({
            where: { id: requestId },
            data: {
              status: ShiftSwapStatus.CANCELLED,
              cancellationReason: reason || 'Cancelled directly by Manager/Admin',
            },
          });
        });
      }

      // B2. If Employee A/B cancels, rules apply based on hours remaining
      if (diffHours > 24) {
        // >24h before shift: Requester A can request cancellation -> B must acknowledge -> Manager approval required
        if (isRequester) {
          return this.prisma.shiftSwapRequest.update({
            where: { id: requestId },
            data: {
              cancellationRequested: true,
              cancellationReason: reason || 'Cancellation requested by requester (>24h prior)',
              cancellationRequestedAt: new Date(),
              cancellationTargetAck: false, // reset ack
            },
          });
        }
        throw new BadRequestException('Only the requester can initiate cancellation for this approved swap.');
      } else {
        // Within 24h of shift: Requester/Target can request, but requires Manager approval directly (no B ack needed, or either A/B initiates request)
        return this.prisma.shiftSwapRequest.update({
          where: { id: requestId },
          data: {
            cancellationRequested: true,
            cancellationReason: reason || 'Urgent cancellation requested within 24h of shift',
            cancellationRequestedAt: new Date(),
            cancellationTargetAck: true, // Bypass target ack directly to manager
          },
        });
      }
    }

    throw new BadRequestException('Request is in a state that cannot be cancelled.');
  }

  // 5. Target employee acknowledges cancellation (>24h)
  async acknowledgeCancellation(targetId: string, requestId: string) {
    const request = await this.prisma.shiftSwapRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Shift transfer request not found.');
    }
    if (request.targetEmployeeId !== targetId) {
      throw new ForbiddenException('You are not authorized to acknowledge this cancellation.');
    }
    if (!request.cancellationRequested) {
      throw new BadRequestException('No cancellation has been requested for this shift transfer.');
    }

    return this.prisma.shiftSwapRequest.update({
      where: { id: requestId },
      data: {
        cancellationTargetAck: true,
      },
    });
  }

  // 6. Manager approves cancellation request
  async approveCancellation(managerId: string, userRole: string, requestId: string, approve: boolean) {
    const request = await this.prisma.shiftSwapRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Shift transfer request not found.');
    }
    const isManager = request.managerId === managerId || userRole === 'SUPER_ADMIN' || userRole === 'HR_HEAD';
    if (!isManager) {
      throw new ForbiddenException('Only managers or admins can review cancellation requests.');
    }
    if (!request.cancellationRequested) {
      throw new BadRequestException('No cancellation has been requested.');
    }
    if (!request.cancellationTargetAck) {
      throw new BadRequestException('Cancellation must be acknowledged by the target employee first.');
    }

    if (!approve) {
      // Reject cancellation request -> reset flags
      return this.prisma.shiftSwapRequest.update({
        where: { id: requestId },
        data: {
          cancellationRequested: false,
          cancellationReason: null,
          cancellationRequestedAt: null,
          cancellationTargetAck: false,
        },
      });
    }

    // Approve cancellation -> Cancel request and remove overrides
    return this.prisma.$transaction(async (tx) => {
      await tx.shiftAssignmentOverride.deleteMany({
        where: { relatedSwapRequestId: request.id },
      });

      return tx.shiftSwapRequest.update({
        where: { id: requestId },
        data: {
          status: ShiftSwapStatus.CANCELLED,
          cancellationRequested: false,
        },
      });
    });
  }

  // 7. Get requests lists for the user
  async getMyRequests(userId: string, companyId: string, role: string) {
    const isManagerOrAdmin = role === 'MANAGER' || role === 'SUPER_ADMIN' || role === 'HR_HEAD';

    const sent = await this.prisma.shiftSwapRequest.findMany({
      where: { requesterEmployeeId: userId, companyId },
      include: {
        target: { select: { firstName: true, lastName: true } },
        manager: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const received = await this.prisma.shiftSwapRequest.findMany({
      where: { targetEmployeeId: userId, companyId },
      include: {
        requester: { select: { firstName: true, lastName: true } },
        manager: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const approvals = isManagerOrAdmin
      ? await this.prisma.shiftSwapRequest.findMany({
          where: { managerId: userId, companyId },
          include: {
            requester: { select: { firstName: true, lastName: true } },
            target: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    return { sent, received, approvals };
  }
}
