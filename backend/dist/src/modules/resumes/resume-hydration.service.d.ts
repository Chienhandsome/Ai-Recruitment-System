import { PrismaService } from '../../database/prisma.service';
export interface ParsedResumeData {
    summary?: string | null;
    desired_title?: string | null;
    total_years_experience?: number | null;
    skills: Array<{
        name: string;
        proficiency_level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
        years_experience?: number | null;
    }>;
    work_experiences: Array<{
        company_name: string;
        position_title: string;
        start_date: string;
        end_date?: string | null;
        is_current: boolean;
        description?: string | null;
        achievements?: string | null;
    }>;
    educations: Array<{
        school_name: string;
        major?: string | null;
        degree?: string | null;
        start_date?: string | null;
        end_date?: string | null;
        description?: string | null;
    }>;
    projects: Array<{
        project_name: string;
        project_role?: string | null;
        description?: string | null;
        technologies?: string[] | null;
        project_url?: string | null;
        start_date?: string | null;
        end_date?: string | null;
    }>;
    certificates: Array<{
        certificate_name: string;
        issuing_organization: string;
        issue_date?: string | null;
        expiry_date?: string | null;
        credential_url?: string | null;
    }>;
}
export declare class ResumeHydrationService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    hydrateProfile(resumeId: string, candidateProfileId: string, parsedData: ParsedResumeData): Promise<void>;
    handleFailure(resumeId: string, candidateProfileId: string, errorMessage: string): Promise<void>;
    private findOrCreateSkill;
    private getOrCreateDefaultCategory;
}
