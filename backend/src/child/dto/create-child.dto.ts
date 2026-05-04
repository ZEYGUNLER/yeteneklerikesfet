import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateChildDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @Min(0)
  age!: number;
}

