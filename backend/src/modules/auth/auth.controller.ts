import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SupabaseAuthService } from './supabase-auth.service';
import type { AuthenticatedUser } from './auth.types';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { BootstrapAuthDto } from './dto/bootstrap-auth.dto';
import { InviteAdminDto } from './dto/invite-admin.dto';

@ApiTags('Authentication')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly supabaseAuthService: SupabaseAuthService,
  ) {}

  @Post('bootstrap')
  @ApiOperation({
    summary: 'Create or refresh the application profile for a Supabase user',
  })
  @ApiResponse({ status: 201, description: 'Application profile is ready' })
  bootstrap(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BootstrapAuthDto,
  ) {
    return this.authService.bootstrap(user, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Return the current application user and roles' })
  getMe(
    @CurrentUser() user: AuthenticatedUser,
    @Query('full') full?: string,
  ) {
    const isFull = full === 'true' || full === '1';
    return this.authService.getMe(user.id, isFull);
  }

  @Post('admins')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Invite a new administrator' })
  @ApiResponse({ status: 201, description: 'Administrator invitation created' })
  async inviteAdmin(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: InviteAdminDto,
  ) {
    const invitedUser = await this.supabaseAuthService.inviteAdmin(
      dto.email,
      dto.fullName,
    );

    try {
      return await this.authService.provisionAdmin(currentUser.id, invitedUser);
    } catch (error) {
      await this.supabaseAuthService.deleteAuthUser(invitedUser.id);
      throw error;
    }
  }
}
