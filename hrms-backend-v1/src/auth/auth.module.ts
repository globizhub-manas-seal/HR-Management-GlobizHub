import { EmailModule } from './../email/email.module';
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    // S-08: registerAsync throws at boot if JWT_SECRET is missing instead of
    //       silently falling back to the hardcoded insecure value.
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error(
            'JWT_SECRET is not configured. Set it in your .env file (minimum 32 characters).',
          );
        }
        return {
          secret,
          signOptions: { expiresIn: '1d' },
        };
      },
      inject: [ConfigService],
    }),
    EmailModule,
    AuditModule,
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
