import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobDto } from './dto/query-job.dto';
import { Prisma, JobStatus } from '@prisma/client';
import { QueryCandidateJobDto } from './dto/query-candidate-job.dto';

const candidateJobListInclude = {
  recruiter: {
    select: {
      company: {
        select: { id: true, name: true, logoUrl: true },
      },
    },
  },
  department: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, slug: true } },
  jobSkills: {
    select: {
      requirementType: true,
      skill: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.JobPostingInclude;

const candidateJobDetailInclude = {
  ...candidateJobListInclude,
  jobCertificates: {
    select: {
      id: true,
      certificateName: true,
      requirementType: true,
    },
  },
} satisfies Prisma.JobPostingInclude;

type CandidateJobListRecord = Prisma.JobPostingGetPayload<{
  include: typeof candidateJobListInclude;
}>;

type CandidateJobDetailRecord = Prisma.JobPostingGetPayload<{
  include: typeof candidateJobDetailInclude;
}>;

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

  async getJobCategories() {
    return this.prisma.jobCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(userId: string, dto: CreateJobDto) {
    const recruiter = await this.getRecruiterProfile(userId);

    // Prepare skills data if provided
    const skillsData =
      dto.skills?.map((s) => ({
        skillId: s.skillId,
        requirementType: s.requirementType,
      })) || [];

    // Prepare certs data if provided
    const certsData =
      dto.certificates?.map((c) => ({
        certificateName: c.certificateName,
        requirementType: c.requirementType,
      })) || [];

    // Ensure job code is unique
    let jobCode = this.generateJobCode();
    let isUnique = false;
    while (!isUnique) {
      const existing = await this.prisma.jobPosting.findUnique({
        where: { jobCode },
      });
      if (!existing) {
        isUnique = true;
      } else {
        jobCode = this.generateJobCode();
      }
    }

    // [FIX]: Validate category existence before creating a job
    // This prevents Prisma P2003 Foreign Key Constraint violation if frontend sends a stale or invalid categoryId
    if (dto.categoryId) {
      const category = await this.prisma.jobCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new BadRequestException(
          `Category with ID ${dto.categoryId} does not exist`,
        );
      }
    }

    try {
      return await this.prisma.jobPosting.create({
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
          levelRequirementMode: dto.levelRequirementMode,
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
          },
        },
        include: {
          department: true,
          category: true,
          jobSkills: {
            include: { skill: true },
          },
          jobCertificates: true,
          applications: {
            include: {
              aiMatchingResults: { take: 1, orderBy: { version: 'desc' } },
              candidate: {
                include: {
                  user: {
                    select: {
                      id: true,
                      email: true,
                      fullName: true,
                      avatarUrl: true,
                      phone: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              appliedAt: 'desc',
            },
          },
        },
      });
    } catch (error: unknown) {
      console.error('CREATE JOB ERROR:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to create job due to DB error: ${message}`,
      );
    }
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
      recruiterIds = peers.map((p) => p.id);
    }

    const {
      search,
      departmentId,
      status,
      employmentType,
      page = 1,
      limit = 10,
    } = query;
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
          category: true,
          _count: {
            select: { applications: true },
          },
        },
      }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findCandidateJobs(query: QueryCandidateJobDto) {
    const {
      search,
      categoryId,
      employmentType,
      workingModel,
      location,
      page = 1,
      limit = 12,
    } = query;
    const now = new Date();
    const where: Prisma.JobPostingWhereInput = {
      status: JobStatus.PUBLISHED,
      OR: [{ expiryDate: null }, { expiryDate: { gt: now } }],
    };

    if (search?.trim()) {
      const term = search.trim();
      where.AND = [
        {
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            {
              recruiter: {
                company: { name: { contains: term, mode: 'insensitive' } },
              },
            },
            {
              jobSkills: {
                some: {
                  skill: { name: { contains: term, mode: 'insensitive' } },
                },
              },
            },
          ],
        },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (employmentType) where.employmentType = employmentType;
    if (workingModel) where.workingModel = workingModel;
    if (location?.trim()) {
      where.location = { contains: location.trim(), mode: 'insensitive' };
    }

    const [total, jobs] = await Promise.all([
      this.prisma.jobPosting.count({ where }),
      this.prisma.jobPosting.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        include: candidateJobListInclude,
      }),
    ]);

    return {
      data: jobs.map((job) => this.toCandidateJobSummary(job)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findRecommendedCandidateJobs(
    userId: string,
    query: QueryCandidateJobDto,
  ) {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        candidateSkills: {
          include: { skill: true },
        },
      },
    });

    if (
      !profile ||
      (profile.candidateSkills.length === 0 && !profile.desiredTitle?.trim())
    ) {
      return this.findCandidateJobs(query);
    }

    const candidateSkillIds = new Set(
      profile.candidateSkills.map((cs) => cs.skillId),
    );
    const candidateSkillNames = profile.candidateSkills.map((cs) =>
      cs.skill.name.toLowerCase().trim(),
    );
    const candidateSkillNormalized = profile.candidateSkills.map((cs) =>
      cs.skill.normalizedName.toLowerCase().trim(),
    );
    const desiredTitleLower = (profile.desiredTitle || '').toLowerCase().trim();

    const mobileKeywords = [
      'react native',
      'react-native',
      'mobile',
      'flutter',
      'ios',
      'android',
      'swift',
      'kotlin',
    ];
    const frontendKeywords = [
      'frontend',
      'front-end',
      'front end',
      'react',
      'reactjs',
      'vue',
      'vuejs',
      'angular',
      'nextjs',
      'web',
    ];
    const softwareKeywords = [
      'developer',
      'engineer',
      'lập trình',
      'software',
      'fullstack',
      'backend',
      'tester',
      'qa',
      'devops',
    ];

    const isCandidateMobile =
      candidateSkillNormalized.some((s) =>
        mobileKeywords.some((k) => s.includes(k) || k.includes(s)),
      ) ||
      candidateSkillNames.some((s) =>
        mobileKeywords.some((k) => s.includes(k) || k.includes(s)),
      ) ||
      mobileKeywords.some((k) => desiredTitleLower.includes(k));

    const isCandidateFrontend =
      candidateSkillNormalized.some((s) =>
        frontendKeywords.some((k) => s.includes(k) || k.includes(s)),
      ) ||
      candidateSkillNames.some((s) =>
        frontendKeywords.some((k) => s.includes(k) || k.includes(s)),
      ) ||
      frontendKeywords.some((k) => desiredTitleLower.includes(k));

    const {
      search,
      categoryId,
      employmentType,
      workingModel,
      location,
      page = 1,
      limit = 12,
    } = query;

    const now = new Date();
    const where: Prisma.JobPostingWhereInput = {
      status: JobStatus.PUBLISHED,
      OR: [{ expiryDate: null }, { expiryDate: { gt: now } }],
    };

    if (search?.trim()) {
      const term = search.trim();
      where.AND = [
        {
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            {
              recruiter: {
                company: { name: { contains: term, mode: 'insensitive' } },
              },
            },
            {
              jobSkills: {
                some: {
                  skill: { name: { contains: term, mode: 'insensitive' } },
                },
              },
            },
          ],
        },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (employmentType) where.employmentType = employmentType;
    if (workingModel) where.workingModel = workingModel;
    if (location?.trim()) {
      where.location = { contains: location.trim(), mode: 'insensitive' };
    }

    const jobs = await this.prisma.jobPosting.findMany({
      where,
      include: candidateJobListInclude,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    });

    const scoredJobs = jobs
      .map((job) => {
        let skillScore = 0;
        const matchedSkills: string[] = [];

        // 1. Skill scoring (max 55)
        for (const js of job.jobSkills) {
          const isMandatory = js.requirementType === 'MANDATORY';
          const skillNameLower = js.skill.name.toLowerCase().trim();
          const skillId = js.skill.id;

          const isDirectMatch =
            candidateSkillIds.has(skillId) ||
            candidateSkillNames.includes(skillNameLower) ||
            candidateSkillNormalized.includes(skillNameLower);

          if (isDirectMatch) {
            matchedSkills.push(js.skill.name);
            skillScore += isMandatory ? 18 : 10;
          } else {
            const isAffinityMatch = candidateSkillNames.some((csName) => {
              if (
                csName.includes('react native') &&
                (skillNameLower === 'react' || skillNameLower === 'mobile')
              ) {
                return true;
              }
              if (
                csName === 'react' &&
                skillNameLower.includes('react native')
              ) {
                return true;
              }
              if (
                csName === 'typescript' &&
                skillNameLower === 'javascript'
              ) {
                return true;
              }
              return false;
            });

            if (isAffinityMatch) {
              skillScore += 6;
            }
          }
        }
        skillScore = Math.min(skillScore, 55);

        // 2. Title & Specialty relevance scoring (max 35)
        let titleScore = 0;
        const jobTitleLower = job.title.toLowerCase();

        const jobIsMobile = mobileKeywords.some((k) =>
          jobTitleLower.includes(k),
        );
        const jobIsFrontend = frontendKeywords.some((k) =>
          jobTitleLower.includes(k),
        );
        const jobIsSoftware = softwareKeywords.some((k) =>
          jobTitleLower.includes(k),
        );

        if (isCandidateMobile) {
          if (jobIsMobile) {
            titleScore += 35;
          } else if (jobIsFrontend) {
            titleScore += 22;
          } else if (jobIsSoftware) {
            titleScore += 10;
          }
        } else if (isCandidateFrontend) {
          if (jobIsFrontend) {
            titleScore += 35;
          } else if (jobIsMobile) {
            titleScore += 22;
          } else if (jobIsSoftware) {
            titleScore += 10;
          }
        } else if (desiredTitleLower) {
          if (
            jobTitleLower.includes(desiredTitleLower) ||
            desiredTitleLower.includes(jobTitleLower)
          ) {
            titleScore += 35;
          } else {
            const desiredWords = desiredTitleLower
              .split(/\s+/)
              .filter((w) => w.length > 2);
            const matchedWordCount = desiredWords.filter((w) =>
              jobTitleLower.includes(w),
            ).length;
            if (matchedWordCount > 0) {
              titleScore += Math.min(matchedWordCount * 12, 30);
            }
          }
        }

        // 3. Category alignment scoring (max 10)
        let categoryScore = 0;
        const categorySlug = job.category?.slug?.toLowerCase() || '';
        const categoryName = job.category?.name?.toLowerCase() || '';
        const isItCategory =
          categorySlug === 'it-software' ||
          categoryName.includes('công nghệ') ||
          categoryName.includes('phần mềm');

        if (isItCategory) {
          if (
            isCandidateMobile ||
            isCandidateFrontend ||
            desiredTitleLower.includes('developer') ||
            desiredTitleLower.includes('engineer') ||
            desiredTitleLower.includes('lập trình')
          ) {
            categoryScore = 10;
          }
        }

        const rawScore = skillScore + titleScore + categoryScore;
        const matchScore = Math.min(Math.round(rawScore), 98);

        return {
          ...this.toCandidateJobSummary(job),
          matchScore,
          matchedSkills: Array.from(new Set(matchedSkills)),
        };
      })
      .filter((job) => job.matchScore >= 15);

    scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

    const total = scoredJobs.length;
    const paginatedData = scoredJobs.slice((page - 1) * limit, page * limit);

    return {
      data: paginatedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findCandidateJobById(id: string, userId?: string | null) {
    const job = await this.prisma.jobPosting.findFirst({
      where: {
        id,
        status: JobStatus.PUBLISHED,
        OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }],
      },
      include: candidateJobDetailInclude,
    });

    if (!job) {
      throw new NotFoundException('Job posting is unavailable');
    }

    let application = null;

    if (userId) {
      const profile = await this.prisma.candidateProfile.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (profile) {
        const app = await this.prisma.application.findUnique({
          where: {
            jobId_candidateId: {
              jobId: id,
              candidateId: profile.id,
            },
          },
          select: {
            id: true,
            processingStatus: true,
            currentStage: true,
            appliedAt: true,
          },
        });

        if (app) {
          application = {
            id: app.id,
            processingStatus: app.processingStatus,
            currentStage: app.currentStage,
            appliedAt: app.appliedAt,
          };
        }
      }
    }

    return {
      ...this.toCandidateJobSummary(job),
      description: job.description,
      requirements: job.requirements,
      benefits: job.benefits,
      requiredExperienceYears: job.requiredExperienceYears,
      levelRequirementMode: job.levelRequirementMode,
      requiresProofOfWork: job.requiresProofOfWork,
      proofOfWorkType: job.proofOfWorkType,
      certificates: job.jobCertificates.map((certificate) => ({
        id: certificate.id,
        name: certificate.certificateName,
        requirementType: certificate.requirementType,
      })),
      hasApplied: !!application,
      application,
    };
  }

  private toCandidateJobSummary(
    job: CandidateJobListRecord | CandidateJobDetailRecord,
  ) {
    return {
      id: job.id,
      jobCode: job.jobCode,
      title: job.title,
      company: job.recruiter.company,
      department: job.department,
      category: job.category,
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
      workingModel: job.workingModel,
      location: job.location,
      minSalary: job.minSalary === null ? null : Number(job.minSalary),
      maxSalary: job.maxSalary === null ? null : Number(job.maxSalary),
      currency: job.currency,
      publishedAt: job.publishedAt ?? job.createdAt,
      expiryDate: job.expiryDate,
      skills: job.jobSkills.map((jobSkill) => ({
        id: jobSkill.skill.id,
        name: jobSkill.skill.name,
        requirementType: jobSkill.requirementType,
      })),
    };
  }

  async findOne(userId: string, id: string) {
    const recruiter = await this.getRecruiterProfile(userId);
    const job = await this.prisma.jobPosting.findUnique({
      where: { id },
      include: {
        department: true,
        category: true,
        jobSkills: {
          include: { skill: true },
        },
        jobCertificates: true,
        applications: {
          include: {
            aiMatchingResults: { take: 1, orderBy: { version: 'desc' } },
            candidate: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    fullName: true,
                    avatarUrl: true,
                    phone: true,
                  },
                },
                workExperiences: { orderBy: { startDate: 'desc' } },
                educations: { orderBy: { startDate: 'desc' } },
                projects: true,
                candidateSkills: { include: { skill: true } },
              },
            },
          },
          orderBy: {
            appliedAt: 'desc',
          },
        },
      },
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
        throw new ForbiddenException(
          'You do not have access to this job posting',
        );
      }
    } else if (job.recruiterId !== recruiter.id) {
      throw new ForbiddenException(
        'You do not have access to this job posting',
      );
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
      levelRequirementMode: dto.levelRequirementMode,
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
      if (
        dto.status === JobStatus.PUBLISHED &&
        job.status === JobStatus.DRAFT
      ) {
        updateData.publishedAt = new Date();
      } else if (dto.status === JobStatus.CLOSED) {
        updateData.closedAt = new Date();
      }
    }

    // Handle skills update if provided
    if (dto.skills) {
      updateData.jobSkills = {
        deleteMany: {},
        create: dto.skills.map((s) => ({
          skillId: s.skillId,
          requirementType: s.requirementType,
        })),
      };
    }

    // Handle certs update if provided
    if (dto.certificates) {
      updateData.jobCertificates = {
        deleteMany: {},
        create: dto.certificates.map((c) => ({
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
        category: true,
        jobSkills: {
          include: { skill: true },
        },
        jobCertificates: true,
      },
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
