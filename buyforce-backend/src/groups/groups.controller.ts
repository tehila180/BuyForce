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

  // PUBLIC
  @Get('featured')
  findFeatured() {
    return this.groupsService.findFeatured();
  }

  // MY GROUPS
  @UseGuards(JwtAuthGuard)
  @Get('my')
  getMyGroups(@Req() req: any) {
    return this.groupsService.findMyGroups(req.user.userId);
  }

  // CREATE
  @UseGuards(JwtAuthGuard)
  @Post()
  createGroup(@Body('productId') productId: number, @Req() req: any) {
    return this.groupsService.createGroup(productId, req.user.userId);
  }

  // JOIN
  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  joinGroup(@Param('id') id: string, @Req() req: any) {
    return this.groupsService.joinGroup(Number(id), req.user.userId);
  }

  // ONE GROUP
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getOne(@Param('id') id: string, @Req() req: any) {
    return this.groupsService.findOne(Number(id), req.user.userId);
  }
}
