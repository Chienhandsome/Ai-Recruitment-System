import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { SupabaseAuthService } from '../auth/supabase-auth.service';
import { QueryCandidateJobDto } from './dto/query-candidate-job.dto';
import { JobsService } from './jobs.service';

@ApiTags('Candidate Jobs')
@ApiBearerAuth()
@Controller('candidate/jobs')
export class CandidateJobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly supabaseAuthService: SupabaseAuthService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Browse active published jobs (Public)' })
  @ApiResponse({ status: 200, description: 'Return paginated active jobs' })
  findAll(@Query() query: QueryCandidateJobDto) {
    return this.jobsService.findCandidateJobs(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get an active published job for a candidate or guest' })
  @ApiResponse({
    status: 200,
    description: 'Return candidate-safe job details',
  })
  @ApiResponse({ status: 404, description: 'Job is unavailable' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    let userId: string | null = null;
    const authHeader = req.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length).trim();
      if (token) {
        try {
          const authUser = await this.supabaseAuthService.verifyAccessToken(token);
          userId = authUser.id;
        } catch {
          userId = null;
        }
      }
    }
    return this.jobsService.findCandidateJobById(id, userId);
  }
}
