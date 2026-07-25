import { PrismaService } from '../../database/prisma.service';
import type { AuthenticatedUser } from './auth.types';
import type { BootstrapAuthDto } from './dto/bootstrap-auth.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    bootstrap(authUser: AuthenticatedUser, dto: BootstrapAuthDto): Promise<ReturnType<AuthService['toAuthResponse']>>;
    getMe(userId: string): Promise<ReturnType<AuthService['toAuthResponse']>>;
    provisionAdmin(createdByUserId: string, invitedUser: AuthenticatedUser): Promise<ReturnType<AuthService['toAuthResponse']>>;
    private toAuthResponse;
    private assertAccountIsActive;
}
