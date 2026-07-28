import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobDto } from './dto/query-job.dto';
import { Prisma, JobStatus } from '@prisma/client';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getRecruiterProfile(userId: string) {
    const profile = await this.prisma.recruiterProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new ForbiddenException('User is not a valid recruiter');
    }
    return profile;
  }

  private generateJobCode(): string {
    const datePart = new Date().toISOString().slice(2, 7).replace('-', ''); // e.g. 2607
    const randomPart = Math.floor(1000 + Math.random() * 9000); // 4 digits
    return `JOB-${datePart}-${randomPart}`;
  }

  async create(userId: string, dto: CreateJobDto) {
    const recruiter = await this.getRecruiterProfile(userId);

    // Prepare skills data if provided
    const skillsData = dto.skills?.map(s => ({
      skillId: s.skillId,
      requirementType: s.requirementType,
    })) || [];

    // Prepare certs data if provided
    const certsData = dto.certificates?.map(c => ({
      certificateName: c.certificateName,
      requirementType: c.requirementType,
    })) || [];

    // Ensure job code is unique
    let jobCode = this.generateJobCode();
    let isUnique = false;
    while (!isUnique) {
      const existing = await this.prisma.jobPosting.findUnique({ where: { jobCode } });
      if (!existing) {
        isUnique = true;
      } else {
        jobCode = this.generateJobCode();
      }
    }

    return this.prisma.jobPosting.create({
      data: {
        jobCode,
        title: dto.title,
        recruiterId: recruiter.id,
        departmentId: dto.departmentId,
        description: dto.description,
        requirements: dto.requirements,
        benefits: dto.benefits,
        employmentType: dto.employmentType,
        experienceLevel: dto.experienceLevel,
        minSalary: dto.minSalary,
        maxSalary: dto.maxSalary,
        currency: dto.currency,
        location: dto.location,
        workingModel: dto.workingModel,
        requiresProofOfWork: dto.requiresProofOfWork,
        proofOfWorkType: dto.proofOfWorkType,
        categoryId: dto.categoryId,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        requiredExperienceYears: dto.requiredExperienceYears,
        autoShortlistThreshold: dto.autoShortlistThreshold,
        autoRejectThreshold: dto.autoRejectThreshold,
        rejectOnMissingMandatory: dto.rejectOnMissingMandatory,
        skillWeight: dto.skillWeight,
        experienceWeight: dto.experienceWeight,
        educationWeight: dto.educationWeight,
        otherWeight: dto.otherWeight,
        status: JobStatus.DRAFT,
        jobSkills: {
          create: skillsData,
        },
        jobCertificates: {
          create: certsData,
        }
      },
      include: {
        department: true,
        jobSkills: {
          include: { skill: true }
        },
        jobCertificates: true
      }
    });
  }

  async findAll(userId: string, query: QueryJobDto) {
    const recruiter = await this.getRecruiterProfile(userId);

    // If recruiter belongs to a company, they should see all jobs from all recruiters in that company
    // If not, they only see their own jobs
    let recruiterIds: string[] = [recruiter.id];
    
    if (recruiter.companyId) {
      const peers = await this.prisma.recruiterProfile.findMany({
        where: { companyId: recruiter.companyId },
        select: { id: true },
      });
      recruiterIds = peers.map(p => p.id);
    }

    const { search, departmentId, status, employmentType, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.JobPostingWhereInput = {
      recruiterId: { in: recruiterIds },
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { jobCode: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;
    if (employmentType) where.employmentType = employmentType;

    const [total, items] = await Promise.all([
      this.prisma.jobPosting.count({ where }),
      this.prisma.jobPosting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          department: true,
          _count: {
            select: { applications: true }
          }
        }
      })
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async findOne(userId: string, id: string) {
    const recruiter = await this.getRecruiterProfile(userId);
    const job = await this.prisma.jobPosting.findUnique({
      where: { id },
      include: {
        department: true,
        jobSkills: {
          include: { skill: true }
        },
        jobCertificates: true
      }
    });

    if (!job) {
      throw new NotFoundException('Job posting not found');
    }

    // Verify company scope
    if (recruiter.companyId) {
      const jobRecruiter = await this.prisma.recruiterProfile.findUnique({
        where: { id: job.recruiterId },
        select: { companyId: true },
      });
      if (jobRecruiter?.companyId !== recruiter.companyId) {
        throw new ForbiddenException('You do not have access to this job posting');
      }
    } else if (job.recruiterId !== recruiter.id) {
      throw new ForbiddenException('You do not have access to this job posting');
    }

    return job;
  }

  async update(userId: string, id: string, dto: UpdateJobDto) {
    const job = await this.findOne(userId, id);

    const updateData: Prisma.JobPostingUncheckedUpdateInput = {
      title: dto.title,
      departmentId: dto.departmentId,
      description: dto.description,
      requirements: dto.requirements,
      benefits: dto.benefits,
      employmentType: dto.employmentType,
      experienceLevel: dto.experienceLevel,
      minSalary: dto.minSalary,
      maxSalary: dto.maxSalary,
      currency: dto.currency,
      location: dto.location,
      workingModel: dto.workingModel,
      requiresProofOfWork: dto.requiresProofOfWork,
      proofOfWorkType: dto.proofOfWorkType,
      categoryId: dto.categoryId,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      requiredExperienceYears: dto.requiredExperienceYears,
      autoShortlistThreshold: dto.autoShortlistThreshold,
      autoRejectThreshold: dto.autoRejectThreshold,
      rejectOnMissingMandatory: dto.rejectOnMissingMandatory,
      skillWeight: dto.skillWeight,
      experienceWeight: dto.experienceWeight,
      educationWeight: dto.educationWeight,
      otherWeight: dto.otherWeight,
    };

    if (dto.status) {
      updateData.status = dto.status;
      if (dto.status === JobStatus.PUBLISHED && job.status === JobStatus.DRAFT) {
        updateData.publishedAt = new Date();
      } else if (dto.status === JobStatus.CLOSED) {
        updateData.closedAt = new Date();
      }
    }

    // Handle skills update if provided
    if (dto.skills) {
      updateData.jobSkills = {
        deleteMany: {},
        create: dto.skills.map(s => ({
          skillId: s.skillId,
          requirementType: s.requirementType,
        })),
      };
    }

    // Handle certs update if provided
    if (dto.certificates) {
      updateData.jobCertificates = {
        deleteMany: {},
        create: dto.certificates.map(c => ({
          certificateName: c.certificateName,
          requirementType: c.requirementType,
        })),
      };
    }

    return this.prisma.jobPosting.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
        jobSkills: {
          include: { skill: true }
        },
        jobCertificates: true
      }
    });
  }

  async remove(userId: string, id: string) {
    const job = await this.findOne(userId, id);
    if (job.status !== JobStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT jobs can be deleted');
    }

    await this.prisma.jobPosting.delete({
      where: { id },
    });

    return { message: 'Job posting deleted successfully' };
  }
}
