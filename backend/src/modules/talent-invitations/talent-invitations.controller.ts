import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import {
  AcceptTalentInvitationDto,
  CreateTalentInvitationDto,
  QueryTalentInvitationsDto,
} from './dto/talent-invitation.dto';
import { TalentInvitationsService } from './talent-invitations.service';

@ApiTags('Talent invitations')
@ApiBearerAuth()
@Controller('talent-invitations')
export class TalentInvitationsController {
  constructor(private readonly invitations: TalentInvitationsService) {}

  @Get('recruiter')
  @Roles('RECRUITER')
  recruiterList(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryTalentInvitationsDto,
  ) {
    return this.invitations.listForRecruiter(user.id, query);
  }

  @Get('recruiter/jobs')
  @Roles('RECRUITER')
  jobs(@CurrentUser() user: AuthenticatedUser) {
    return this.invitations.availableJobs(user.id);
  }

  @Post('recruiter')
  @Roles('RECRUITER')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTalentInvitationDto,
  ) {
    return this.invitations.create(user.id, dto);
  }

  @Post('recruiter/:id/withdraw')
  @Roles('RECRUITER')
  withdraw(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invitations.withdraw(user.id, id);
  }

  @Get('candidate')
  @Roles('CANDIDATE')
  candidateList(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryTalentInvitationsDto,
  ) {
    return this.invitations.listForCandidate(user.id, query);
  }

  @Get('candidate/resumes')
  @Roles('CANDIDATE')
  resumes(@CurrentUser() user: AuthenticatedUser) {
    return this.invitations.availableResumes(user.id);
  }

  @Post('candidate/:id/accept')
  @Roles('CANDIDATE')
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AcceptTalentInvitationDto,
  ) {
    return this.invitations.accept(user.id, id, dto.resumeId);
  }

  @Post('candidate/:id/decline')
  @Roles('CANDIDATE')
  decline(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invitations.decline(user.id, id);
  }
}
