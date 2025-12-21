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

  // ✅ קבוצות פעילות (דף בית)
  @Get('featured')
  findFeatured() {
    return this.groupsService.findFeatured();
  }

  // ✅ קבוצות פתוחות למוצר  ← זה מה שהיה חסר
  @Get('product/:productId')
  getGroupsForProduct(@Param('productId') productId: string) {
    return this.groupsService.findOpenForProduct(Number(productId));
  }

  // ✅ הקבוצות שלי
  @UseGuards(JwtAuthGuard)
  @Get('my')
  getMyGroups(@Req() req: any) {
    return this.groupsService.findMyGroups(req.user.userId);
  }

  // ✅ יצירת קבוצה  ← זה מה שהיה חסר
  @UseGuards(JwtAuthGuard)
  @Post()
  createGroup(
    @Body('productId') productId: number,
    @Req() req: any,
  ) {
    return this.groupsService.createGroup(productId, req.user.userId);
  }

  // ✅ הצטרפות לקבוצה
  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  joinGroup(@Param('id') id: string, @Req() req: any) {
    return this.groupsService.joinGroup(Number(id), req.user.userId);
  }

  // ✅ קבוצה אחת
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getOne(@Param('id') id: string, @Req() req: any) {
    return this.groupsService.findOne(Number(id), req.user.userId);
  }
}
