import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EmailService],
  exports: [EmailService], // Export so AuthService can use it
})
export class EmailModule {}
