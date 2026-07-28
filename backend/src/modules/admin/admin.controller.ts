import { Controller, Get, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Public } from '../auth/decorators/public.decorator';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { JobStatus, AccountStatus } from '@prisma/client';

@ApiTags('Admin Workspace')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Get real-time Admin Dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Return real-time metrics overview' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // --- JOB MODERATION ENDPOINTS ---

  @Public()
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
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Moderate job status (PUBLISHED, PAUSED, CLOSED, DRAFT)' })
  async updateJobStatus(
    @Param('id') id: string,
    @Body() body: { status: JobStatus },
  ) {
    return this.adminService.updateJobStatus(id, body.status);
  }

  @Delete('jobs/:id')
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Delete a job posting by Admin' })
  async deleteJob(@Param('id') id: string) {
    return this.adminService.deleteJob(id);
  }

  // --- USER MANAGEMENT ENDPOINTS ---

  @Public()
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
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Update user account status (ACTIVE, SUSPENDED, LOCKED)' })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() body: { status: AccountStatus },
  ) {
    return this.adminService.updateUserStatus(id, body.status);
  }

  @Delete('users/:id')
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Delete a user account' })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }
}
