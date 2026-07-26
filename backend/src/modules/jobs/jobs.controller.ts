import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Query 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobDto } from './dto/query-job.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';

@ApiTags('Jobs')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('RECRUITER')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new job posting' })
  @ApiResponse({ status: 201, description: 'Job created successfully' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createJobDto: CreateJobDto
  ) {
    return this.jobsService.create(user.id, createJobDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all job postings for the current recruiter/company' })
  @ApiResponse({ status: 200, description: 'Return paginated list of jobs' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryJobDto
  ) {
    return this.jobsService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific job posting by ID' })
  @ApiResponse({ status: 200, description: 'Return job posting details' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    return this.jobsService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a job posting (or change its status)' })
  @ApiResponse({ status: 200, description: 'Job updated successfully' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto
  ) {
    return this.jobsService.update(user.id, id, updateJobDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a DRAFT job posting' })
  @ApiResponse({ status: 200, description: 'Job deleted successfully' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    return this.jobsService.remove(user.id, id);
  }
}
