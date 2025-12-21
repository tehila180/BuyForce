import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  // ✅ הקבוצות שלי + האם המשתמש שילם
  async findMyGroups(userId: string) {
    const memberships = await this.prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            product: true,
            members: true,
            payments: true,
          },
        },
      },
    });

    return memberships.map(m => {
      const hasPaid = m.group.payments.some(
        p => p.userId === userId && p.status === 'CAPTURED',
      );

      return {
        group: {
          id: m.group.id,
          status: m.group.status,
          target: m.group.target,
          members: m.group.members,
          product: m.group.product,
        },
        hasPaid,
      };
    });
  }

  // ✅ יצירת קבוצה
  async createGroup(productId: number, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) throw new NotFoundException('המוצר לא נמצא');

      const group = await tx.group.create({
        data: { productId, status: 'open' },
      });

      await tx.groupMember.create({
        data: { groupId: group.id, userId },
      });

      return group;
    });
  }

  // ✅ הצטרפות לקבוצה + סגירה אוטומטית
  async joinGroup(groupId: number, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.groupMember.upsert({
        where: { groupId_userId: { groupId, userId } },
        update: {},
        create: { groupId, userId },
      });

      const group = await tx.group.findUnique({
        where: { id: groupId },
        include: { members: true },
      });

      if (!group) throw new NotFoundException('קבוצה לא נמצאה');

      if (group.members.length >= group.target) {
        await tx.group.update({
          where: { id: groupId },
          data: { status: 'completed' },
        });
      }

      return group;
    });
  }

  // ✅ קבוצה אחת + האם המשתמש שילם
  async findOne(groupId: number, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        product: true,
        members: { include: { user: true } },
        payments: true,
      },
    });

    if (!group) throw new NotFoundException('קבוצה לא נמצאה');

    const hasPaid = group.payments.some(
      p => p.userId === userId && p.status === 'CAPTURED',
    );

    return {
      ...group,
      hasPaid,
    };
  }

  // ✅ קבוצות פעילות לדף הבית
  async findFeatured() {
    return this.prisma.group.findMany({
      where: { status: 'open' },
      include: { product: true, members: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
