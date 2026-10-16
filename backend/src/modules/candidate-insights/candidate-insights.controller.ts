import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CandidateInsightsService } from './candidate-insights.service';
import { CreateJdFitAnalysisDto } from './dto/create-jd-fit-analysis.dto';
import { CreateCandidateMockInterviewDto } from './dto/create-candidate-mock-interview.dto';

class LatestJdFitQueryDto {
  @IsUUID()
  jobId!: string;
}

class ListJdFitQueryDto {
  @IsOptional()
  @IsUUID()
  jobId?: string;
}

@ApiTags('Candidate Insights / Premium Features')
@ApiBearerAuth()
@Controller('candidate')
@Roles('CANDIDATE')
export class CandidateInsightsController {
  constructor(private readonly insights: CandidateInsightsService) {}

  @Post('insights/jd-fit')
  @ApiOperation({
    summary: 'Pro: analyze CV–JD fit + improvement suggestions (quota + idempotent)',
  })
  analyzeJdFit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateJdFitAnalysisDto,
  ) {
    return this.insights.analyzeJdFit(user.id, dto);
  }

  @Get('insights/jd-fit/latest')
  @ApiOperation({ summary: 'Latest saved JD-fit analysis for a job (no quota)' })
  getLatestJdFit(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: LatestJdFitQueryDto,
  ) {
    return this.insights.getLatestJdFitForJob(user.id, query.jobId);
  }

  @Get('insights/jd-fit')
  @ApiOperation({ summary: 'List my JD-fit analyses' })
  listJdFit(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListJdFitQueryDto,
  ) {
    return this.insights.listMyJdFitAnalyses(user.id, query.jobId);
  }

  @Post('mock-interviews')
  @ApiOperation({
    summary:
      'Premium: create AI mock interview for a published job (requires own application)',
  })
  createMockInterview(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCandidateMockInterviewDto,
  ) {
    return this.insights.createMockInterview(user.id, dto);
  }
}
