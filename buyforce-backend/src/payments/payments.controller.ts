import { Controller, Post, Get, Req, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('payments/paypal')
export class PaymentsController {
  constructor(private service: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
 @Post('paypal/create')
@UseGuards(JwtAuthGuard)
create(@Req() req, @Body('groupId') groupId: number) {
  return this.service.createPayPalOrder(req.user.id, groupId);
}

@Get('paypal/capture')
async capture(@Query('token') token: string) {
  return this.service.capturePayPalOrder(token);
}

}
