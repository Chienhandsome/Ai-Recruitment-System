import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CandidateInsightsService } from './candidate-insights.service';
import { CreateJdFitAnalysisDto } from './dto/create-jd-fit-analysis.dto';
import { CreateCandidateMockInterviewDto } from './dto/create-candidate-mock-interview.dto';

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

  @Get('insights/jd-fit')
  @ApiOperation({ summary: 'List my JD-fit analyses' })
  listJdFit(@CurrentUser() user: AuthenticatedUser) {
    return this.insights.listMyJdFitAnalyses(user.id);
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
