"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectWriter = void 0;
const common_1 = require("@nestjs/common");
let ProjectWriter = class ProjectWriter {
    async write(tx, candidateProfileId, resumeId, projects) {
        await tx.project.deleteMany({
            where: { candidateProfileId, source: 'EXTRACTED' },
        });
        if (projects.length === 0)
            return;
        await tx.project.createMany({
            data: projects.map((project) => ({
                candidateProfileId,
                resumeId,
                source: 'EXTRACTED',
                projectName: project.project_name,
                projectRole: project.project_role ?? null,
                description: project.description ?? null,
                technologies: (project.technologies ??
                    undefined),
                projectUrl: project.project_url ?? null,
                startDate: project.start_date ? new Date(project.start_date) : null,
                endDate: project.end_date ? new Date(project.end_date) : null,
                isInferred: project.is_inferred ?? false,
                sourceText: project.source_text ?? null,
            })),
        });
    }
};
exports.ProjectWriter = ProjectWriter;
exports.ProjectWriter = ProjectWriter = __decorate([
    (0, common_1.Injectable)()
], ProjectWriter);
//# sourceMappingURL=project-writer.js.map