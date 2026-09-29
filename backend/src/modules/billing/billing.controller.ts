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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { TalentPoolService } from './talent-pool.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryTalentPoolDto } from './dto/query-talent-pool.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Billing / Employer Packages')
@ApiBearerAuth()
@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly talentPoolService: TalentPoolService,
  ) {}

  @Get('packages')
  @Public()
  @ApiOperation({ summary: 'List active employer packages (public catalog)' })
  listPackages() {
    return this.billingService.listEmployerPackages(false);
  }

  @Get('me')
  @Roles('RECRUITER')
  @ApiOperation({ summary: 'Get current recruiter package entitlement status' })
  getMyStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.billingService.getMyStatus(user.id);
  }

  @Post('orders')
  @Roles('RECRUITER')
  @ApiOperation({ summary: 'Create a pending package order' })
  createOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrderDto,
  ) {
    return this.billingService.createOrder(user.id, dto);
  }

  @Get('orders')
  @Roles('RECRUITER')
  @ApiOperation({ summary: 'List my package orders' })
  listOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.billingService.listMyOrders(user.id);
  }

  @Get('orders/:orderId')
  @Roles('RECRUITER')
  @ApiOperation({ summary: 'Get package order detail' })
  getOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.billingService.getOrder(user.id, orderId);
  }

  @Post('orders/:orderId/checkout')
  @Roles('RECRUITER')
  @ApiOperation({ summary: 'Start sandbox checkout for an order' })
  @ApiResponse({ status: 200, description: 'Returns mock checkout URL' })
  checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.billingService.checkout(user.id, orderId);
  }

  @Post('orders/:orderId/mock-pay')
  @Roles('RECRUITER')
  @ApiOperation({
    summary: 'Confirm sandbox/mock payment and activate entitlement',
  })
  mockPay(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.billingService.confirmMockPayment(user.id, orderId);
  }

  @Get('transactions')
  @Roles('RECRUITER')
  @ApiOperation({ summary: 'List my payment transactions' })
  listTransactions(@CurrentUser() user: AuthenticatedUser) {
    return this.billingService.listMyTransactions(user.id);
  }

  @Get('talent-pool')
  @Roles('RECRUITER')
  @ApiOperation({
    summary: 'Search public talent pool (Premium). Contact info redacted until unlock.',
  })
  searchTalentPool(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryTalentPoolDto,
  ) {
    return this.talentPoolService.search(user.id, query);
  }

  @Get('talent-pool/:candidateProfileId')
  @Roles('RECRUITER')
  @ApiOperation({ summary: 'Get public talent profile (contact gated)' })
  getTalentProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('candidateProfileId', ParseUUIDPipe) candidateProfileId: string,
  ) {
    return this.talentPoolService.getCandidate(user.id, candidateProfileId);
  }

  @Post('talent-pool/:candidateProfileId/unlock')
  @Roles('RECRUITER')
  @ApiOperation({ summary: 'Unlock candidate contact from talent pool (Premium)' })
  unlockTalent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('candidateProfileId', ParseUUIDPipe) candidateProfileId: string,
  ) {
    return this.talentPoolService.unlock(user.id, candidateProfileId);
  }
}
