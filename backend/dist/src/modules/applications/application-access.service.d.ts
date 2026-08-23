import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class ApplicationAccessService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    recruiterApplicationWhere(userId: string): Promise<Prisma.ApplicationWhereInput>;
    candidateProfileId(userId: string): Promise<string>;
}
