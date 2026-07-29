import { AuthService } from './auth.service';
import { SupabaseAuthService } from './supabase-auth.service';
import type { AuthenticatedUser } from './auth.types';
import { BootstrapAuthDto } from './dto/bootstrap-auth.dto';
import { InviteAdminDto } from './dto/invite-admin.dto';
export declare class AuthController {
    private readonly authService;
    private readonly supabaseAuthService;
    constructor(authService: AuthService, supabaseAuthService: SupabaseAuthService);
    bootstrap(user: AuthenticatedUser, dto: BootstrapAuthDto): Promise<{
        id: string;
        email: string;
        fullName: string;
        phone: string | null;
        avatarUrl: string | null;
        status: import(".prisma/client").$Enums.AccountStatus;
        roles: ("ADMIN" | "RECRUITER" | "CANDIDATE")[];
        candidateProfile: {
            id: string;
            address: string | null;
            desiredTitle: string | null;
            professionalSummary: string | null;
            githubUrl: string | null;
            linkedinUrl: string | null;
            portfolioUrl: string | null;
        } | null;
        recruiterProfile: {
            id: string;
            departmentId: string | null;
            title: string | null;
        } | null;
    }>;
    getMe(user: AuthenticatedUser): Promise<{
        id: string;
        email: string;
        fullName: string;
        phone: string | null;
        avatarUrl: string | null;
        status: import(".prisma/client").$Enums.AccountStatus;
        roles: ("ADMIN" | "RECRUITER" | "CANDIDATE")[];
        candidateProfile: {
            id: string;
            address: string | null;
            desiredTitle: string | null;
            professionalSummary: string | null;
            githubUrl: string | null;
            linkedinUrl: string | null;
            portfolioUrl: string | null;
        } | null;
        recruiterProfile: {
            id: string;
            departmentId: string | null;
            title: string | null;
        } | null;
    }>;
    inviteAdmin(currentUser: AuthenticatedUser, dto: InviteAdminDto): Promise<{
        id: string;
        email: string;
        fullName: string;
        phone: string | null;
        avatarUrl: string | null;
        status: import(".prisma/client").$Enums.AccountStatus;
        roles: ("ADMIN" | "RECRUITER" | "CANDIDATE")[];
        candidateProfile: {
            id: string;
            address: string | null;
            desiredTitle: string | null;
            professionalSummary: string | null;
            githubUrl: string | null;
            linkedinUrl: string | null;
            portfolioUrl: string | null;
        } | null;
        recruiterProfile: {
            id: string;
            departmentId: string | null;
            title: string | null;
        } | null;
    }>;
}
