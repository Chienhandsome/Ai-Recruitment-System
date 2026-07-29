import { PrismaService } from '../../database/prisma.service';
export declare class SkillsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getCategories(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getSkills(categoryId?: string, search?: string): Promise<({
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
        };
        skillAliases: {
            id: string;
            createdAt: Date;
            skillId: string;
            aliasName: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        normalizedName: string;
        categoryId: string;
        type: import(".prisma/client").$Enums.SkillType;
        status: import(".prisma/client").$Enums.SkillStatus;
    })[]>;
    createSkill(name: string, categoryId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        normalizedName: string;
        categoryId: string;
        type: import(".prisma/client").$Enums.SkillType;
        status: import(".prisma/client").$Enums.SkillStatus;
    }>;
    updateSkill(id: string, name?: string, categoryId?: string, type?: 'HARD' | 'SOFT'): Promise<{
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
        };
        skillAliases: {
            id: string;
            createdAt: Date;
            skillId: string;
            aliasName: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        normalizedName: string;
        categoryId: string;
        type: import(".prisma/client").$Enums.SkillType;
        status: import(".prisma/client").$Enums.SkillStatus;
    }>;
    addSkillAlias(skillId: string, aliasName: string): Promise<{
        id: string;
        createdAt: Date;
        skillId: string;
        aliasName: string;
    }>;
    deleteSkillAlias(aliasId: string): Promise<{
        id: string;
        createdAt: Date;
        skillId: string;
        aliasName: string;
    }>;
    getUnrecognizedSkills(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.UnrecognizedSkillStatus;
        rawSkillName: string;
        frequency: number;
    }[]>;
    mapUnrecognizedSkill(unrecognizedId: string, targetSkillId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.UnrecognizedSkillStatus;
        rawSkillName: string;
        frequency: number;
    }>;
    approveUnrecognizedSkill(unrecognizedId: string, categoryId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        normalizedName: string;
        categoryId: string;
        type: import(".prisma/client").$Enums.SkillType;
        status: import(".prisma/client").$Enums.SkillStatus;
    }>;
    rejectUnrecognizedSkill(unrecognizedId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.UnrecognizedSkillStatus;
        rawSkillName: string;
        frequency: number;
    }>;
}
