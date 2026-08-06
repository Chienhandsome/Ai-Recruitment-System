import { PrismaService } from '../../database/prisma.service';
import { UpdateRecruiterProfileDto } from './dto/update-recruiter-profile.dto';
export declare class RecruitersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getProfile(userId: string): Promise<{
        user: {
            fullName: string;
            email: string;
            phone: string | null;
            birthDay: Date | null;
            avatarUrl: string | null;
        };
        department: {
            id: string;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.DepartmentStatus;
            code: string;
            companyId: string;
        } | null;
        company: {
            id: string;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            address: string | null;
            description: string | null;
            code: string | null;
            logoUrl: string | null;
            website: string | null;
        } | null;
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        userId: string;
        title: string | null;
        departmentId: string | null;
        companyId: string | null;
    }>;
    updateProfile(userId: string, dto: UpdateRecruiterProfileDto): Promise<{
        user: {
            fullName: string;
            email: string;
            phone: string | null;
            birthDay: Date | null;
            avatarUrl: string | null;
        };
        department: {
            id: string;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.DepartmentStatus;
            code: string;
            companyId: string;
        } | null;
        company: {
            id: string;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            address: string | null;
            description: string | null;
            code: string | null;
            logoUrl: string | null;
            website: string | null;
        } | null;
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        userId: string;
        title: string | null;
        departmentId: string | null;
        companyId: string | null;
    }>;
    getDashboardStats(userId: string): Promise<{
        totalActiveJobs: number;
        totalCandidates: number;
        newApplicationsToday: number;
    }>;
}
