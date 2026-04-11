import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/auth/current-user.decorator';
import { AuthenticatedUser } from 'src/common/auth/authenticated-user.interface';
import { JwtAuthGuard } from 'src/common/auth/jwt-auth.guard';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { WalletsService } from './wallets.service';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.walletsService.findAll(user);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateWalletDto) {
    return this.walletsService.create(user, body);
  }
}
