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
        let categories = await this.prisma.skillCategory.findMany({
            orderBy: { name: 'asc' },
        });
        if (categories.length === 0) {
            this.logger.log('No skill categories found. Seeding default skill categories...');
            const defaultCategories = [
                'Công nghệ thông tin (IT & Software)',
                'Thiết kế, 3D & Truyền thông (Design & Media)',
                'Kế toán, Tài chính & Ngân hàng',
                'Kinh doanh, Bán hàng & CSKH (Sales)',
                'Marketing, SEO & Quảng cáo Digital',
                'Nhân sự, Pháp lý & Hành chính (HR & Legal)',
                'Y tế, Dược phẩm & Chăm sóc sức khỏe',
                'Vận tải, Kho vận & Logistics',
                'Xây dựng, Kiến trúc & Kỹ thuật',
                'Kỹ năng mềm & Quản trị (Soft Skills)',
            ];
            for (const name of defaultCategories) {
                await this.prisma.skillCategory.create({
                    data: { name },
                });
            }
            categories = await this.prisma.skillCategory.findMany({
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
        if (search && search.trim()) {
            const q = search.trim();
            whereClause.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { skillAliases: { some: { aliasName: { contains: q, mode: 'insensitive' } } } },
            ];
        }
        const skills = await this.prisma.skill.findMany({
            where: whereClause,
            include: {
                category: true,
                skillAliases: true,
            },
            orderBy: { name: 'asc' },
            take: 150,
        });
        return skills;
    }
    async createSkill(name, categoryId) {
        const trimmed = name.trim();
        if (!trimmed) {
            throw new common_1.BadRequestException('Tên kỹ năng không được để trống');
        }
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
            include: {
                category: true,
                skillAliases: true,
            },
        });
    }
    async updateSkill(id, name, categoryId, type) {
        const skill = await this.prisma.skill.findUnique({ where: { id } });
        if (!skill) {
            throw new common_1.NotFoundException('Không tìm thấy kỹ năng');
        }
        const data = {};
        if (name && name.trim()) {
            const trimmed = name.trim();
            data.name = trimmed;
            data.normalizedName = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        }
        if (categoryId) {
            data.categoryId = categoryId;
        }
        if (type) {
            data.type = type;
        }
        return this.prisma.skill.update({
            where: { id },
            data,
            include: {
                category: true,
                skillAliases: true,
            },
        });
    }
    async addSkillAlias(skillId, aliasName) {
        const trimmed = aliasName.trim();
        if (!trimmed) {
            throw new common_1.BadRequestException('Alias name cannot be empty');
        }
        const skill = await this.prisma.skill.findUnique({ where: { id: skillId } });
        if (!skill) {
            throw new common_1.NotFoundException('Skill not found');
        }
        const existing = await this.prisma.skillAlias.findFirst({
            where: { aliasName: { equals: trimmed, mode: 'insensitive' } },
        });
        if (existing) {
            if (existing.skillId === skillId) {
                return existing;
            }
            throw new common_1.BadRequestException(`Alias "${trimmed}" đã thuộc về kỹ năng khác`);
        }
        return this.prisma.skillAlias.create({
            data: {
                aliasName: trimmed,
                skillId,
            },
        });
    }
    async deleteSkillAlias(aliasId) {
        const existing = await this.prisma.skillAlias.findUnique({ where: { id: aliasId } });
        if (!existing) {
            throw new common_1.NotFoundException('Alias not found');
        }
        return this.prisma.skillAlias.delete({
            where: { id: aliasId },
        });
    }
    async getUnrecognizedSkills() {
        return this.prisma.unrecognizedSkill.findMany({
            where: { status: 'PENDING' },
            orderBy: { frequency: 'desc' },
        });
    }
    async mapUnrecognizedSkill(unrecognizedId, targetSkillId) {
        const unrecognized = await this.prisma.unrecognizedSkill.findUnique({
            where: { id: unrecognizedId },
        });
        if (!unrecognized) {
            throw new common_1.NotFoundException('Unrecognized skill not found');
        }
        const skill = await this.prisma.skill.findUnique({
            where: { id: targetSkillId },
        });
        if (!skill) {
            throw new common_1.NotFoundException('Target skill not found');
        }
        const aliasName = unrecognized.rawSkillName.trim();
        const existingAlias = await this.prisma.skillAlias.findFirst({
            where: { aliasName: { equals: aliasName, mode: 'insensitive' } },
        });
        if (!existingAlias) {
            await this.prisma.skillAlias.create({
                data: {
                    aliasName: aliasName,
                    skillId: targetSkillId,
                },
            });
        }
        return this.prisma.unrecognizedSkill.update({
            where: { id: unrecognizedId },
            data: { status: 'MERGED' },
        });
    }
    async approveUnrecognizedSkill(unrecognizedId, categoryId) {
        const unrecognized = await this.prisma.unrecognizedSkill.findUnique({
            where: { id: unrecognizedId },
        });
        if (!unrecognized) {
            throw new common_1.NotFoundException('Unrecognized skill not found');
        }
        const createdSkill = await this.createSkill(unrecognized.rawSkillName, categoryId);
        await this.prisma.unrecognizedSkill.update({
            where: { id: unrecognizedId },
            data: { status: 'APPROVED' },
        });
        return createdSkill;
    }
    async rejectUnrecognizedSkill(unrecognizedId) {
        return this.prisma.unrecognizedSkill.update({
            where: { id: unrecognizedId },
            data: { status: 'REJECTED' },
        });
    }
};
exports.SkillsService = SkillsService;
exports.SkillsService = SkillsService = SkillsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SkillsService);
//# sourceMappingURL=skills.service.js.map