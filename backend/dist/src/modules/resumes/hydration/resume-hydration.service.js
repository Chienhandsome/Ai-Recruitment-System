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
var ResumeHydrationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeHydrationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../database/prisma.service");
const resume_guard_service_1 = require("../domain/resume-guard.service");
const skill_resolver_service_1 = require("./skill-resolver.service");
const certificate_writer_1 = require("./writers/certificate-writer");
const education_writer_1 = require("./writers/education-writer");
const experience_writer_1 = require("./writers/experience-writer");
const profile_writer_1 = require("./writers/profile-writer");
const project_writer_1 = require("./writers/project-writer");
const skill_writer_1 = require("./writers/skill-writer");
class StaleResumeHydrationError extends Error {
}
let ResumeHydrationService = ResumeHydrationService_1 = class ResumeHydrationService {
    prisma;
    guard;
    skillResolver;
    experienceWriter;
    educationWriter;
    projectWriter;
    certificateWriter;
    skillWriter;
    profileWriter;
    logger = new common_1.Logger(ResumeHydrationService_1.name);
    constructor(prisma, guard, skillResolver, experienceWriter, educationWriter, projectWriter, certificateWriter, skillWriter, profileWriter) {
        this.prisma = prisma;
        this.guard = guard;
        this.skillResolver = skillResolver;
        this.experienceWriter = experienceWriter;
        this.educationWriter = educationWriter;
        this.projectWriter = projectWriter;
        this.certificateWriter = certificateWriter;
        this.skillWriter = skillWriter;
        this.profileWriter = profileWriter;
    }
    async hydrateProfile(resumeId, candidateProfileId, parsedData) {
        this.logger.log(`Hydrating profile ${candidateProfileId} from resume ${resumeId}`);
        if (!(await this.guard.canHydrate(resumeId, candidateProfileId))) {
            return;
        }
        const existingResume = await this.prisma.resume.findUnique({
            where: { id: resumeId },
            select: { parsingStatus: true },
        });
        if (existingResume?.parsingStatus === 'PARSED') {
            this.logger.debug(`Resume ${resumeId} was already hydrated; skipping duplicate result.`);
            return;
        }
        const resolvedSkills = await this.skillResolver.resolveAll(parsedData.skills);
        let hydrated;
        try {
            hydrated = await this.prisma.$transaction(async (tx) => {
                const currentProfile = await tx.candidateProfile.findUnique({
                    where: { id: candidateProfileId },
                    select: { primaryResumeId: true },
                });
                if (currentProfile?.primaryResumeId !== resumeId) {
                    await tx.resume.update({
                        where: { id: resumeId },
                        data: { parsingStatus: 'SUPERSEDED' },
                    });
                    return false;
                }
                const claimed = await tx.resume.updateMany({
                    where: { id: resumeId, parsingStatus: { not: 'PARSED' } },
                    data: { parsingStatus: 'PARSED', parsingErrorMessage: null },
                });
                if (claimed.count === 0)
                    return true;
                await this.writeParsedData(tx, resumeId, parsedData);
                await this.skillWriter.write(tx, candidateProfileId, resumeId, resolvedSkills);
                await this.experienceWriter.write(tx, candidateProfileId, resumeId, parsedData.work_experiences);
                await this.educationWriter.write(tx, candidateProfileId, resumeId, parsedData.educations);
                await this.projectWriter.write(tx, candidateProfileId, resumeId, parsedData.projects);
                await this.certificateWriter.write(tx, candidateProfileId, resumeId, parsedData.certificates);
                const profileUpdated = await this.profileWriter.write(tx, candidateProfileId, resumeId, parsedData);
                if (!profileUpdated) {
                    throw new StaleResumeHydrationError();
                }
                return true;
            }, { maxWait: 10_000, timeout: 30_000 });
        }
        catch (error) {
            if (!(error instanceof StaleResumeHydrationError))
                throw error;
            await this.prisma.resume.update({
                where: { id: resumeId },
                data: { parsingStatus: 'SUPERSEDED' },
            });
            hydrated = false;
        }
        if (!hydrated) {
            this.logger.warn(`Resume ${resumeId} became stale during hydration preparation; writes were skipped.`);
            return;
        }
        this.logger.log(`Profile ${candidateProfileId} hydrated from resume ${resumeId}`);
    }
    async handleFailure(resumeId, candidateProfileId, errorMessage, errorCode) {
        this.logger.warn(`Resume ${resumeId} analysis failed: ${errorMessage}`);
        if (errorCode === 'SIGNED_URL_EXPIRED') {
            await this.requeueAfterExpiredSignedUrl(resumeId, candidateProfileId, errorMessage);
            return;
        }
        const outcome = await this.prisma.$transaction(async (tx) => {
            const claimed = await tx.resume.updateMany({
                where: {
                    id: resumeId,
                    candidateId: candidateProfileId,
                    parsingStatus: { in: ['PENDING', 'PROCESSING'] },
                },
                data: {
                    parsingStatus: 'FAILED',
                    parsingErrorMessage: errorMessage,
                },
            });
            if (claimed.count === 0)
                return 'IGNORED';
            const profileUpdate = await tx.candidateProfile.updateMany({
                where: { id: candidateProfileId, primaryResumeId: resumeId },
                data: { status: 'FAILED' },
            });
            if (profileUpdate.count === 0) {
                await tx.resume.updateMany({
                    where: { id: resumeId, parsingStatus: 'FAILED' },
                    data: { parsingStatus: 'SUPERSEDED' },
                });
                return 'SUPERSEDED';
            }
            return 'FAILED';
        });
        if (outcome === 'SUPERSEDED') {
            this.logger.warn(`Resume ${resumeId} is stale; candidate ${candidateProfileId} remains unchanged.`);
        }
        else if (outcome === 'IGNORED') {
            this.logger.debug(`Ignoring late failure for terminal resume ${resumeId}.`);
        }
    }
    async requeueAfterExpiredSignedUrl(resumeId, candidateProfileId, errorMessage) {
        const outcome = await this.prisma.$transaction(async (tx) => {
            const claimed = await tx.resume.updateMany({
                where: {
                    id: resumeId,
                    candidateId: candidateProfileId,
                    parsingStatus: { in: ['PENDING', 'PROCESSING'] },
                },
                data: {
                    parsingStatus: 'PENDING',
                    parsingErrorMessage: errorMessage,
                },
            });
            if (claimed.count === 0)
                return 'IGNORED';
            const profileUpdate = await tx.candidateProfile.updateMany({
                where: { id: candidateProfileId, primaryResumeId: resumeId },
                data: { status: 'PROCESSING' },
            });
            if (profileUpdate.count === 0) {
                await tx.resume.updateMany({
                    where: { id: resumeId, parsingStatus: 'PENDING' },
                    data: { parsingStatus: 'SUPERSEDED' },
                });
                return 'SUPERSEDED';
            }
            return 'REQUEUED';
        });
        if (outcome === 'REQUEUED') {
            this.logger.warn(`Resume ${resumeId} returned to PENDING so the scheduler can issue a fresh signed URL.`);
        }
        else if (outcome === 'IGNORED') {
            this.logger.debug(`Ignoring late signed URL failure for terminal resume ${resumeId}.`);
        }
    }
    async writeParsedData(tx, resumeId, parsedData) {
        const payload = {
            summary: parsedData.summary ?? null,
            totalYearsExperience: parsedData.total_years_experience ?? null,
            totalYearsExperienceIsCalculated: true,
            educationData: parsedData.educations,
            experienceData: parsedData.work_experiences,
            certificateData: parsedData.certificates,
            projectData: parsedData.projects,
            languageData: (parsedData.languages ??
                []),
            rawParsedJson: parsedData,
            llmModel: parsedData.llm_model ?? null,
            promptVersion: parsedData.prompt_version ?? null,
            parserVersion: parsedData.parser_version ?? null,
            rawTextHash: parsedData.raw_text_hash ?? null,
            extractionDurationMs: parsedData.extraction_duration_ms ?? null,
            overallConfidence: parsedData.overall_confidence ?? null,
        };
        await tx.resumeParsedData.upsert({
            where: { resumeId },
            create: { resumeId, ...payload },
            update: { ...payload, parsedAt: new Date() },
        });
    }
};
exports.ResumeHydrationService = ResumeHydrationService;
exports.ResumeHydrationService = ResumeHydrationService = ResumeHydrationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        resume_guard_service_1.ResumeGuardService,
        skill_resolver_service_1.SkillResolverService,
        experience_writer_1.ExperienceWriter,
        education_writer_1.EducationWriter,
        project_writer_1.ProjectWriter,
        certificate_writer_1.CertificateWriter,
        skill_writer_1.SkillWriter,
        profile_writer_1.ProfileWriter])
], ResumeHydrationService);
//# sourceMappingURL=resume-hydration.service.js.map