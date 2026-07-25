import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type AccountStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ROLE_DETAILS, type AuthRole } from './auth.constants';
import type { AuthenticatedUser } from './auth.types';
import type { BootstrapAuthDto } from './dto/bootstrap-auth.dto';

const userProfileInclude = {
  userRoles: {
    include: {
      role: true,
    },
  },
  candidateProfile: true,
  recruiterProfile: true,
} satisfies Prisma.UserInclude;

type UserWithProfile = Prisma.UserGetPayload<{
  include: typeof userProfileInclude;
}>;

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
          avatarUrl: authUser.avatarUrl,
          lastLoginAt: new Date(),
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
        const roleDetails = ROLE_DETAILS[signupRole];
        const role = await transaction.role.upsert({
          where: { code: signupRole },
          update: {
            name: roleDetails.name,
            description: roleDetails.description,
          },
          create: {
            code: signupRole,
            name: roleDetails.name,
            description: roleDetails.description,
          },
        });

        const user = await transaction.user.create({
          data: {
            id: authUser.id,
            email: authUser.email,
            fullName: authUser.fullName,
            avatarUrl: authUser.avatarUrl,
            status: 'ACTIVE',
            lastLoginAt: new Date(),
            userRoles: {
              create: {
                roleId: role.id,
              },
            },
          },
        });

        if (signupRole === 'CANDIDATE') {
          await transaction.candidateProfile.create({
            data: {
              userId: user.id,
              fullName: user.fullName,
              email: user.email,
            },
          });
        } else {
          await transaction.recruiterProfile.create({
            data: {
              userId: user.id,
            },
          });
        }

        await transaction.auditLog.create({
          data: {
            userId: user.id,
            action: 'AUTH_PROFILE_BOOTSTRAPPED',
            entityName: 'User',
            entityId: user.id,
            newValues: {
              role: signupRole,
              source: 'PUBLIC_SIGNUP',
            },
          },
        });

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
      const roleDetails = ROLE_DETAILS.ADMIN;
      const adminRole = await transaction.role.upsert({
        where: { code: 'ADMIN' },
        update: roleDetails,
        create: {
          code: 'ADMIN',
          ...roleDetails,
        },
      });

      const user = await transaction.user.create({
        data: {
          id: invitedUser.id,
          email: invitedUser.email,
          fullName: invitedUser.fullName,
          status: 'ACTIVE',
          userRoles: {
            create: {
              roleId: adminRole.id,
            },
          },
        },
      });

      await transaction.auditLog.create({
        data: {
          userId: createdByUserId,
          action: 'ADMIN_INVITED',
          entityName: 'User',
          entityId: user.id,
          newValues: {
            email: user.email,
            role: 'ADMIN',
          },
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
    this.assertAccountIsActive(user.status);

    const roles = user.userRoles
      .map((userRole) => userRole.role.code as AuthRole)
      .sort();

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      status: user.status,
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
            departmentId: user.recruiterProfile.departmentId,
            title: user.recruiterProfile.title,
          }
        : null,
    };
  }

  private assertAccountIsActive(status: AccountStatus): void {
    if (status !== 'ACTIVE') {
      throw new ForbiddenException({
        code: 'ACCOUNT_UNAVAILABLE',
        message: `This account is ${status.toLowerCase()}.`,
      });
    }
  }
}
