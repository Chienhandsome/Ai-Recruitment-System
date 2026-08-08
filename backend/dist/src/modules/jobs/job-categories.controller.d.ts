import { JobsService } from './jobs.service';
export declare class JobCategoriesController {
    private readonly jobsService;
    constructor(jobsService: JobsService);
    getJobCategories(): Promise<{
        id: string;
        updatedAt: Date;
        name: string;
        slug: string;
        createdAt: Date;
    }[]>;
}
