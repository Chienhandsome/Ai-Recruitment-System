import { SkillsService } from './skills.service';
export declare class SkillsController {
    private readonly skillsService;
    constructor(skillsService: SkillsService);
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
        categoryId: string;
        normalizedName: string;
        type: import(".prisma/client").$Enums.SkillType;
    })[]>;
    createSkill(body: {
        name: string;
        categoryId: string;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
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
        categoryId: string;
        normalizedName: string;
        type: import(".prisma/client").$Enums.SkillType;
    }>;
    addSkillAlias(id: string, body: {
        aliasName: string;
    }): Promise<{
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
    mapUnrecognizedSkill(id: string, body: {
        targetSkillId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.UnrecognizedSkillStatus;
        rawSkillName: string;
        frequency: number;
    }>;
    approveUnrecognizedSkill(id: string, body: {
        categoryId: string;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.SkillStatus;
        categoryId: string;
        normalizedName: string;
        type: import(".prisma/client").$Enums.SkillType;
    }>;
    rejectUnrecognizedSkill(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.UnrecognizedSkillStatus;
        rawSkillName: string;
        frequency: number;
    }>;
}
