import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  UpdateAdminAccountStatusDto,
  UpdateAdminJobStatusDto,
} from './dto/update-admin-status.dto';

@ApiTags('Admin Workspace')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get real-time Admin Dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Return real-time metrics overview',
  })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // --- JOB MODERATION ENDPOINTS ---

  @Get('jobs')
  @ApiOperation({ summary: 'Get all jobs for Admin moderation' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getAdminJobs(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAdminJobs(status, search);
  }

  @Patch('jobs/:id/status')
  @ApiOperation({
    summary: 'Moderate job status (PUBLISHED, PAUSED, CLOSED, DRAFT)',
  })
  async updateJobStatus(
    @Param('id') id: string,
    @Body() body: UpdateAdminJobStatusDto,
  ) {
    return this.adminService.updateJobStatus(id, body.status);
  }

  @Delete('jobs/:id')
  @ApiOperation({ summary: 'Delete a job posting by Admin' })
  async deleteJob(@Param('id') id: string) {
    return this.adminService.deleteJob(id);
  }

  // --- USER MANAGEMENT ENDPOINTS ---

  @Get('users')
  @ApiOperation({ summary: 'Get all users for Admin management' })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getAdminUsers(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAdminUsers(role, status, search);
  }

  @Patch('users/:id/status')
  @ApiOperation({
    summary: 'Update user account status (ACTIVE, SUSPENDED, LOCKED)',
  })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() body: UpdateAdminAccountStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, body.status);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user account' })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }
}
