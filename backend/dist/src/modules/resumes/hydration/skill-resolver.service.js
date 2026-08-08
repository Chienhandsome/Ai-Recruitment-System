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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillResolverService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../database/prisma.service");
const skill_normalizer_service_1 = require("../domain/skill-normalizer.service");
let SkillResolverService = class SkillResolverService {
    prisma;
    normalizer;
    constructor(prisma, normalizer) {
        this.prisma = prisma;
        this.normalizer = normalizer;
    }
    async resolveAll(skills) {
        const resolved = [];
        for (const skill of skills) {
            const dbSkill = await this.resolveOrQueue(skill.name, skill.category_hint);
            if (!dbSkill)
                continue;
            resolved.push({
                skillId: dbSkill.id,
                proficiencyLevel: skill.proficiency_level,
                isInferred: skill.is_inferred ?? false,
                sourceText: skill.source_text ?? null,
            });
        }
        return resolved;
    }
    async resolveOrQueue(skillName, categoryHint) {
        const trimmed = skillName.trim();
        const normalized = this.normalizer.normalize(trimmed);
        if (!trimmed || !normalized)
            return null;
        const existing = await this.prisma.skill.findFirst({
            where: {
                status: 'ACTIVE',
                OR: [
                    { normalizedName: normalized },
                    { name: { equals: trimmed, mode: 'insensitive' } },
                    {
                        skillAliases: {
                            some: {
                                aliasName: { equals: trimmed, mode: 'insensitive' },
                            },
                        },
                    },
                ],
            },
        });
        if (existing)
            return existing;
        const queued = (await this.prisma.unrecognizedSkill.findUnique({
            where: { normalizedName: normalized },
        })) ??
            (await this.prisma.unrecognizedSkill.findFirst({
                where: {
                    rawSkillName: { equals: trimmed, mode: 'insensitive' },
                },
            }));
        if (queued) {
            await this.prisma.unrecognizedSkill.update({
                where: { id: queued.id },
                data: {
                    normalizedName: queued.normalizedName ?? normalized,
                    categoryHint: categoryHint ?? queued.categoryHint,
                    frequency: { increment: 1 },
                },
            });
            return null;
        }
        try {
            await this.prisma.unrecognizedSkill.create({
                data: {
                    rawSkillName: trimmed,
                    normalizedName: normalized,
                    categoryHint: categoryHint ?? null,
                    status: 'PENDING',
                },
            });
        }
        catch (error) {
            if (error.code !== 'P2002')
                throw error;
            await this.prisma.unrecognizedSkill.update({
                where: { normalizedName: normalized },
                data: { frequency: { increment: 1 } },
            });
        }
        return null;
    }
};
exports.SkillResolverService = SkillResolverService;
exports.SkillResolverService = SkillResolverService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        skill_normalizer_service_1.SkillNormalizerService])
], SkillResolverService);
//# sourceMappingURL=skill-resolver.service.js.map