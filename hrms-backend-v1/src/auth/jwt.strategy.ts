// src/auth/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Expects token in the "Authorization: Bearer <token>" header
      ignoreExpiration: false, // Reject expired tokens automatically
      secretOrKey: 'SUPER_SECRET_HRMS_KEY_FOR_NOW', // MUST match the secret in auth.module.ts
    });
  }

  // NestJS automatically calls this if the token signature is valid
  async validate(payload: any) {
    // We return this object, and NestJS will automatically attach it to `req.user` in our controllers
    return {
      userId: payload.sub,
      email: payload.email,
      companyId: payload.companyId,
    };
  }
}
