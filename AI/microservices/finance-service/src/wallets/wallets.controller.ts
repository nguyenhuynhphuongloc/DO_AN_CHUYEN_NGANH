import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { WalletsService } from './wallets.service';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  findAll() {
    return this.walletsService.findAll();
  }

  @Post()
  create(@Body() body: CreateWalletDto) {
    return this.walletsService.create(body);
  }
}
