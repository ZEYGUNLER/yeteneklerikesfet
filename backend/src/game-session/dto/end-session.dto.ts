import { IsNotEmpty, IsNumber, IsOptional, IsString, IsObject } from 'class-validator';

export class EndSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
