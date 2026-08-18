import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ApplicationAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async recruiterApplicationWhere(
    userId: string,
  ): Promise<Prisma.ApplicationWhereInput> {
    const recruiter = await this.prisma.recruiterProfile.findUnique({
      where: { userId },
      select: { id: true, companyId: true },
    });

    if (!recruiter) {
      throw new NotFoundException('Recruiter profile not found.');
    }

    return recruiter.companyId
      ? { job: { recruiter: { companyId: recruiter.companyId } } }
      : { job: { recruiterId: recruiter.id } };
  }

  async candidateProfileId(userId: string): Promise<string> {
    const candidate = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate profile not found.');
    }

    return candidate.id;
  }
}
