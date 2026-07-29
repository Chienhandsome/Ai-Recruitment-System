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
            aliasName: string;
            skillId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.SkillStatus;
        normalizedName: string;
        categoryId: string;
        type: import(".prisma/client").$Enums.SkillType;
    })[]>;
    createSkill(name: string, categoryId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.SkillStatus;
        normalizedName: string;
        categoryId: string;
        type: import(".prisma/client").$Enums.SkillType;
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
            aliasName: string;
            skillId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.SkillStatus;
        normalizedName: string;
        categoryId: string;
        type: import(".prisma/client").$Enums.SkillType;
    }>;
    addSkillAlias(skillId: string, aliasName: string): Promise<{
        id: string;
        createdAt: Date;
        aliasName: string;
        skillId: string;
    }>;
    deleteSkillAlias(aliasId: string): Promise<{
        id: string;
        createdAt: Date;
        aliasName: string;
        skillId: string;
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
        status: import(".prisma/client").$Enums.SkillStatus;
        normalizedName: string;
        categoryId: string;
        type: import(".prisma/client").$Enums.SkillType;
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
