import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('payments/paypal')
@UseGuards(AuthGuard('jwt'))
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('confirm')
  async confirmPayment(
    @Req() req: any,
    @Body() body: { groupId: number; paypalOrderId: string },
  ) {
    return this.paymentsService.confirmPayment(
      req.user.userId, // ✅ תיקון קריטי
      body.groupId,
      body.paypalOrderId,
    );
  }
}
