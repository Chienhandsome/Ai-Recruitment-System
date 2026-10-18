import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CandidatesService } from './candidates.service';
import { UpdateCandidateSkillsDto } from './dto/update-candidate-skills.dto';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CandidateJobSeekingService } from './candidate-job-seeking.service';
import { UpdateJobSeekingDto } from './dto/update-job-seeking.dto';
import type { AuthenticatedUser } from '../auth/auth.types';

@ApiTags('Candidates')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('candidates')
export class CandidatesController {
  constructor(
    private readonly candidatesService: CandidatesService,
    private readonly jobSeeking: CandidateJobSeekingService,
  ) {}

  @Get('me/job-seeking')
  @UseGuards(RolesGuard)
  @Roles('CANDIDATE')
  @ApiOperation({ summary: 'Get current job-seeking visibility and eligibility' })
  getJobSeeking(@CurrentUser() user: AuthenticatedUser) {
    return this.jobSeeking.getStatus(user.id);
  }

  @Patch('me/job-seeking')
  @UseGuards(RolesGuard)
  @Roles('CANDIDATE')
  @ApiOperation({ summary: 'Opt in to paid talent-pool visibility or withdraw consent' })
  updateJobSeeking(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateJobSeekingDto) {
    return this.jobSeeking.update(user.id, dto);
  }

  // ─── Profile ────────────────────────────────────────────────────────

  @Patch('me/profile')
  @ApiOperation({ summary: 'Update current candidate profile information' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCandidateProfileDto,
  ) {
    return this.candidatesService.updateProfile(user.id, dto);
  }

  // ─── Skills ─────────────────────────────────────────────────────────

  @Get('me/skills')
  @ApiOperation({ summary: 'Get current candidate skills' })
  @ApiResponse({
    status: 200,
    description: 'List of candidate skills with skill details',
  })
  async getMySkills(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.candidatesService.getResolvedProfileByUserId(
      user.id,
    );
    return this.candidatesService.getCandidateSkills(profile.id);
  }

  @Put('me/skills')
  @ApiOperation({ summary: 'Update the candidate unified skill list' })
  @ApiResponse({ status: 200, description: 'Updated list of candidate skills' })
  async updateMySkills(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCandidateSkillsDto,
  ) {
    const profile = await this.candidatesService.getResolvedProfileByUserId(
      user.id,
    );
    return this.candidatesService.updateCandidateSkills(profile.id, dto);
  }

  @Delete('me/skills/:skillId')
  @ApiOperation({ summary: 'Remove a candidate-owned or AI-extracted skill' })
  @ApiResponse({ status: 200, description: 'Skill removed successfully' })
  async removeMySkill(
    @CurrentUser() user: AuthenticatedUser,
    @Param('skillId', ParseUUIDPipe) skillId: string,
  ) {
    const profile = await this.candidatesService.getResolvedProfileByUserId(
      user.id,
    );
    await this.candidatesService.removeCandidateSkill(profile.id, skillId);
    return { message: 'Skill removed successfully' };
  }
}
