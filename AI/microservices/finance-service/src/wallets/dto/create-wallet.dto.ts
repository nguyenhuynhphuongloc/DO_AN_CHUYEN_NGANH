import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  initialBalance!: number;
}
