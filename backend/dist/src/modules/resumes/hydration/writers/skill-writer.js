"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SkillWriter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillWriter = void 0;
const common_1 = require("@nestjs/common");
let SkillWriter = SkillWriter_1 = class SkillWriter {
    logger = new common_1.Logger(SkillWriter_1.name);
    async write(tx, candidateProfileId, resumeId, skills) {
        await tx.candidateSkill.deleteMany({
            where: { candidateId: candidateProfileId, source: 'EXTRACTED' },
        });
        for (const skill of skills) {
            const existing = await tx.candidateSkill.findUnique({
                where: {
                    candidateId_skillId: {
                        candidateId: candidateProfileId,
                        skillId: skill.skillId,
                    },
                },
            });
            if (existing && existing.source !== 'EXTRACTED') {
                this.logger.debug(`Keeping ${existing.source} skill ${skill.skillId} for candidate ${candidateProfileId}`);
                continue;
            }
            await tx.candidateSkill.upsert({
                where: {
                    candidateId_skillId: {
                        candidateId: candidateProfileId,
                        skillId: skill.skillId,
                    },
                },
                create: {
                    candidateId: candidateProfileId,
                    skillId: skill.skillId,
                    resumeId,
                    proficiencyLevel: skill.proficiencyLevel,
                    isPrimary: false,
                    source: 'EXTRACTED',
                    isInferred: skill.isInferred,
                    sourceText: skill.sourceText,
                },
                update: {
                    proficiencyLevel: skill.proficiencyLevel,
                    resumeId,
                    source: 'EXTRACTED',
                    isInferred: skill.isInferred,
                    sourceText: skill.sourceText,
                },
            });
        }
    }
};
exports.SkillWriter = SkillWriter;
exports.SkillWriter = SkillWriter = SkillWriter_1 = __decorate([
    (0, common_1.Injectable)()
], SkillWriter);
//# sourceMappingURL=skill-writer.js.map