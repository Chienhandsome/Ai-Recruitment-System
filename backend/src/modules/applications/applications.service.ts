import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RabbitMQService } from '../../infrastructure/rabbitmq/rabbitmq.service';
import { RABBITMQ_ROUTING_KEYS } from '../../infrastructure/rabbitmq/rabbitmq.constants';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ApplicationProcessingStatus, ApplicationStage, MatchLevel } from '@prisma/client';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async applyForJob(userId: string, createApplicationDto: CreateApplicationDto) {
    // 1. Get Candidate Profile
    const candidateProfile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        primaryResume: true,
        workExperiences: true,
        educations: true,
        projects: true,
        certificates: true,
        candidateSkills: {
          include: { skill: true },
        },
      },
    });

    if (!candidateProfile) {
      throw new NotFoundException('Candidate profile not found.');
    }

    const resumeId = createApplicationDto.resumeId || candidateProfile.primaryResumeId;
    if (!resumeId) {
      throw new BadRequestException('A resume is required to apply for this job.');
    }

    // 2. Check if already applied
    const existingApplication = await this.prisma.application.findUnique({
      where: {
        jobId_candidateId: {
          jobId: createApplicationDto.jobId,
          candidateId: candidateProfile.id,
        },
      },
    });

    if (existingApplication) {
      throw new BadRequestException('You have already applied for this job.');
    }

    // 3. Get Job details for matching
    const job = await this.prisma.jobPosting.findUnique({
      where: { id: createApplicationDto.jobId },
      include: {
        jobSkills: { include: { skill: true } },
        jobCertificates: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job posting not found.');
    }

    // 4. Create Application record
    const application = await this.prisma.application.create({
      data: {
        jobId: job.id,
        candidateId: candidateProfile.id,
        resumeId,
        source: 'DIRECT_APPLY',
        currentStage: ApplicationStage.RECEIVED,
        processingStatus: ApplicationProcessingStatus.MATCHING,
        profileSnapshot: {
          fullName: candidateProfile.fullName,
          email: candidateProfile.email,
        },
      },
    });

    // 5. Build AI Matching Request Payload
    const evaluationRequest = this.buildEvaluationRequest(application.id, candidateProfile, job);

    // 6. Push Job to RabbitMQ for Async Processing
    try {
      this.logger.log(`Publishing AI Evaluation job for application ${application.id} to RabbitMQ...`);
      
      const payload = {
        applicationId: application.id,
        ...evaluationRequest,
      };

      const published = await this.rabbitMQService.publish(
        RABBITMQ_ROUTING_KEYS.EVALUATION_REQUESTED,
        payload,
      );

      if (!published) {
        throw new Error('Failed to publish message to RabbitMQ');
      }

      this.logger.log(`Successfully queued AI Evaluation for application ${application.id}`);

      return {
        message: 'Ứng tuyển thành công. Đang phân tích hồ sơ...',
        applicationId: application.id,
      };
    } catch (error) {
      this.logger.error(`Failed to publish AI Matching for application ${application.id}`, error);
      
      // Update application to FAILED
      await this.prisma.application.update({
        where: { id: application.id },
        data: { processingStatus: ApplicationProcessingStatus.FAILED },
      });

      return {
        message: 'Ứng tuyển thành công, nhưng hệ thống AI đang bận. Sẽ chấm điểm sau.',
        applicationId: application.id,
      };
    }
  }

  private buildEvaluationRequest(applicationId: string, profile: any, job: any) {
    return {
      application_id: applicationId,
      candidate_profile: {
        profile: {
          id: profile.id,
          candidate_user_id: profile.userId,
          desired_title: profile.desiredTitle,
          professional_summary: profile.professionalSummary,
        },
        work_experiences: profile.workExperiences.map((ex: any) => ({
          company_name: ex.companyName,
          position_title: ex.positionTitle,
          start_date: ex.startDate ? ex.startDate.toISOString() : undefined,
          end_date: ex.endDate ? ex.endDate.toISOString() : undefined,
          is_current: ex.isCurrent,
          description: ex.description,
        })),
        educations: profile.educations.map((ed: any) => ({
          school_name: ed.schoolName,
          major: ed.major,
          degree: ed.degree,
        })),
        projects: profile.projects.map((pr: any) => ({
          project_name: pr.projectName,
          project_role: pr.projectRole,
          description: pr.description,
        })),
        certificates: profile.certificates?.map((cert: any) => ({
          certificate_name: cert.certificateName,
          issuing_organization: cert.issuingOrganization,
        })) || [],
        skills: profile.candidateSkills.map((cs: any) => ({
          skill_id: cs.skillId,
          skill_name: cs.skill?.name,
          proficiency_level: cs.proficiencyLevel,
        })),
      },
      job: {
        id: job.id,
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        required_experience_years: job.requiredExperienceYears || 0,
        required_skills: job.jobSkills.map((js: any) => ({
          skill_id: js.skillId,
          skill_name: js.skill?.name,
          is_mandatory: js.requirementType === 'MANDATORY',
          minimum_level: js.minimumProficiency || 'BEGINNER',
        })),
        required_certificates: job.jobCertificates?.map((jc: any) => ({
          certificate_name: jc.certificateName,
          is_mandatory: jc.requirementType === 'MANDATORY',
        })) || [],
      },
      weights: {
        skills: Number(job.skillWeight) || 40.0,
        experience: Number(job.experienceWeight) || 30.0,
        education: Number(job.educationWeight) || 15.0,
        other: Number(job.otherWeight) || 15.0,
      }
    };
  }
}
