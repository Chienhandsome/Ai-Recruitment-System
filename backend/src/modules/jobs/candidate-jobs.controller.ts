import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { QueryCandidateJobDto } from './dto/query-candidate-job.dto';
import { JobsService } from './jobs.service';

@ApiTags('Candidate Jobs')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('CANDIDATE')
@Controller('candidate/jobs')
export class CandidateJobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ApiOperation({ summary: 'Browse active published jobs as a candidate' })
  @ApiResponse({ status: 200, description: 'Return paginated active jobs' })
  findAll(@Query() query: QueryCandidateJobDto) {
    return this.jobsService.findCandidateJobs(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an active published job for a candidate' })
  @ApiResponse({
    status: 200,
    description: 'Return candidate-safe job details',
  })
  @ApiResponse({ status: 404, description: 'Job is unavailable' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.findCandidateJobById(id);
  }
}
