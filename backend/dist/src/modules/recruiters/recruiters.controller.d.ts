import { RecruitersService } from './recruiters.service';
import { UpdateRecruiterProfileDto } from './dto/update-recruiter-profile.dto';
import type { AuthenticatedUser } from '../auth/auth.types';
export declare class RecruitersController {
    private readonly recruitersService;
    constructor(recruitersService: RecruitersService);
    getProfile(user: AuthenticatedUser): Promise<{
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
    updateProfile(user: AuthenticatedUser, dto: UpdateRecruiterProfileDto): Promise<{
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
    getDashboardStats(user: AuthenticatedUser): Promise<{
        totalActiveJobs: number;
        totalCandidates: number;
        newApplicationsToday: number;
    }>;
}
