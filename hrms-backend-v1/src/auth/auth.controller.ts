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
import { AuthService } from './auth.service';
import { RegisterWizardDto } from './dto/register-wizard.dto';
import { AuthGuard } from './auth.guard';
import { SetPasswordDto } from './dto/set-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterWizardDto) {
    // Calling our new massive wizard transaction!
    return this.authService.registerWizard(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() signInDto: Record<string, any>) {
    return this.authService.login(signInDto.email, signInDto.password);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    // req.user is populated by the AuthGuard using your JWT token
    return this.authService.getProfile(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Patch('change-password')
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub, dto);
  }

  @Post('set-password')
  async setPassword(@Body() dto: SetPasswordDto) {
    return this.authService.setPassword(dto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: any) {
    return this.authService.resetPassword(body.token, body.password);
  }
}
