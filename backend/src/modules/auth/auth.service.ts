import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ROLE_DETAILS, type AuthRole } from './auth.constants';
import type { AuthenticatedUser } from './auth.types';
import type { BootstrapAuthDto } from './dto/bootstrap-auth.dto';

const userProfileInclude = {
  candidateProfile: true,
  recruiterProfile: true,
} satisfies Prisma.UserInclude;

const getUserWithProfile = (prisma: PrismaService) =>
  prisma.user.findUnique({
    where: { id: '' },
    include: userProfileInclude,
  });

type UserWithProfile = NonNullable<
  Awaited<ReturnType<typeof getUserWithProfile>>
>;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async bootstrap(
    authUser: AuthenticatedUser,
    dto: BootstrapAuthDto,
  ): Promise<ReturnType<AuthService['toAuthResponse']>> {
    this.logger.log(
      `bootstrap: Starting for user ${authUser.email} (${authUser.id}), role=${dto.role ?? 'none'}`,
    );

    const existing = await this.prisma.user.findUnique({
      where: { id: authUser.id },
      include: userProfileInclude,
    });

    if (existing) {
      this.logger.debug(
        `bootstrap: Existing user found — updating lastLoginAt`,
      );
      const updated = await this.prisma.user.update({
        where: { id: authUser.id },
        data: {
          email: authUser.email,
          fullName: authUser.fullName,
        },
        include: userProfileInclude,
      });

      return this.toAuthResponse(updated);
    }

    this.logger.debug(`bootstrap: No existing user — creating new profile`);

    if (!dto.role) {
      this.logger.warn(`bootstrap: No role provided for new user ${authUser.email}`);
      throw new BadRequestException({
        code: 'ROLE_REQUIRED',
        message:
          'Choose Candidate or Recruiter to finish creating your account.',
      });
    }
    const signupRole = dto.role;

    try {
      const created = await this.prisma.$transaction(async (transaction) => {
        const user = await transaction.user.create({
          data: {
            id: authUser.id,
            email: authUser.email,
            fullName: authUser.fullName,
            userStatus: 'ACTIVE',
            role: signupRole,
          },
        });

        if (signupRole === 'CANDIDATE') {
          await transaction.candidateProfile.create({
            data: {
              userId: user.id,
            },
          });
        } else {
          await transaction.recruiterProfile.create({
            data: {
              userId: user.id,
              companyName: 'Unknown Company', // Must update later
            },
          });
        }

        // Skip auditLog in MVP if not in new architecture

        return transaction.user.findUniqueOrThrow({
          where: { id: user.id },
          include: userProfileInclude,
        });
      });

      return this.toAuthResponse(created);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.warn(
          `bootstrap: P2002 duplicate detected for user ${authUser.id} — checking concurrent creation`,
        );
        const concurrentlyCreated = await this.prisma.user.findUnique({
          where: { id: authUser.id },
          include: userProfileInclude,
        });

        if (concurrentlyCreated) {
          return this.toAuthResponse(concurrentlyCreated);
        }
      }

      this.logger.error(
        `bootstrap: Failed for user ${authUser.email} — ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async getMe(
    userId: string,
  ): Promise<ReturnType<AuthService['toAuthResponse']>> {
    this.logger.debug(`getMe: Fetching profile for userId=${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: userProfileInclude,
    });

    if (!user) {
      this.logger.warn(`getMe: No profile found for userId=${userId}`);
      throw new NotFoundException({
        code: 'PROFILE_NOT_INITIALIZED',
        message: 'The application profile has not been initialized.',
      });
    }

    this.logger.debug(`getMe: Profile found for ${user.email}`);
    return this.toAuthResponse(user);
  }

  async provisionAdmin(
    createdByUserId: string,
    invitedUser: AuthenticatedUser,
  ): Promise<ReturnType<AuthService['toAuthResponse']>> {
    const created = await this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          id: invitedUser.id,
          email: invitedUser.email,
          fullName: invitedUser.fullName,
          userStatus: 'ACTIVE',
          role: 'ADMIN',
        },
      });

      return transaction.user.findUniqueOrThrow({
        where: { id: user.id },
        include: userProfileInclude,
      });
    });

    return this.toAuthResponse(created);
  }

  private toAuthResponse(user: UserWithProfile) {
    this.assertAccountIsActive(user.userStatus);

    const roles = user.role ? [user.role] : [];

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      status: user.userStatus,
      roles,
      candidateProfile: user.candidateProfile
        ? {
            id: user.candidateProfile.id,
            address: user.candidateProfile.address,
            githubUrl: user.candidateProfile.githubUrl,
            linkedinUrl: user.candidateProfile.linkedinUrl,
            portfolioUrl: user.candidateProfile.portfolioUrl,
          }
        : null,
      recruiterProfile: user.recruiterProfile
        ? {
            id: user.recruiterProfile.id,
            companyName: user.recruiterProfile.companyName,
            title: user.recruiterProfile.title,
          }
        : null,
    };
  }

  private assertAccountIsActive(status: string | null): void {
    if (status !== 'ACTIVE') {
      throw new ForbiddenException({
        code: 'ACCOUNT_UNAVAILABLE',
        message: `This account is ${status?.toLowerCase() ?? 'unavailable'}.`,
      });
    }
  }
}
