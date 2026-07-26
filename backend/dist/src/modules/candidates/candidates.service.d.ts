import { PrismaService } from '../../database/prisma.service';
import { CandidateProfileStatus } from '@prisma/client';
export interface ResolvedCandidateProfile {
    id: string;
    userId: string | null;
    status: CandidateProfileStatus;
    fullName: string;
    email: string;
    phone: string | null;
    address: string | null;
    desiredTitle: string | null;
    professionalSummary: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    portfolioUrl: string | null;
    primaryResumeId: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare class CandidatesService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getResolvedProfile(candidateProfileId: string): Promise<ResolvedCandidateProfile>;
    getResolvedProfileByUserId(userId: string): Promise<ResolvedCandidateProfile>;
    updateProfileStatus(candidateProfileId: string, status: CandidateProfileStatus): Promise<void>;
    setPrimaryResume(candidateProfileId: string, resumeId: string): Promise<void>;
    private resolveProfile;
}
