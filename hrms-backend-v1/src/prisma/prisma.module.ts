import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // This magic decorator makes Prisma available everywhere instantly
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // We must export it so other modules can use it
})
export class PrismaModule {}
