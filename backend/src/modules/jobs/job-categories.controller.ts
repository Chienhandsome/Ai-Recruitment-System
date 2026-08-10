import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Job Categories')
@Controller('job-categories')
export class JobCategoriesController {
  constructor(private readonly jobsService: JobsService) {}

  @Public()
  @UseInterceptors(CacheInterceptor)
  @Get()
  @ApiOperation({ summary: 'Get all job categories' })
  @ApiResponse({ status: 200, description: 'Return list of job categories' })
  async getJobCategories() {
    return this.jobsService.getJobCategories();
  }
}
