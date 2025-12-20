import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  // ===============================
  // הקבוצות שלי + hasPaid
  // ===============================
  async findMyGroups(userId: string) {
    const groupMembers = await this.prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            product: true,
            members: true,
            payments: true, // ⬅️ קריטי
          },
        },
      },
    });

    return groupMembers.map((gm) => ({
      group: {
        id: gm.group.id,
        status: gm.group.status,
        target: gm.group.target,
        members: gm.group.members,
        product: gm.group.product,
      },

      // ⬅️ האם המשתמש שילם
      hasPaid: gm.group.payments.some(
        (p) => p.userId === userId && p.status === 'CAPTURED',
      ),
    }));
  }

  // ===============================
  // יצירת קבוצה
  // ===============================
  async createGroup(productId: number, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('המוצר לא נמצא');
    }

    const group = await this.prisma.group.create({
      data: {
        productId,
        status: 'open',
        target: 3,
        members: {
          create: {
            userId,
          },
        },
      },
    });

    return group;
  }

  // ===============================
  // הצטרפות לקבוצה
  // ===============================
  async joinGroup(groupId: number, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      throw new NotFoundException('קבוצה לא נמצאה');
    }

    if (group.status !== 'open') {
      throw new BadRequestException('לא ניתן להצטרף לקבוצה זו');
    }

    const alreadyMember = group.members.some(
      (m) => m.userId === userId,
    );

    if (alreadyMember) {
      throw new BadRequestException('כבר הצטרפת לקבוצה');
    }

    await this.prisma.groupMember.create({
      data: {
        groupId,
        userId,
      },
    });

    // אם הגענו ליעד – סוגרים להצטרפות
    if (group.members.length + 1 >= group.target) {
      await this.prisma.group.update({
        where: { id: groupId },
        data: { status: 'completed' },
      });
    }

    return { success: true };
  }

  // ===============================
  // קבוצות פתוחות למוצר (Public)
  // ===============================
  async findOpenForProduct(productId: number) {
    return this.prisma.group.findMany({
      where: {
        productId,
        status: 'open',
      },
      include: {
        members: true,
      },
    });
  }

  // ===============================
  // קבוצה אחת
  // ===============================
  async findOne(groupId: number) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        product: true,
        members: {
          include: { user: true },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('קבוצה לא נמצאה');
    }

    return group;
  }

  // ===============================
  // קבוצות Featured
  // ===============================
  async findFeatured() {
    return this.prisma.group.findMany({
      where: {
        status: 'open',
      },
      include: {
        product: true,
        members: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
