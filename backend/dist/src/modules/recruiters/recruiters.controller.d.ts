import { RecruitersService } from './recruiters.service';
import { UpdateRecruiterProfileDto } from './dto/update-recruiter-profile.dto';
import type { AuthenticatedUser } from '../auth/auth.types';
export declare class RecruitersController {
    private readonly recruitersService;
    constructor(recruitersService: RecruitersService);
    getProfile(user: AuthenticatedUser): Promise<{
        company: {
            id: string;
            code: string | null;
            name: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            logoUrl: string | null;
            website: string | null;
            address: string | null;
        } | null;
        department: {
            id: string;
            code: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            status: import(".prisma/client").$Enums.DepartmentStatus;
        } | null;
        user: {
            email: string;
            fullName: string;
            birthDay: Date | null;
            phone: string | null;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string | null;
        userId: string;
        title: string | null;
        departmentId: string | null;
    }>;
    updateProfile(user: AuthenticatedUser, dto: UpdateRecruiterProfileDto): Promise<{
        company: {
            id: string;
            code: string | null;
            name: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            logoUrl: string | null;
            website: string | null;
            address: string | null;
        } | null;
        department: {
            id: string;
            code: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            status: import(".prisma/client").$Enums.DepartmentStatus;
        } | null;
        user: {
            email: string;
            fullName: string;
            birthDay: Date | null;
            phone: string | null;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string | null;
        userId: string;
        title: string | null;
        departmentId: string | null;
    }>;
    getDashboardStats(user: AuthenticatedUser): Promise<{
        totalActiveJobs: number;
        totalCandidates: number;
        newApplicationsToday: number;
    }>;
}
