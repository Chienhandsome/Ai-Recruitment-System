import { PrismaService } from '../../database/prisma.service';
import { UpdateRecruiterProfileDto } from './dto/update-recruiter-profile.dto';
export declare class RecruitersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getProfile(userId: string): Promise<{
        department: {
            id: string;
            status: import(".prisma/client").$Enums.DepartmentStatus;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string;
            companyId: string;
        } | null;
        user: {
            phone: string | null;
            email: string;
            fullName: string;
            birthDay: Date | null;
            avatarUrl: string | null;
        };
        company: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string | null;
            address: string | null;
            logoUrl: string | null;
            website: string | null;
        } | null;
    } & {
        id: string;
        title: string | null;
        departmentId: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        companyId: string | null;
    }>;
    updateProfile(userId: string, dto: UpdateRecruiterProfileDto): Promise<{
        department: {
            id: string;
            status: import(".prisma/client").$Enums.DepartmentStatus;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string;
            companyId: string;
        } | null;
        user: {
            phone: string | null;
            email: string;
            fullName: string;
            birthDay: Date | null;
            avatarUrl: string | null;
        };
        company: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string | null;
            address: string | null;
            logoUrl: string | null;
            website: string | null;
        } | null;
    } & {
        id: string;
        title: string | null;
        departmentId: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        companyId: string | null;
    }>;
    getDashboardStats(userId: string): Promise<{
        totalActiveJobs: number;
        totalCandidates: number;
        newApplicationsToday: number;
    }>;
    getDashboardAnalytics(userId: string, jobId?: string): Promise<{
        kpis: {
            totalActiveJobs: number;
            totalApplications: number;
            newApplicationsToday: number;
            newApplicationsThisWeek: number;
            totalInterviews: number;
            totalHired: number;
            avgAiScore: number;
            hireConversionRate: number;
        };
        funnel: {
            stage: string;
            label: string;
            count: number;
            percentage: number;
        }[];
        scoreDistribution: {
            range: string;
            label: string;
            count: number;
            percentage: number;
            color: string;
        }[];
        upcomingInterviews: {
            id: string;
            title: string;
            type: import(".prisma/client").$Enums.InterviewType;
            scheduledAt: Date;
            durationMinutes: number;
            locationOrLink: string | null;
            candidate: {
                id: string;
                fullName: string;
                avatarUrl: string | null;
                email: string;
                phone: string | null;
            };
            job: {
                id: string;
                title: string;
            };
        }[];
        topSkills: {
            skill: string;
            demandCount: number;
            matchRate: number;
        }[];
    }>;
}
