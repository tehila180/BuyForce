// src/payments/payments.controller.ts
import { Controller, Post, Get, Body, Query, Req, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('payments/paypal')
@UseGuards(AuthGuard('jwt'))
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post('create')
  create(@Req() req: any, @Body('groupId') groupId: number) {
    return this.payments.createPayPalOrder(req.user.id, Number(groupId));
  }

  @Get('capture')
  capture(@Req() req: any, @Query('token') token: string) {
    return this.payments.capturePayPalOrder(req.user.id, token);
  }
}
