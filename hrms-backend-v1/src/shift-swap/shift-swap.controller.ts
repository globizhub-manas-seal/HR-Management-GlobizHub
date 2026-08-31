import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ShiftSwapService } from './shift-swap.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateSwapRequestDto } from './dto/create-swap-request.dto';
import { RespondSwapRequestDto } from './dto/respond-swap-request.dto';
import { ApproveSwapRequestDto } from './dto/approve-swap-request.dto';
import { RequestCancellationDto } from './dto/request-cancellation.dto';

@Controller('shift-swaps')
@UseGuards(AuthGuard)
export class ShiftSwapController {
  constructor(private readonly shiftSwapService: ShiftSwapService) {}

  // 1. Employee A requests a shift transfer with Employee B
  @Post('request')
  async createRequest(@Request() req, @Body() dto: CreateSwapRequestDto) {
    return this.shiftSwapService.createRequest(req.user.sub, req.user.companyId, dto);
  }

  // 2. Employee B responds (Accept / Reject)
  @Post(':id/respond')
  async respondToRequest(@Request() req, @Param('id') id: string, @Body() dto: RespondSwapRequestDto) {
    return this.shiftSwapService.respondToRequest(req.user.sub, id, dto.accept);
  }

  // 3. Manager approves / rejects the swap
  @Post(':id/approve')
  async approveRequest(@Request() req, @Param('id') id: string, @Body() dto: ApproveSwapRequestDto) {
    return this.shiftSwapService.approveRequest(req.user.sub, id, dto.approve);
  }

  // 4. Cancel a request (A, B, or Manager)
  @Post(':id/cancel')
  async cancelRequest(@Request() req, @Param('id') id: string, @Body() dto: RequestCancellationDto) {
    return this.shiftSwapService.cancelRequest(req.user.sub, req.user.role, id, dto.reason);
  }

  // 5. Target employee acknowledges a cancellation request (>24h before shift)
  @Post(':id/acknowledge-cancel')
  async acknowledgeCancellation(@Request() req, @Param('id') id: string) {
    return this.shiftSwapService.acknowledgeCancellation(req.user.sub, id);
  }

  // 6. Manager approves cancellation request
  @Post(':id/approve-cancel')
  async approveCancellation(@Request() req, @Param('id') id: string, @Body() dto: ApproveSwapRequestDto) {
    return this.shiftSwapService.approveCancellation(req.user.sub, req.user.role, id, dto.approve);
  }

  // 7. Get requests for the logged-in user (as Requester, Target, or Manager)
  @Get('my-requests')
  async getMyRequests(@Request() req) {
    return this.shiftSwapService.getMyRequests(req.user.sub, req.user.companyId, req.user.role);
  }
}
