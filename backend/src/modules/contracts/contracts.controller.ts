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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { CandidateFeedbackDto } from './dto/candidate-feedback.dto';
import { ESignContractDto, UploadSignedContractDto } from './dto/sign-contract.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';

@ApiTags('Contracts')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @Roles('RECRUITER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create initial contract draft from application/offer' })
  @ApiResponse({ status: 201, description: 'Contract draft created' })
  createContract(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateContractDto,
  ) {
    return this.contractsService.createContract(user.id, dto);
  }

  @Get('application/:applicationId')
  @Roles('RECRUITER', 'CANDIDATE', 'ADMIN')
  @ApiOperation({ summary: 'Get contract details for an application' })
  getContractByApplication(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    return this.contractsService.getContractByApplication(user.id, applicationId);
  }

  @Get(':id')
  @Roles('RECRUITER', 'CANDIDATE', 'ADMIN')
  @ApiOperation({ summary: 'Get contract by contract ID' })
  getContractById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contractsService.getContractById(user.id, id);
  }

  @Patch(':id')
  @Roles('RECRUITER')
  @ApiOperation({ summary: 'Update contract draft terms (Recruiter only)' })
  updateContract(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContractDto,
  ) {
    return this.contractsService.updateContract(user.id, id, dto);
  }

  @Post(':id/send')
  @Roles('RECRUITER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send contract draft to candidate for review' })
  sendContract(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contractsService.sendContract(user.id, id);
  }

  @Post(':id/request-revision')
  @Roles('CANDIDATE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Candidate requests contract revisions with note' })
  requestRevision(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CandidateFeedbackDto,
  ) {
    return this.contractsService.requestRevision(user.id, id, dto);
  }

  @Post(':id/approve')
  @Roles('CANDIDATE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Candidate approves contract terms' })
  approveContract(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contractsService.approveContract(user.id, id);
  }

  @Post(':id/upload-signed')
  @Roles('RECRUITER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recruiter uploads manually signed scanned contract PDF' })
  uploadSignedContract(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UploadSignedContractDto,
  ) {
    return this.contractsService.uploadSignedContract(user.id, id, dto);
  }

  @Post(':id/e-sign')
  @Roles('RECRUITER', 'CANDIDATE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign contract electronically with digital signature' })
  eSignContract(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ESignContractDto,
  ) {
    return this.contractsService.eSignContract(user.id, id, dto);
  }
}
