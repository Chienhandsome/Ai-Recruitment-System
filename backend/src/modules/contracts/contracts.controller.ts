import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import {
  ContractSigningMethod,
  ContractStatus,
  WarrantyClaimStatus,
} from '@prisma/client';
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
import {
  ESignContractDto,
  RequestContractOtpDto,
  UploadSignedContractDto,
} from './dto/sign-contract.dto';
import {
  ClaimWarrantyDto,
  CandidateWarrantyFeedbackDto,
  AdminResolveWarrantyDto,
} from './dto/claim-warranty.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
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

  @Get('admin/all')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Get all contracts with forensic filters' })
  getAdminContracts(
    @Query('search') search?: string,
    @Query('signingMethod') signingMethod?: ContractSigningMethod,
    @Query('status') status?: ContractStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.contractsService.getAdminContracts({
      search,
      signingMethod,
      status,
      page,
      limit,
    });
  }

  @Get('admin/:id/forensics')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Get in-depth contract forensic investigation dossier' })
  getContractForensics(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contractsService.getContractForensics(id);
  }

  @Get('admin/warranty-claims')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Get all B2B recruitment warranty claims with filters and metrics' })
  getAdminWarrantyClaims(
    @Query('status') status?: WarrantyClaimStatus,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.contractsService.getAdminWarrantyClaims({
      status,
      search,
      page,
      limit,
    });
  }

  @Get('admin/warranty-claims/:claimId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Get single recruitment warranty claim detail with full contract dossier' })
  getAdminWarrantyClaimDetail(
    @Param('claimId', ParseUUIDPipe) claimId: string,
  ) {
    return this.contractsService.getAdminWarrantyClaimDetail(claimId);
  }

  @Post('admin/warranty-claims/:claimId/approve')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Approve recruitment warranty claim, reimburse +1 CV credit and extend job' })
  adminApproveWarranty(
    @CurrentUser() user: AuthenticatedUser,
    @Param('claimId', ParseUUIDPipe) claimId: string,
    @Body() dto: AdminResolveWarrantyDto,
  ) {
    return this.contractsService.adminApproveWarranty(user.id, claimId, dto);
  }

  @Post('admin/warranty-claims/:claimId/reject')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Reject recruitment warranty claim with justification' })
  adminRejectWarranty(
    @CurrentUser() user: AuthenticatedUser,
    @Param('claimId', ParseUUIDPipe) claimId: string,
    @Body() dto: AdminResolveWarrantyDto,
  ) {
    return this.contractsService.adminRejectWarranty(user.id, claimId, dto);
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
    @Req() req: Request,
  ) {
    const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'Web Browser';

    return this.contractsService.uploadSignedContract(user.id, id, dto, {
      ip: rawIp,
      userAgent,
    });
  }

  @Post(':id/upload-signed-scan')
  @Roles('RECRUITER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recruiter uploads signed scanned contract images/files (multiple pages)' })
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      limits: { fileSize: 15 * 1024 * 1024 }, // 15MB per file
    }),
  )
  uploadSignedScanFiles(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('note') note: string,
    @Req() req: Request,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một file ảnh hoặc PDF bản scan hợp đồng.');
    }

    const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'Web Browser';

    return this.contractsService.uploadSignedContractFiles(user.id, id, files, note, {
      ip: rawIp,
      userAgent,
    });
  }

  @Get(':id/scan-page/:pageNumber')
  @Roles('RECRUITER', 'CANDIDATE', 'ADMIN')
  @ApiOperation({ summary: 'Serve an individual page image of a scanned contract' })
  getScanPage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('pageNumber', ParseIntPipe) pageNumber: number,
    @Res() res: Response,
  ) {
    return this.contractsService.streamScanPage(user.id, id, pageNumber, res);
  }

  @Post(':id/request-otp')
  @Roles('RECRUITER', 'CANDIDATE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request 6-digit OTP code to verify signer identity before e-signing' })
  requestContractOtp(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestContractOtpDto,
  ) {
    return this.contractsService.requestContractOtp(user.id, id, dto?.email);
  }

  @Post(':id/e-sign')
  @Roles('RECRUITER', 'CANDIDATE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign contract electronically with digital signature & OTP verification (DocuSign Model)' })
  eSignContract(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ESignContractDto,
    @Req() req: Request,
  ) {
    const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'Web Browser';

    return this.contractsService.eSignContract(user.id, id, dto, {
      ip: rawIp,
      userAgent,
    });
  }

  @Public()
  @Get('verify/:contractNumber')
  @ApiOperation({ summary: 'Public contract verification & SHA-256 seal integrity check' })
  verifyContract(
    @Param('contractNumber') contractNumber: string,
  ) {
    return this.contractsService.verifyContractPublic(contractNumber);
  }

  @Get(':id/warranty/status')
  @Roles('RECRUITER', 'CANDIDATE', 'ADMIN')
  @ApiOperation({ summary: 'Check recruitment warranty status and eligibility for a signed contract' })
  getWarrantyStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contractsService.getWarrantyStatus(user.id, id);
  }

  @Post(':id/warranty/claim')
  @Roles('RECRUITER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit a recruitment warranty claim (No-Show or Early Resignation within 30 days)' })
  claimWarranty(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ClaimWarrantyDto,
  ) {
    return this.contractsService.claimWarranty(user.id, id, dto);
  }

  @Post(':id/warranty/candidate-feedback')
  @Roles('CANDIDATE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Candidate submits counter-explanation or confirmation regarding warranty claim' })
  candidateRespondWarranty(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CandidateWarrantyFeedbackDto,
  ) {
    return this.contractsService.candidateRespondWarranty(user.id, id, dto);
  }
}
