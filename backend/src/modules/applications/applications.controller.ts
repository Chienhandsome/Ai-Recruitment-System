import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { QueryRecruiterApplicationsDto } from './dto/query-recruiter-applications.dto';
import { QueryMyApplicationsDto } from './dto/query-my-applications.dto';
import { UpdateApplicationStageDto } from './dto/update-application-stage.dto';

@ApiTags('Applications')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Roles('CANDIDATE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Apply for a job as a candidate' })
  @ApiResponse({
    status: 201,
    description: 'Application submitted successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Missing, unprocessed, or unauthorized resume.',
  })
  @ApiResponse({
    status: 404,
    description: 'Candidate profile or active job not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'Candidate already applied for this job.',
  })
  async apply(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationsService.applyForJob(user.id, dto);
  }

  @Get('me')
  @Roles('CANDIDATE')
  @ApiOperation({
    summary: 'List applications submitted by the current candidate',
  })
  findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryMyApplicationsDto,
  ) {
    return this.applicationsService.findMine(user.id, query);
  }

  @Get()
  @Roles('RECRUITER')
  @ApiOperation({
    summary: 'List applications available to the current recruiter',
  })
  findAllForRecruiter(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryRecruiterApplicationsDto,
  ) {
    return this.applicationsService.findAllForRecruiter(user.id, query);
  }

  @Get(':id')
  @Roles('RECRUITER')
  @ApiOperation({
    summary: 'Get a scoped application with AI evaluation details',
  })
  findOneForRecruiter(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.applicationsService.findOneForRecruiter(user.id, id);
  }

  @Patch(':id/stage')
  @Roles('RECRUITER')
  @ApiOperation({ summary: 'Move an application to another recruitment stage' })
  updateStage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationStageDto,
  ) {
    return this.applicationsService.updateStage(user.id, id, dto);
  }
}
