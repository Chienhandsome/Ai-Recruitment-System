import { PrismaService } from '../../../database/prisma.service';
import { ResumeGuardService } from '../domain/resume-guard.service';
import type { ParsedResumeData } from '../resume.types';
import { SkillResolverService } from './skill-resolver.service';
import { CertificateWriter } from './writers/certificate-writer';
import { EducationWriter } from './writers/education-writer';
import { ExperienceWriter } from './writers/experience-writer';
import { ProfileWriter } from './writers/profile-writer';
import { ProjectWriter } from './writers/project-writer';
import { SkillWriter } from './writers/skill-writer';
export declare class ResumeHydrationService {
    private readonly prisma;
    private readonly guard;
    private readonly skillResolver;
    private readonly experienceWriter;
    private readonly educationWriter;
    private readonly projectWriter;
    private readonly certificateWriter;
    private readonly skillWriter;
    private readonly profileWriter;
    private readonly logger;
    constructor(prisma: PrismaService, guard: ResumeGuardService, skillResolver: SkillResolverService, experienceWriter: ExperienceWriter, educationWriter: EducationWriter, projectWriter: ProjectWriter, certificateWriter: CertificateWriter, skillWriter: SkillWriter, profileWriter: ProfileWriter);
    hydrateProfile(resumeId: string, candidateProfileId: string, parsedData: ParsedResumeData): Promise<void>;
    handleFailure(resumeId: string, candidateProfileId: string, errorMessage: string, errorCode?: string): Promise<void>;
    private requeueAfterExpiredSignedUrl;
    private writeParsedData;
}
