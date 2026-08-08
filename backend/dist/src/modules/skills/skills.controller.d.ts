import { SkillsService } from './skills.service';
export declare class SkillsController {
    private readonly skillsService;
    constructor(skillsService: SkillsService);
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
    createSkill(body: {
        name: string;
        categoryId: string;
    }): Promise<{
        id: string;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.SkillStatus;
        categoryId: string;
        normalizedName: string;
        type: import(".prisma/client").$Enums.SkillType;
    }>;
    updateSkill(id: string, body: {
        name?: string;
        categoryId?: string;
        type?: 'HARD' | 'SOFT';
    }): Promise<{
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
    addSkillAlias(id: string, body: {
        aliasName: string;
    }): Promise<{
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
    mapUnrecognizedSkill(id: string, body: {
        targetSkillId: string;
    }): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        status: import(".prisma/client").$Enums.UnrecognizedSkillStatus;
        normalizedName: string | null;
        rawSkillName: string;
        categoryHint: string | null;
        frequency: number;
    }>;
    approveUnrecognizedSkill(id: string, body: {
        categoryId: string;
    }): Promise<{
        id: string;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.SkillStatus;
        categoryId: string;
        normalizedName: string;
        type: import(".prisma/client").$Enums.SkillType;
    }>;
    rejectUnrecognizedSkill(id: string): Promise<{
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
