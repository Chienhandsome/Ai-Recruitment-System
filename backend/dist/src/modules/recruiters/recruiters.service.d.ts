import { PrismaService } from '../../database/prisma.service';
import { UpdateRecruiterProfileDto } from './dto/update-recruiter-profile.dto';
export declare class RecruitersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getProfile(userId: string): Promise<{
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
        departmentId: string | null;
        title: string | null;
    }>;
    updateProfile(userId: string, dto: UpdateRecruiterProfileDto): Promise<{
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
        departmentId: string | null;
        title: string | null;
    }>;
    getDashboardStats(userId: string): Promise<{
        totalActiveJobs: number;
        totalCandidates: number;
        newApplicationsToday: number;
    }>;
}
