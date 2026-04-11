import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/auth/current-user.decorator';
import { AuthenticatedUser } from 'src/common/auth/authenticated-user.interface';
import { JwtAuthGuard } from 'src/common/auth/jwt-auth.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.transactionsService.findAll(user);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateTransactionDto) {
    return this.transactionsService.create(user, body);
  }
}
