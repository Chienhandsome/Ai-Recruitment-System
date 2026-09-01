import { RecruitersService } from './recruiters.service';
import { UpdateRecruiterProfileDto } from './dto/update-recruiter-profile.dto';
import type { AuthenticatedUser } from '../auth/auth.types';
export declare class RecruitersController {
    private readonly recruitersService;
    constructor(recruitersService: RecruitersService);
    getProfile(user: AuthenticatedUser): Promise<{
        user: {
            email: string;
            fullName: string;
            birthDay: Date | null;
            phone: string | null;
            avatarUrl: string | null;
        };
        company: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string | null;
            logoUrl: string | null;
            website: string | null;
            address: string | null;
            description: string | null;
        } | null;
        department: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.DepartmentStatus;
            name: string;
            code: string;
        } | null;
    } & {
        id: string;
        userId: string;
        companyId: string | null;
        departmentId: string | null;
        title: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProfile(user: AuthenticatedUser, dto: UpdateRecruiterProfileDto): Promise<{
        user: {
            email: string;
            fullName: string;
            birthDay: Date | null;
            phone: string | null;
            avatarUrl: string | null;
        };
        company: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string | null;
            logoUrl: string | null;
            website: string | null;
            address: string | null;
            description: string | null;
        } | null;
        department: {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.DepartmentStatus;
            name: string;
            code: string;
        } | null;
    } & {
        id: string;
        userId: string;
        companyId: string | null;
        departmentId: string | null;
        title: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getDashboardStats(user: AuthenticatedUser): Promise<{
        totalActiveJobs: number;
        totalCandidates: number;
        newApplicationsToday: number;
    }>;
    getDashboardActionHub(user: AuthenticatedUser, jobId?: string): Promise<{
        kpis: {
            openJobs: number;
            totalApplications: number;
            pendingActions: number;
            upcomingInterviews: number;
        };
        todayInterviews: {
            id: any;
            title: any;
            type: any;
            scheduledAt: any;
            durationMinutes: any;
            locationOrLink: any;
            candidateResponse: any;
            candidate: {
                id: any;
                fullName: any;
                avatarUrl: any;
                email: any;
            };
            job: {
                id: any;
                title: any;
                jobCode: any;
            };
        }[];
        upcomingInterviews: {
            id: any;
            title: any;
            type: any;
            scheduledAt: any;
            durationMinutes: any;
            locationOrLink: any;
            candidateResponse: any;
            candidate: {
                id: any;
                fullName: any;
                avatarUrl: any;
                email: any;
            };
            job: {
                id: any;
                title: any;
                jobCode: any;
            };
        }[];
        actionQueue: {
            jobId: string;
            jobCode: string;
            title: string;
            departmentName: string;
            totalApplications: number;
            newCount: number;
            highMatchCount: number;
            pendingReviewCount: number;
            rescheduleCount: number;
            autoShortlistThreshold: number;
        }[];
    }>;
    getDashboardAnalytics(user: AuthenticatedUser, jobId?: string): Promise<{
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
