import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaypalService } from './paypal.service';
import { getPayPalClient } from './paypal.client';
@Module({
  controllers: [PaymentsController],
  providers: [PrismaService, PaymentsService, PaypalService],
})
export class PaymentsModule {}
