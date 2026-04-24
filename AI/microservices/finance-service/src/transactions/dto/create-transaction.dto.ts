import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class CreateTransactionDto {
  @Type(() => Number)
  @IsInt()
  walletId!: string;

  @Type(() => Number)
  @IsInt()
  categoryId!: string;

  @IsEnum(TransactionType)
  type!: TransactionType;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  receiptId?: number;

  @IsOptional()
  @IsString()
  sourceRefId?: string;

  @IsOptional()
  @IsString()
  merchantName?: string;

  @IsDateString()
  transactionDate!: string;
}
