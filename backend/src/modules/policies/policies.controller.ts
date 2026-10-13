import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PoliciesService } from './policies.service';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';

@ApiTags('Policies & Transparency')
@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all published system policies (Public)' })
  getAllPublished() {
    return this.policiesService.getAllPublished();
  }

  @Public()
  @Get(':code')
  @ApiOperation({ summary: 'Get policy content by unique code (Public)' })
  getByCode(@Param('code') code: string) {
    return this.policiesService.getByCode(code);
  }

  @Get('admin/all')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all policies including unpublished (Admin only)' })
  getAllForAdmin() {
    return this.policiesService.getAllForAdmin();
  }

  @Patch('admin/:code')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update and increment version of policy (Admin only)' })
  updatePolicy(
    @CurrentUser() user: AuthenticatedUser,
    @Param('code') code: string,
    @Body() dto: UpdatePolicyDto,
  ) {
    return this.policiesService.updatePolicy(user.id, code, dto);
  }
}
