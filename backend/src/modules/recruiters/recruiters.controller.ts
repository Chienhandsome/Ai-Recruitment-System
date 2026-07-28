import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RecruitersService } from './recruiters.service';
import { UpdateRecruiterProfileDto } from './dto/update-recruiter-profile.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';

@ApiTags('Recruiters')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('RECRUITER')
@Controller('recruiters')
export class RecruitersController {
  constructor(private readonly recruitersService: RecruitersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get the recruiter profile for the current user' })
  @ApiResponse({ status: 200, description: 'Return the recruiter profile' })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.recruitersService.getProfile(user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update the recruiter profile (title, company, department)' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateRecruiterProfileDto,
  ) {
    return this.recruitersService.updateProfile(user.id, dto);
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics for the recruiter company' })
  @ApiResponse({ status: 200, description: 'Return total active jobs, candidates, and new applications today' })
  async getDashboardStats(@CurrentUser() user: AuthenticatedUser) {
    return this.recruitersService.getDashboardStats(user.id);
  }
}
