import { Module } from '@nestjs/common';
import { PlatformSystemController } from './platform-system.controller';
import { PlatformAuthModule } from '../auth/platform-auth.module';

@Module({
  imports: [PlatformAuthModule],
  controllers: [PlatformSystemController],
})
export class PlatformSystemModule {}
