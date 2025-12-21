import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async confirmPayment(
    userId: string,
    groupId: number,
    paypalOrderId: string,
  ) {
    // 1️⃣ בדיקה: כבר שילם?
    const existing = await this.prisma.payment.findFirst({
      where: {
        userId,
        groupId,
        status: 'CAPTURED',
      },
    });

    if (existing) {
      throw new BadRequestException('User already paid');
    }

    // 2️⃣ קבוצה + חברים
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        product: true,
        members: true,
        payments: true,
      },
    });

    if (!group) {
      throw new BadRequestException('Group not found');
    }

    // 3️⃣ בדיקה: המשתמש חבר בקבוצה
    const isMember = group.members.some(m => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('User is not a member of this group');
    }

    // 4️⃣ יצירת תשלום
    const payment = await this.prisma.payment.create({
      data: {
        provider: 'PAYPAL', // ✅ עקבי
        status: 'CAPTURED',
        userId,
        groupId,
        amount: group.product.priceGroup,
        currency: 'ILS',
        paypalOrderId,
      },
    });

    // 5️⃣ האם כולם שילמו?
    const paidUsers = new Set(
      [...group.payments, payment]
        .filter(p => p.status === 'CAPTURED')
        .map(p => p.userId),
    );

    if (paidUsers.size === group.members.length) {
      await this.prisma.group.update({
        where: { id: group.id },
        data: {
          status: 'paid',
          paidAt: new Date(),
        },
      });
    }

    return { success: true };
  }
}
