import { IsNotEmpty, IsString } from 'class-validator';

export class StartSessionDto {
  @IsString()
  @IsNotEmpty()
  childId!: string;

  @IsString()
  @IsNotEmpty()
  gameId!: string;
}
