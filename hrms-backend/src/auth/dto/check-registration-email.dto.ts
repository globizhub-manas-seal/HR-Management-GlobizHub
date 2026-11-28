import { IsEmail } from 'class-validator';

export class CheckRegistrationEmailDto {
  @IsEmail()
  email: string;
}
