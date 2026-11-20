import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsBoolean,
  IsOptional,
  IsArray,
} from 'class-validator';

export type ScreeningQuestionType =
  'YES_NO' | 'NUMBER' | 'MULTIPLE_CHOICE' | 'TEXT';

export class ScreeningQuestionDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  question: string;

  @IsIn(['YES_NO', 'NUMBER', 'MULTIPLE_CHOICE', 'TEXT'])
  type: ScreeningQuestionType;

  @IsBoolean()
  required: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];
}
