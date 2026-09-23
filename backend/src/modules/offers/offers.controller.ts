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
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { DeclineOfferDto } from './dto/decline-offer.dto';
import { RevokeOfferDto } from './dto/revoke-offer.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';

@ApiTags('Offers')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @Roles('RECRUITER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create and issue an official Offer to a candidate' })
  @ApiResponse({ status: 201, description: 'Offer created and application moved to OFFERED stage' })
  createOffer(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOfferDto,
  ) {
    return this.offersService.createOffer(user.id, dto);
  }

  @Get('application/:applicationId')
  @Roles('RECRUITER', 'CANDIDATE')
  @ApiOperation({ summary: 'Get offer details for a specific application' })
  getOfferByApplication(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    return this.offersService.getOfferByApplication(user.id, applicationId);
  }

  @Patch(':id')
  @Roles('RECRUITER')
  @ApiOperation({ summary: 'Update or revise offer terms (salary, dates, notes)' })
  updateOffer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOfferDto,
  ) {
    return this.offersService.updateOffer(user.id, id, dto);
  }

  @Post(':id/accept')
  @Roles('CANDIDATE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Candidate accepts official job offer -> moves to HIRED' })
  acceptOffer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.offersService.acceptOffer(user.id, id);
  }

  @Post(':id/decline')
  @Roles('CANDIDATE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Candidate declines job offer with reason' })
  declineOffer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeclineOfferDto,
  ) {
    return this.offersService.declineOffer(user.id, id, dto);
  }

  @Post(':id/revoke')
  @Roles('RECRUITER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recruiter revokes a pending offer -> reverts application to INTERVIEWED' })
  revokeOffer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevokeOfferDto,
  ) {
    return this.offersService.revokeOffer(user.id, id, dto?.reason);
  }
}
