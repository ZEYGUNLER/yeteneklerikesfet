import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateChildDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsInt()
  @IsOptional()
  age?: number;

  @IsString()
  @IsNotEmpty()
  birthDate!: string;

  @IsString()
  @IsNotEmpty()
  gender!: string;

  @IsString()
  @IsNotEmpty()
  avatar!: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

