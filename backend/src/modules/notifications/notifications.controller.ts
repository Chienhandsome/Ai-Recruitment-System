import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationStatus } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thông báo của người dùng hiện tại' })
  async findMyNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: NotificationStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationsService.findMyNotifications(user.id, {
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Lấy số lượng thông báo chưa đọc (để hiển thị dấu chấm đỏ/badge)' })
  async getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đánh dấu một thông báo là đã đọc' })
  async markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationsService.markAsRead(user.id, id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo của người dùng là đã đọc' })
  async markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Patch('application/:applicationId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo thuộc một đơn ứng tuyển là đã đọc' })
  async markByApplicationId(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    return this.notificationsService.markByApplicationId(user.id, applicationId);
  }
}
