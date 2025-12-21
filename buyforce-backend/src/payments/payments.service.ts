import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  // 💳 תשלום סופי
  async confirmPayment(
    userId: string,
    groupId: number,
    paypalOrderId: string,
  ) {
    const existing = await this.prisma.payment.findFirst({
      where: {
        userId,
        groupId,
        status: 'CAPTURED',
        type: 'FINAL',
      },
    });

    if (existing) {
      throw new BadRequestException('כבר שילמת');
    }

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: true,
        payments: true,
        product: true,
      },
    });

    if (!group) throw new BadRequestException('קבוצה לא נמצאה');

    await this.prisma.payment.create({
      data: {
        userId,
        groupId,
        amount: group.product.priceGroup,
        currency: 'ILS',
        provider: 'PAYPAL',
        status: 'CAPTURED',
        paypalOrderId,
        type: 'FINAL',
      },
    });

    const paidUsers = new Set(
      group.payments
        .filter(p => p.status === 'CAPTURED' && p.type === 'FINAL')
        .map(p => p.userId),
    );

    paidUsers.add(userId);

    if (paidUsers.size === group.members.length) {
      await this.prisma.group.update({
        where: { id: groupId },
        data: {
          status: 'paid',
          paidAt: new Date(),
        },
      });
    }

    return { success: true };
  }

  // 💳 תשלום ₪1 + הצטרפות
  async confirmJoinPayment(
    userId: string,
    groupId: number,
    paypalOrderId: string,
  ) {
    const isMember = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId },
      },
    });

    if (isMember) {
      throw new BadRequestException('כבר הצטרפת לקבוצה');
    }

    await this.prisma.payment.create({
      data: {
        userId,
        groupId,
        amount: 1,
        currency: 'ILS',
        provider: 'PAYPAL',
        status: 'CAPTURED',
        paypalOrderId,
        type: 'JOIN',
      },
    });

    await this.prisma.groupMember.create({
      data: {
        groupId,
        userId,
      },
    });

    const membersCount = await this.prisma.groupMember.count({
      where: { groupId },
    });

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (group && membersCount >= group.target) {
      await this.prisma.group.update({
        where: { id: groupId },
        data: { status: 'completed' },
      });
    }

    return { success: true };
  }
}
