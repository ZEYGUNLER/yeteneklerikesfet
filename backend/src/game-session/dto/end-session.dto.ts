import { IsNotEmpty, IsString } from 'class-validator';

export class EndSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;
}
