import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Express, Response } from 'express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { DisputeStatus } from '@prisma/client';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { RespondDisputeDto } from './dto/respond-dispute.dto';
import { AcknowledgeDisputeDto } from './dto/acknowledge-dispute.dto';
import { CloseDisputeDto } from './dto/close-dispute.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@ApiTags('Disputes & Reports')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post('upload-evidence')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload tamper-proof evidence files or images (max 15MB each, up to 10 files)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  uploadEvidence(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.disputesService.uploadEvidenceFiles(user.id, files);
  }

  @Public()
  @Get('evidence-file/:fileName')
  @ApiOperation({ summary: 'Stream an immutable evidence file/image securely' })
  streamEvidenceFile(
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    return this.disputesService.streamEvidenceFile(fileName, res);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a new dispute or report against offer/contract/recruiter' })
  createDispute(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDisputeDto,
  ) {
    return this.disputesService.createDispute(user.id, dto);
  }

  @Get('application/:applicationId')
  @ApiOperation({ summary: 'Get disputes for an application' })
  getDisputesByApplication(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    return this.disputesService.getDisputesByApplication(user.id, applicationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single dispute details by ID with timeline and relations' })
  getDisputeById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.disputesService.getDisputeById(user.id, id);
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit explanation, response, or appeal on a dispute' })
  respondDispute(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondDisputeDto,
  ) {
    return this.disputesService.respondDispute(user.id, id, dto);
  }

  @Get('admin/all')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all disputes for Admin investigation' })
  @ApiQuery({ name: 'status', required: false, enum: DisputeStatus })
  getAdminDisputes(@Query('status') status?: DisputeStatus) {
    return this.disputesService.getAdminDisputes(status);
  }

  @Patch('admin/:id/resolve')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin issues resolution / penalty on dispute' })
  resolveDispute(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.disputesService.resolveDispute(user.id, id, dto);
  }

  @Post(':id/acknowledge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Candidate or Recruiter acknowledges and accepts the dispute verdict' })
  acknowledgeDispute(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AcknowledgeDisputeDto,
  ) {
    return this.disputesService.acknowledgeDispute(user.id, id, dto);
  }

  @Post('admin/:id/close')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin officially closes and archives the dispute case' })
  closeDispute(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseDisputeDto,
  ) {
    return this.disputesService.closeDispute(user.id, id, dto);
  }
}

