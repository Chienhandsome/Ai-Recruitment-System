import { PrismaService } from '../../database/prisma.service';
export declare class SkillsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getCategories(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
    }[]>;
    getSkills(categoryId?: string, search?: string): Promise<({
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
        };
        skillAliases: {
            id: string;
            createdAt: Date;
            skillId: string;
            aliasName: string;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.SkillStatus;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
        name: string;
        normalizedName: string;
        type: import(".prisma/client").$Enums.SkillType;
    })[]>;
    createSkill(name: string, categoryId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.SkillStatus;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
        name: string;
        normalizedName: string;
        type: import(".prisma/client").$Enums.SkillType;
    }>;
    updateSkill(id: string, name?: string, categoryId?: string, type?: 'HARD' | 'SOFT'): Promise<{
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
        };
        skillAliases: {
            id: string;
            createdAt: Date;
            skillId: string;
            aliasName: string;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.SkillStatus;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
        name: string;
        normalizedName: string;
        type: import(".prisma/client").$Enums.SkillType;
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
        status: import(".prisma/client").$Enums.UnrecognizedSkillStatus;
        createdAt: Date;
        updatedAt: Date;
        normalizedName: string | null;
        rawSkillName: string;
        categoryHint: string | null;
        frequency: number;
    }[]>;
    mapUnrecognizedSkill(unrecognizedId: string, targetSkillId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.UnrecognizedSkillStatus;
        createdAt: Date;
        updatedAt: Date;
        normalizedName: string | null;
        rawSkillName: string;
        categoryHint: string | null;
        frequency: number;
    }>;
    approveUnrecognizedSkill(unrecognizedId: string, categoryId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.SkillStatus;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
        name: string;
        normalizedName: string;
        type: import(".prisma/client").$Enums.SkillType;
    }>;
    rejectUnrecognizedSkill(unrecognizedId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.UnrecognizedSkillStatus;
        createdAt: Date;
        updatedAt: Date;
        normalizedName: string | null;
        rawSkillName: string;
        categoryHint: string | null;
        frequency: number;
    }>;
}
