import { CreateJobDto } from './create-job.dto';
import { JobStatus } from '@prisma/client';
declare const UpdateJobDto_base: import("@nestjs/common").Type<Partial<CreateJobDto>>;
export declare class UpdateJobDto extends UpdateJobDto_base {
    status?: JobStatus;
}
export {};
