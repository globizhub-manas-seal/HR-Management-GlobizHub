import { Module } from '@nestjs/common';
import { ShiftSwapService } from './shift-swap.service';
import { ShiftSwapController } from './shift-swap.controller';

@Module({
  providers: [ShiftSwapService],
  controllers: [ShiftSwapController],
  exports: [ShiftSwapService],
})
export class ShiftSwapModule {}
