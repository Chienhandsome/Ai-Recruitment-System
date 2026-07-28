"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SkillsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let SkillsService = SkillsService_1 = class SkillsService {
    prisma;
    logger = new common_1.Logger(SkillsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCategories() {
        let categories = await this.prisma.jobCategory.findMany({
            orderBy: { name: 'asc' },
        });
        if (categories.length === 0) {
            this.logger.log('No job categories found. Seeding default multi-industry categories...');
            const defaultCategories = [
                { name: 'Công nghệ thông tin (IT)', slug: 'it-software' },
                { name: 'Thiết kế & Đồ họa (Design/3D)', slug: 'design-media' },
                { name: 'Kế toán & Tài chính', slug: 'accounting-finance' },
                { name: 'Kinh doanh & Bán hàng (Sales)', slug: 'sales-business' },
                { name: 'Marketing & Truyền thông', slug: 'marketing-pr' },
                { name: 'Nhân sự & Hành chính', slug: 'hr-admin' },
                { name: 'Y tế & Dược phẩm', slug: 'healthcare-pharma' },
                { name: 'Vận tải & Logistics', slug: 'logistics-supplychain' },
            ];
            for (const cat of defaultCategories) {
                await this.prisma.jobCategory.upsert({
                    where: { slug: cat.slug },
                    update: {},
                    create: cat,
                });
            }
            categories = await this.prisma.jobCategory.findMany({
                orderBy: { name: 'asc' },
            });
        }
        return categories;
    }
    async getSkills(categoryId, search) {
        const whereClause = { status: 'ACTIVE' };
        if (categoryId) {
            whereClause.categoryId = categoryId;
        }
        if (search) {
            whereClause.name = { contains: search, mode: 'insensitive' };
        }
        let skills = await this.prisma.skill.findMany({
            where: whereClause,
            include: { category: true },
            orderBy: { name: 'asc' },
            take: 100,
        });
        if (skills.length === 0 && !search) {
            this.logger.log('Seeding initial skill dictionary...');
            const categories = await this.getCategories();
            const itCat = categories.find((c) => c.slug === 'it-software') || categories[0];
            const designCat = categories.find((c) => c.slug === 'design-media') || categories[0];
            const accCat = categories.find((c) => c.slug === 'accounting-finance') || categories[0];
            const initialSkills = [
                { name: 'React.js', normalizedName: 'reactjs', categoryId: itCat.id, type: 'HARD' },
                { name: 'TypeScript', normalizedName: 'typescript', categoryId: itCat.id, type: 'HARD' },
                { name: 'Node.js', normalizedName: 'nodejs', categoryId: itCat.id, type: 'HARD' },
                { name: 'Python', normalizedName: 'python', categoryId: itCat.id, type: 'HARD' },
                { name: 'PostgreSQL', normalizedName: 'postgresql', categoryId: itCat.id, type: 'HARD' },
                { name: 'Blender 3D', normalizedName: 'blender-3d', categoryId: designCat.id, type: 'HARD' },
                { name: 'Photoshop', normalizedName: 'photoshop', categoryId: designCat.id, type: 'HARD' },
                { name: 'Figma', normalizedName: 'figma', categoryId: designCat.id, type: 'HARD' },
                { name: 'Báo cáo Tài chính', normalizedName: 'financial-report', categoryId: accCat.id, type: 'HARD' },
                { name: 'Phần mềm MISA', normalizedName: 'misa-software', categoryId: accCat.id, type: 'HARD' },
                { name: 'Giao tiếp & Làm việc nhóm', normalizedName: 'teamwork-communication', categoryId: itCat.id, type: 'SOFT' },
                { name: 'Tiếng Anh Giao tiếp', normalizedName: 'english-communication', categoryId: itCat.id, type: 'SOFT' },
            ];
            for (const s of initialSkills) {
                await this.prisma.skill.upsert({
                    where: { normalizedName: s.normalizedName },
                    update: {},
                    create: s,
                });
            }
            skills = await this.prisma.skill.findMany({
                where: whereClause,
                include: { category: true },
                orderBy: { name: 'asc' },
                take: 100,
            });
        }
        return skills;
    }
    async createSkill(name, categoryId) {
        const trimmed = name.trim();
        const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const existing = await this.prisma.skill.findFirst({
            where: {
                OR: [
                    { normalizedName: normalized },
                    { name: { equals: trimmed, mode: 'insensitive' } },
                ],
            },
        });
        if (existing) {
            return existing;
        }
        return this.prisma.skill.create({
            data: {
                name: trimmed,
                normalizedName: normalized,
                categoryId,
                type: 'HARD',
                status: 'ACTIVE',
            },
            include: { category: true },
        });
    }
};
exports.SkillsService = SkillsService;
exports.SkillsService = SkillsService = SkillsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SkillsService);
//# sourceMappingURL=skills.service.js.map