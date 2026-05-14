import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

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
}
