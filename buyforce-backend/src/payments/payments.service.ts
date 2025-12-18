import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paypalClient } from './paypal.client';
import * as paypal from '@paypal/checkout-server-sdk';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async createPayPalOrder(userId: string, groupId: number) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { product: true },
    });

    if (!group) throw new Error('Group not found');

    const amount = group.product.priceGroup;

    // 1. Payment DB
    const payment = await this.prisma.payment.create({
      data: {
        provider: 'PAYPAL',
        userId,
        groupId,
        amount,
        currency: 'ILS',
      },
    });

    // 2. PayPal order
    const client = getPayPalClient();
    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'ILS',
            value: (amount / 100).toFixed(2),
          },
        },
      ],
    });

    const response = await client.execute(request);

    // 3. save PayPal orderId
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { paypalOrderId: response.result.id },
    });

    return response.result;
  }

  async capturePayPalOrder(orderId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { paypalOrderId: orderId },
    });

    if (!payment) throw new Error('Payment not found');

    const client = getPayPalClient();
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    const response = await client.execute(request);

    // update payment
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'CAPTURED', paypalCaptureId: response.result.id },
    });

    // 🔒 בדיקה אם כולם שילמו
    await this.checkAndCloseGroup(payment.groupId);

    return response.result;
  }

  async checkAndCloseGroup(groupId: number) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true, payments: true },
    });

    const paidUsers = group.payments.filter(
      p => p.status === 'CAPTURED'
    ).length;

    if (paidUsers === group.members.length) {
      await this.prisma.group.update({
        where: { id: groupId },
        data: { status: 'paid', paidAt: new Date() },
      });
    }
  }
}

