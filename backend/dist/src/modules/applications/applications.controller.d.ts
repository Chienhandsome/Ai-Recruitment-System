import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import type { AuthenticatedUser } from '../auth/auth.types';
export declare class ApplicationsController {
    private readonly applicationsService;
    constructor(applicationsService: ApplicationsService);
    apply(user: AuthenticatedUser, dto: CreateApplicationDto): Promise<{
        message: string;
        applicationId: string;
    }>;
}
