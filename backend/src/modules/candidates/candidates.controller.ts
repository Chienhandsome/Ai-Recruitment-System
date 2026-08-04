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
import type { AuthenticatedUser } from '../auth/auth.types';

@ApiTags('Candidates')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

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
