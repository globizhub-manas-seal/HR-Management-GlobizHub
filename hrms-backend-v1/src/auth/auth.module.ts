import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy'; // <-- Import this

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: 'SUPER_SECRET_HRMS_KEY_FOR_NOW', 
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, JwtStrategy], // <-- Add JwtStrategy here
  controllers: [AuthController],
})
export class AuthModule {}