import { EmailModule } from './../email/email.module';
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';


@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: 'SUPER_SECRET_HRMS_KEY_FOR_NOW', 
      signOptions: { expiresIn: '1d' },
    }),
    EmailModule,
  ],
  providers: [AuthService, JwtStrategy], // <-- Add JwtStrategy here
  controllers: [AuthController],
})
export class AuthModule {}