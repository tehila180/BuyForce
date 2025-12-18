// src/payments/payments.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getPayPalClient } from './paypal.client';
import * as paypal from '@paypal/checkout-server-sdk';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async createPayPalOrder(userId: string, groupId: number) {
  const existing = await this.prisma.payment.findFirst({
    where: { userId, groupId, status: 'CAPTURED' },
  });

  if (existing) {
    throw new BadRequestException('User already paid');
  }

  const group = await this.prisma.group.findUnique({
    where: { id: groupId },
    include: { product: true },
  });

  if (!group) throw new Error('Group not found');

  const amount = group.product.priceGroup;

  const payment = await this.prisma.payment.create({
    data: {
      provider: 'PAYPAL',
      userId,
      groupId,
      amount,
      currency: 'ILS',
      status: 'CREATED',
    },
  });

  const client = getPayPalClient();
  const request = new paypal.orders.OrdersCreateRequest();

  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: 'ILS',
          value: amount.toFixed(2),
        },
      },
    ],
  });

  const response = await client.execute(request);

  await this.prisma.payment.update({
    where: { id: payment.id },
    data: { paypalOrderId: response.result.id },
  });

  return response.result;
}


  async capturePayPalOrder(userId: string, orderId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { paypalOrderId: orderId },
    });

    if (!payment) throw new BadRequestException('Payment not found');
    if (payment.userId !== userId) throw new BadRequestException('Not your payment');

    const client = getPayPalClient();
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const response = await client.execute(request);

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'CAPTURED',
        paypalCaptureId: response.result?.id ?? null,
      },
    });

    await this.checkAndCloseGroup(payment.groupId);

    return response.result;
  }

  private async checkAndCloseGroup(groupId: number) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true, payments: true },
    });
    if (!group) return;

    // ✅ לא סוגרים קבוצה לפני שמלאה (target)
    if (group.members.length < group.target) return;

    const paidUserIds = new Set(
      group.payments
        .filter((p) => p.status === 'CAPTURED')
        .map((p) => p.userId),
    );

    // ✅ כולם שילמו (כל מי שחבר בקבוצה)
    if (paidUserIds.size === group.members.length) {
      await this.prisma.group.update({
        where: { id: group.id },
        data: { status: 'paid', paidAt: new Date() },
      });
    }
  }
}
