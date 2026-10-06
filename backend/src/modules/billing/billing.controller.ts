import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PackageAudience } from '@prisma/client';
import { BillingService } from './billing.service';
import { TalentPoolService } from './talent-pool.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryTalentPoolDto } from './dto/query-talent-pool.dto';
import { Public } from '../auth/decorators/public.decorator';

/**
 * Shared billing HTTP surface. Candidate and HR both use BillingService core.
 * Talent-pool endpoints remain RECRUITER-only (HR feature), not imported by Candidate UI.
 */
@ApiTags('Billing')
@ApiBearerAuth()
@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly talentPoolService: TalentPoolService,
  ) {}

  @Get('packages')
  @Public()
  @ApiOperation({ summary: 'List active packages by audience' })
  @ApiQuery({
    name: 'audience',
    required: false,
    enum: PackageAudience,
    description: 'Default CANDIDATE for public catalog in Candidate demo',
  })
  listPackages(@Query('audience') audience?: string) {
    const resolved =
      audience === 'EMPLOYER'
        ? PackageAudience.EMPLOYER
        : PackageAudience.CANDIDATE;
    return this.billingService.listPackages(resolved, false);
  }

  @Get('me')
  @Roles('CANDIDATE', 'RECRUITER')
  @ApiOperation({ summary: 'Current package entitlement for caller role audience' })
  @ApiQuery({ name: 'audience', required: false, enum: PackageAudience })
  getMyStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Query('audience') audience?: string,
  ) {
    const resolved =
      audience === 'EMPLOYER'
        ? PackageAudience.EMPLOYER
        : audience === 'CANDIDATE'
          ? PackageAudience.CANDIDATE
          : PackageAudience.CANDIDATE;
    return this.billingService.getMyStatus(user.id, resolved);
  }

  @Post('orders')
  @Roles('CANDIDATE', 'RECRUITER')
  @ApiOperation({ summary: 'Create pending package order (audience inferred from package code)' })
  createOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrderDto,
  ) {
    return this.billingService.createOrder(user.id, dto);
  }

  @Get('orders')
  @Roles('CANDIDATE', 'RECRUITER')
  @ApiQuery({ name: 'audience', required: false, enum: PackageAudience })
  listOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query('audience') audience?: string,
  ) {
    const resolved =
      audience === 'EMPLOYER'
        ? PackageAudience.EMPLOYER
        : audience === 'CANDIDATE'
          ? PackageAudience.CANDIDATE
          : undefined;
    return this.billingService.listMyOrders(user.id, resolved);
  }

  @Get('orders/:orderId')
  @Roles('CANDIDATE', 'RECRUITER')
  getOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.billingService.getOrder(user.id, orderId);
  }

  @Post('orders/:orderId/checkout')
  @Roles('CANDIDATE', 'RECRUITER')
  @ApiOperation({ summary: 'Start sandbox checkout' })
  @ApiResponse({ status: 200, description: 'Returns mock checkout URL' })
  @ApiQuery({ name: 'path', required: false, description: 'Frontend base path e.g. /candidate/billing' })
  checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Query('path') path?: string,
  ) {
    const checkoutPath = path?.startsWith('/')
      ? path
      : '/candidate/billing';
    return this.billingService.checkout(user.id, orderId, checkoutPath);
  }

  @Post('orders/:orderId/mock-pay')
  @Roles('CANDIDATE', 'RECRUITER')
  @ApiOperation({
    summary: 'Confirm sandbox mock payment (disabled in production)',
  })
  mockPay(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.billingService.confirmMockPayment(user.id, orderId);
  }

  @Post('webhook/payos')
  @Public()
  @ApiOperation({
    summary: 'PayOS webhook notification for automated bank payment confirmation',
  })
  payosWebhook(@Body() body: any) {
    return this.billingService.handlePayosWebhook(body);
  }

  @Get('orders/check-status')
  @Roles('CANDIDATE', 'RECRUITER')
  @ApiOperation({ summary: 'Check payment status and sync with PayOS if needed' })
  @ApiQuery({ name: 'orderCode', required: true, description: 'orderCode or orderId' })
  checkOrderStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Query('orderCode') orderCode: string,
  ) {
    return this.billingService.checkPayosOrderStatus(user.id, orderCode);
  }

  @Get('transactions')
  @Roles('CANDIDATE', 'RECRUITER')
  @ApiQuery({ name: 'audience', required: false, enum: PackageAudience })
  listTransactions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('audience') audience?: string,
  ) {
    const resolved =
      audience === 'EMPLOYER'
        ? PackageAudience.EMPLOYER
        : audience === 'CANDIDATE'
          ? PackageAudience.CANDIDATE
          : undefined;
    return this.billingService.listMyTransactions(user.id, resolved);
  }

  // --- HR-only talent pool (kept; Candidate demo does not surface these) ---

  @Get('talent-pool')
  @Roles('RECRUITER')
  searchTalentPool(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryTalentPoolDto,
  ) {
    return this.talentPoolService.search(user.id, query);
  }

  @Get('talent-pool/:candidateProfileId')
  @Roles('RECRUITER')
  getTalentProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('candidateProfileId', ParseUUIDPipe) candidateProfileId: string,
  ) {
    return this.talentPoolService.getCandidate(user.id, candidateProfileId);
  }

  @Post('talent-pool/:candidateProfileId/unlock')
  @Roles('RECRUITER')
  unlockTalent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('candidateProfileId', ParseUUIDPipe) candidateProfileId: string,
  ) {
    return this.talentPoolService.unlock(user.id, candidateProfileId);
  }
}
