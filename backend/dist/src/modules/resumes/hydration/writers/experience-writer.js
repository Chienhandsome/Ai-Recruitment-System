"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperienceWriter = void 0;
const common_1 = require("@nestjs/common");
let ExperienceWriter = class ExperienceWriter {
    async write(tx, candidateProfileId, resumeId, experiences) {
        await tx.workExperience.deleteMany({
            where: { candidateProfileId, source: 'EXTRACTED' },
        });
        const validExperiences = experiences.filter((experience) => experience.start_date);
        if (validExperiences.length === 0)
            return;
        await tx.workExperience.createMany({
            data: validExperiences.map((experience) => ({
                candidateProfileId,
                resumeId,
                source: 'EXTRACTED',
                companyName: experience.company_name,
                positionTitle: experience.position_title,
                startDate: new Date(experience.start_date),
                endDate: experience.end_date ? new Date(experience.end_date) : null,
                isCurrent: experience.is_current,
                description: experience.description ?? null,
                achievements: experience.achievements ?? null,
                isInferred: experience.is_inferred ?? false,
                sourceText: experience.source_text ?? null,
            })),
        });
    }
};
exports.ExperienceWriter = ExperienceWriter;
exports.ExperienceWriter = ExperienceWriter = __decorate([
    (0, common_1.Injectable)()
], ExperienceWriter);
//# sourceMappingURL=experience-writer.js.map