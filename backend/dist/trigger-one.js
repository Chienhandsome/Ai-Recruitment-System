"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const amqp = __importStar(require("amqplib"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const prisma = new client_1.PrismaClient();
async function main() {
    const appId = "ce24bcbc-7b8c-4a29-b601-22239fe48067";
    const app = await prisma.application.findUnique({
        where: { id: appId },
        include: {
            candidate: {
                include: {
                    candidateSkills: { include: { skill: true } },
                    workExperiences: true,
                    educations: true,
                    projects: true,
                },
            },
            job: true,
        },
    });
    if (!app)
        return;
    await prisma.application.update({
        where: { id: appId },
        data: { processingStatus: client_1.ApplicationProcessingStatus.MATCHING },
    });
    const cand = app.candidate;
    const job = app.job;
    const conn = await amqp.connect(process.env.RABBITMQ_URL);
    const ch = await conn.createChannel();
    const payload = {
        applicationId: app.id,
        application_id: app.id,
        candidate_profile: {
            profile: {
                id: cand.id,
                candidate_user_id: cand.userId,
                desired_title: cand.desiredTitle,
                professional_summary: cand.professionalSummary,
            },
            work_experiences: cand.workExperiences.map(ex => ({
                company_name: ex.companyName,
                position_title: ex.positionTitle,
                start_date: ex.startDate ? ex.startDate.toISOString() : undefined,
                end_date: ex.endDate ? ex.endDate.toISOString() : undefined,
                is_current: ex.isCurrent,
                description: ex.description,
            })),
            educations: cand.educations.map(ed => ({
                school_name: ed.schoolName,
                major: ed.major,
                degree: ed.degree,
            })),
            projects: cand.projects.map(pr => ({
                project_name: pr.projectName,
                project_role: pr.projectRole,
                description: pr.description,
            })),
            skills: cand.candidateSkills.map(cs => ({
                skill_id: cs.skillId,
                skill_name: cs.skill?.name,
                proficiency_level: cs.proficiencyLevel,
            })),
        },
        job: {
            id: job.id,
            title: job.title,
            description: job.description,
            requirements: job.requirements,
            required_experience_years: 2,
            required_skills: [
                { skill_name: "React", is_mandatory: true, minimum_level: "ADVANCED" },
                { skill_name: "TypeScript", is_mandatory: true, minimum_level: "INTERMEDIATE" },
                { skill_name: "Git", is_mandatory: true, minimum_level: "INTERMEDIATE" },
                { skill_name: "Tailwind CSS", is_mandatory: false, minimum_level: "INTERMEDIATE" },
            ],
        },
        weights: {
            skills: 40.0,
            experience: 30.0,
            education: 15.0,
            other: 15.0,
        },
    };
    ch.publish('ai_recruitment_events', 'evaluation.requested', Buffer.from(JSON.stringify(payload)), { persistent: true });
    console.log("Triggered evaluation for Mid FE!");
    setTimeout(() => conn.close(), 1000);
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=trigger-one.js.map