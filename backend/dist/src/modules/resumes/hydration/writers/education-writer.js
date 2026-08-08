"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EducationWriter = void 0;
const common_1 = require("@nestjs/common");
let EducationWriter = class EducationWriter {
    async write(tx, candidateProfileId, resumeId, educations) {
        await tx.education.deleteMany({
            where: { candidateProfileId, source: 'EXTRACTED' },
        });
        if (educations.length === 0)
            return;
        await tx.education.createMany({
            data: educations.map((education) => ({
                candidateProfileId,
                resumeId,
                source: 'EXTRACTED',
                schoolName: education.school_name,
                major: education.major ?? null,
                degree: education.degree ?? null,
                startDate: education.start_date ? new Date(education.start_date) : null,
                endDate: education.end_date ? new Date(education.end_date) : null,
                description: education.description ?? null,
                isInferred: education.is_inferred ?? false,
                sourceText: education.source_text ?? null,
            })),
        });
    }
};
exports.EducationWriter = EducationWriter;
exports.EducationWriter = EducationWriter = __decorate([
    (0, common_1.Injectable)()
], EducationWriter);
//# sourceMappingURL=education-writer.js.map