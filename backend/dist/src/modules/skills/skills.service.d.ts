import { PrismaService } from '../../database/prisma.service';
export declare class SkillsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getCategories(): Promise<{
        id: string;
        updatedAt: Date;
        name: string;
        createdAt: Date;
    }[]>;
    getSkills(categoryId?: string, search?: string): Promise<({
        category: {
            id: string;
            updatedAt: Date;
            name: string;
            createdAt: Date;
        };
        skillAliases: {
            id: string;
            createdAt: Date;
            skillId: string;
            aliasName: string;
        }[];
    } & {
        id: string;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.SkillStatus;
        categoryId: string;
        normalizedName: string;
        type: import(".prisma/client").$Enums.SkillType;
    })[]>;
    createSkill(name: string, categoryId: string): Promise<{
        id: string;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.SkillStatus;
        categoryId: string;
        normalizedName: string;
        type: import(".prisma/client").$Enums.SkillType;
    }>;
    updateSkill(id: string, name?: string, categoryId?: string, type?: 'HARD' | 'SOFT'): Promise<{
        category: {
            id: string;
            updatedAt: Date;
            name: string;
            createdAt: Date;
        };
        skillAliases: {
            id: string;
            createdAt: Date;
            skillId: string;
            aliasName: string;
        }[];
    } & {
        id: string;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.SkillStatus;
        categoryId: string;
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
        updatedAt: Date;
        createdAt: Date;
        status: import(".prisma/client").$Enums.UnrecognizedSkillStatus;
        normalizedName: string | null;
        rawSkillName: string;
        categoryHint: string | null;
        frequency: number;
    }[]>;
    mapUnrecognizedSkill(unrecognizedId: string, targetSkillId: string): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        status: import(".prisma/client").$Enums.UnrecognizedSkillStatus;
        normalizedName: string | null;
        rawSkillName: string;
        categoryHint: string | null;
        frequency: number;
    }>;
    approveUnrecognizedSkill(unrecognizedId: string, categoryId: string): Promise<{
        id: string;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.SkillStatus;
        categoryId: string;
        normalizedName: string;
        type: import(".prisma/client").$Enums.SkillType;
    }>;
    rejectUnrecognizedSkill(unrecognizedId: string): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        status: import(".prisma/client").$Enums.UnrecognizedSkillStatus;
        normalizedName: string | null;
        rawSkillName: string;
        categoryHint: string | null;
        frequency: number;
    }>;
}
