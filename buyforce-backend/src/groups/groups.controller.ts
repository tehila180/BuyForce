import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  // ✅ קבוצות פעילות לדף הבית (PUBLIC)
  @Get('featured')
  findFeatured() {
    return this.groupsService.findFeatured();
  }

  // ✅ קבוצות פתוחות למוצר (PUBLIC)
  @Get('product/:productId')
  getGroupsForProduct(@Param('productId') productId: string) {
    return this.groupsService.findOpenForProduct(Number(productId));
  }

  // ✅ הקבוצות שלי (חייב להיות לפני :id)
  @UseGuards(JwtAuthGuard)
  @Get('my')
  getMyGroups(@Req() req: any) {
    const userId = req.user.userId;
    return this.groupsService.findMyGroups(userId);
  }

  // ✅ יצירת קבוצה חדשה (LOGIN)
  @UseGuards(JwtAuthGuard)
  @Post()
  createGroup(
    @Body('productId') productId: number,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    return this.groupsService.createGroup(Number(productId), userId);
  }

  // ✅ הצטרפות לקבוצה (LOGIN)
  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  joinGroup(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.groupsService.joinGroup(Number(id), userId);
  }

  // ✅ תשלום לקבוצה (LOGIN)
  @UseGuards(JwtAuthGuard)
  @Post(':id/pay')
  payGroup(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.groupsService.payGroup(Number(id), userId);
  }

  // ✅ קבוצה אחת (LOGIN)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.groupsService.findOne(Number(id));
  }
}
