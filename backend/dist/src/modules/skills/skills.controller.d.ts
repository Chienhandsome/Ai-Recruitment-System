import { SkillsService } from './skills.service';
export declare class SkillsController {
    private readonly skillsService;
    constructor(skillsService: SkillsService);
    getCategories(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
    }[]>;
    getSkills(categoryId?: string, search?: string): Promise<({
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
        };
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
    createSkill(body: {
        name: string;
        categoryId: string;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.SkillStatus;
        normalizedName: string;
        categoryId: string;
        type: import(".prisma/client").$Enums.SkillType;
    }>;
}
