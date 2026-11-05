// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
  Patch,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterWizardDto } from './dto/register-wizard.dto';
import { AuthGuard } from './auth.guard';
import { SetPasswordDto } from './dto/set-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CheckRegistrationEmailDto } from './dto/check-registration-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterWizardDto) {
    return this.authService.registerWizard(dto);
  }

  @Post('check-registration-email')
  async checkRegistrationEmail(@Body() dto: CheckRegistrationEmailDto) {
    return this.authService.checkRegistrationEmail(dto.email);
  }

  // S-09: Strict throttle — 5 attempts per minute to mitigate brute force
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() signInDto: Record<string, any>) {
    return this.authService.login(signInDto.email, signInDto.password);
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Request() req) {
    return this.authService.logout(req.user.sub, req.user.companyId);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfileAlias(@Request() req) {
    return this.authService.getProfile(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Get('me/permissions')
  async getPermissions(@Request() req) {
    return this.authService.getPermissions(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Patch('change-password')
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub, dto);
  }

  // S-09: Strict throttle — invite links are single-use; limit replay attempts
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('set-password')
  async setPassword(@Body() dto: SetPasswordDto) {
    return this.authService.setPassword(dto);
  }

  // S-09: Strict throttle — limits email enumeration and abuse
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  // S-09: Strict throttle — limit brute-force on reset token
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }
}
