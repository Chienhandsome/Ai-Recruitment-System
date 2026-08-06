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
const supabase_js_1 = require("@supabase/supabase-js");
const amqp = __importStar(require("amqplib"));
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
dotenv.config({ path: path.join(__dirname, '.env') });
const prisma = new client_1.PrismaClient();
const supabaseUrl = process.env.SUPABASE_URL || 'https://wiszatdvijicvfucxgom.supabase.co';
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseSecretKey) {
    console.error("SUPABASE_SECRET_KEY is missing!");
    process.exit(1);
}
const supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseSecretKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
async function main() {
    console.log("🚀 Starting Seed for 3 Frontend Developer Candidates...");
    const rabbitUrl = process.env.RABBITMQ_URL;
    let amqpConn = null;
    let amqpChannel = null;
    if (rabbitUrl) {
        try {
            amqpConn = await amqp.connect(rabbitUrl);
            amqpChannel = await amqpConn.createChannel();
            await amqpChannel.assertExchange('ai_recruitment_events', 'topic', { durable: true });
            console.log("✅ Connected to RabbitMQ for instant evaluation triggering.");
        }
        catch (err) {
            console.warn("⚠️ Could not connect to RabbitMQ directly in seed script:", err);
        }
    }
    const jobId = "53a0d8da-ca1a-4858-8e5a-57e405f8fd79";
    const job = await prisma.jobPosting.findUnique({
        where: { id: jobId },
    });
    if (!job) {
        console.error(`Job ${jobId} not found.`);
        return;
    }
    await prisma.jobPosting.update({
        where: { id: jobId },
        data: {
            status: "PUBLISHED",
            requiredExperienceYears: 2,
            skillWeight: 40,
            experienceWeight: 30,
            educationWeight: 15,
            otherWeight: 15,
        },
    });
    console.log(`✅ Job '${job.title}' updated & published.`);
    const reactSkill = await prisma.skill.findFirst({ where: { normalizedName: 'react' } });
    const tsSkill = await prisma.skill.findFirst({ where: { normalizedName: 'typescript' } });
    const gitSkill = await prisma.skill.findFirst({ where: { normalizedName: 'git' } });
    const tailwindSkill = await prisma.skill.findFirst({ where: { normalizedName: 'tailwindcss' } });
    const figmaSkill = await prisma.skill.findFirst({ where: { normalizedName: 'figma-uiux-design' } });
    const pythonSkill = await prisma.skill.findFirst({ where: { normalizedName: 'python-backend' } }) || await prisma.skill.findFirst({ where: { normalizedName: 'python' } });
    const fbAdsSkill = await prisma.skill.findFirst({ where: { normalizedName: 'fb-tiktok-ads' } });
    if (reactSkill) {
        await prisma.jobSkill.upsert({
            where: { jobId_skillId: { jobId, skillId: reactSkill.id } },
            update: { requirementType: client_1.SkillRequirementType.MANDATORY, minimumProficiency: client_1.ProficiencyLevel.ADVANCED },
            create: { jobId, skillId: reactSkill.id, requirementType: client_1.SkillRequirementType.MANDATORY, minimumProficiency: client_1.ProficiencyLevel.ADVANCED },
        });
    }
    if (tsSkill) {
        await prisma.jobSkill.upsert({
            where: { jobId_skillId: { jobId, skillId: tsSkill.id } },
            update: { requirementType: client_1.SkillRequirementType.MANDATORY, minimumProficiency: client_1.ProficiencyLevel.INTERMEDIATE },
            create: { jobId, skillId: tsSkill.id, requirementType: client_1.SkillRequirementType.MANDATORY, minimumProficiency: client_1.ProficiencyLevel.INTERMEDIATE },
        });
    }
    if (gitSkill) {
        await prisma.jobSkill.upsert({
            where: { jobId_skillId: { jobId, skillId: gitSkill.id } },
            update: { requirementType: client_1.SkillRequirementType.MANDATORY, minimumProficiency: client_1.ProficiencyLevel.INTERMEDIATE },
            create: { jobId, skillId: gitSkill.id, requirementType: client_1.SkillRequirementType.MANDATORY, minimumProficiency: client_1.ProficiencyLevel.INTERMEDIATE },
        });
    }
    if (tailwindSkill) {
        await prisma.jobSkill.upsert({
            where: { jobId_skillId: { jobId, skillId: tailwindSkill.id } },
            update: { requirementType: client_1.SkillRequirementType.PREFERRED, minimumProficiency: client_1.ProficiencyLevel.INTERMEDIATE },
            create: { jobId, skillId: tailwindSkill.id, requirementType: client_1.SkillRequirementType.PREFERRED, minimumProficiency: client_1.ProficiencyLevel.INTERMEDIATE },
        });
    }
    if (figmaSkill) {
        await prisma.jobSkill.upsert({
            where: { jobId_skillId: { jobId, skillId: figmaSkill.id } },
            update: { requirementType: client_1.SkillRequirementType.NICE_TO_HAVE, minimumProficiency: client_1.ProficiencyLevel.BEGINNER },
            create: { jobId, skillId: figmaSkill.id, requirementType: client_1.SkillRequirementType.NICE_TO_HAVE, minimumProficiency: client_1.ProficiencyLevel.BEGINNER },
        });
    }
    console.log("✅ Added required skills (React, TypeScript, Git, Tailwind) to Frontend Developer job.");
    const candidateRole = await prisma.role.findUnique({ where: { code: 'CANDIDATE' } });
    if (!candidateRole)
        throw new Error("CANDIDATE role not found in DB");
    const candidateSeeds = [
        {
            email: "fe.senior@example.com",
            password: "Password123!",
            fullName: "Trần Văn Cao Cấp (Senior FE)",
            desiredTitle: "Senior Frontend Engineer",
            summary: "Lập trình viên Frontend với 4 năm kinh nghiệm chuyên sâu về React, TypeScript, Next.js và Tailwind CSS. Đã trực tiếp xây dựng & tối ưu hiệu năng UI/UX cho nền tảng thương mại điện tử lớn.",
            skills: [
                { skill: reactSkill, level: client_1.ProficiencyLevel.EXPERT, isPrimary: true },
                { skill: tsSkill, level: client_1.ProficiencyLevel.ADVANCED, isPrimary: true },
                { skill: gitSkill, level: client_1.ProficiencyLevel.ADVANCED, isPrimary: false },
                { skill: tailwindSkill, level: client_1.ProficiencyLevel.ADVANCED, isPrimary: false },
                { skill: figmaSkill, level: client_1.ProficiencyLevel.INTERMEDIATE, isPrimary: false },
            ],
            experiences: [
                {
                    companyName: "TechCorp Vietnam",
                    positionTitle: "Senior Frontend Engineer",
                    startDate: new Date("2022-01-01"),
                    endDate: new Date("2024-03-01"),
                    isCurrent: false,
                    description: "Phát triển giao diện web với React, TypeScript, Redux Toolkit, Tailwind CSS. Tối ưu Core Web Vitals giúp tăng 30% tốc độ load trang.",
                    achievements: "Cải thiện Core Web Vitals, tái cấu trúc codebase sang TypeScript."
                },
                {
                    companyName: "EComGlobal Portal",
                    positionTitle: "Frontend Team Lead",
                    startDate: new Date("2024-03-15"),
                    endDate: null,
                    isCurrent: true,
                    description: "Quản lý team 5 devs, chuyển đổi hệ thống sang Next.js App Router, sử dụng TypeScript và Git CI/CD.",
                    achievements: "Dẫn dắt 5 lập trình viên nâng cấp hệ thống web app."
                }
            ],
            educations: [
                {
                    schoolName: "Đại học Bách Khoa TP.HCM",
                    major: "Kỹ thuật Phần mềm",
                    degree: "Kỹ sư",
                    startDate: new Date("2018-09-01"),
                    endDate: new Date("2022-06-30"),
                }
            ],
            projects: [
                {
                    projectName: "E-Commerce Microfrontend Portal",
                    projectRole: "Frontend Lead",
                    description: "Ứng dụng React & Next.js tích hợp TypeScript, TailwindCSS và Git quản lý mã nguồn.",
                    technologies: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Git"],
                }
            ],
            targetMatch: "HIGH"
        },
        {
            email: "fe.mid@example.com",
            password: "Password123!",
            fullName: "Nguyễn Trung Bình (Mid FE)",
            desiredTitle: "Frontend Developer",
            summary: "Có 1.5 năm kinh nghiệm làm việc với HTML, CSS, JavaScript và React cơ bản. Đang học hỏi thêm TypeScript và Git.",
            skills: [
                { skill: reactSkill, level: client_1.ProficiencyLevel.INTERMEDIATE, isPrimary: true },
                { skill: gitSkill, level: client_1.ProficiencyLevel.INTERMEDIATE, isPrimary: false },
            ],
            experiences: [
                {
                    companyName: "SoftAgency Studio",
                    positionTitle: "Junior Web Developer",
                    startDate: new Date("2024-06-01"),
                    endDate: null,
                    isCurrent: true,
                    description: "Xây dựng website bán hàng bằng ReactJS và Git. Tối ưu giao diện đáp ứng responsive.",
                    achievements: "Hoàn thành 3 dự án website bán hàng."
                }
            ],
            educations: [
                {
                    schoolName: "Cao đẳng Công nghệ Thông tin",
                    major: "Tin học ứng dụng",
                    degree: "Cử nhân thực hành",
                    startDate: new Date("2021-09-01"),
                    endDate: new Date("2024-05-30"),
                }
            ],
            projects: [
                {
                    projectName: "Company Landing Page",
                    projectRole: "Frontend Developer",
                    description: "Dựng landing page bán hàng sử dụng ReactJS và Tailwind CSS.",
                    technologies: ["React", "JavaScript", "HTML", "CSS"],
                }
            ],
            targetMatch: "MEDIUM"
        },
        {
            email: "fe.low@example.com",
            password: "Password123!",
            fullName: "Lê Thấp Điểm (Non-FE / Marketing)",
            desiredTitle: "Digital Marketing Specialist",
            summary: "Chuyên viên Marketing với kinh nghiệm chạy quảng cáo Facebook, TikTok Ads và sáng tạo nội dung. Không có kinh nghiệm lập trình Frontend hay React.",
            skills: [
                { skill: fbAdsSkill, level: client_1.ProficiencyLevel.ADVANCED, isPrimary: true },
                { skill: pythonSkill, level: client_1.ProficiencyLevel.BEGINNER, isPrimary: false },
            ],
            experiences: [
                {
                    companyName: "AgencyX Marketing",
                    positionTitle: "Marketing Specialist",
                    startDate: new Date("2023-01-01"),
                    endDate: new Date("2024-12-31"),
                    isCurrent: false,
                    description: "Quản lý chiến dịch quảng cáo Facebook & TikTok Ads, tối ưu chuyển đổi lead.",
                    achievements: "Tăng 50% doanh số từ kênh Facebook Ads."
                }
            ],
            educations: [
                {
                    schoolName: "Đại học Kinh tế TP.HCM",
                    major: "Marketing",
                    degree: "Cử nhân",
                    startDate: new Date("2019-09-01"),
                    endDate: new Date("2023-06-30"),
                }
            ],
            projects: [
                {
                    projectName: "TikTok Viral Campaign",
                    projectRole: "Campaign Lead",
                    description: "Chạy chiến dịch quảng cáo truyền thông trên TikTok và Meta.",
                    technologies: ["Facebook Ads", "TikTok Ads", "Content"],
                }
            ],
            targetMatch: "LOW"
        }
    ];
    for (const candData of candidateSeeds) {
        console.log(`\n------------------------------------------------`);
        console.log(`🔄 Processing Candidate: ${candData.fullName} (${candData.email})`);
        let userId;
        const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingAuth = existingAuthUsers?.users?.find(u => u.email?.toLowerCase() === candData.email.toLowerCase());
        if (existingAuth) {
            userId = existingAuth.id;
            console.log(`  ℹ️ Found existing Supabase Auth User ID: ${userId}`);
        }
        else {
            const { data: newAuth, error: authErr } = await supabaseAdmin.auth.admin.createUser({
                email: candData.email,
                password: candData.password,
                email_confirm: true,
                user_metadata: { full_name: candData.fullName },
            });
            if (authErr || !newAuth.user) {
                console.error(`  ❌ Failed to create Supabase Auth User: ${authErr?.message}`);
                continue;
            }
            userId = newAuth.user.id;
            console.log(`  ✅ Created Supabase Auth User ID: ${userId}`);
        }
        const user = await prisma.user.upsert({
            where: { id: userId },
            update: {
                email: candData.email,
                fullName: candData.fullName,
                status: "ACTIVE",
            },
            create: {
                id: userId,
                email: candData.email,
                fullName: candData.fullName,
                status: "ACTIVE",
            },
        });
        await prisma.userRole.upsert({
            where: { userId_roleId: { userId: user.id, roleId: candidateRole.id } },
            update: {},
            create: { userId: user.id, roleId: candidateRole.id },
        });
        let profile = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
        if (!profile) {
            profile = await prisma.candidateProfile.create({
                data: {
                    userId: user.id,
                    fullName: candData.fullName,
                    email: candData.email,
                    desiredTitle: candData.desiredTitle,
                    professionalSummary: candData.summary,
                    status: client_1.CandidateProfileStatus.READY,
                },
            });
        }
        else {
            profile = await prisma.candidateProfile.update({
                where: { id: profile.id },
                data: {
                    fullName: candData.fullName,
                    email: candData.email,
                    desiredTitle: candData.desiredTitle,
                    professionalSummary: candData.summary,
                    status: client_1.CandidateProfileStatus.READY,
                },
            });
        }
        console.log(`  ✅ CandidateProfile ready ID: ${profile.id}`);
        let resume = await prisma.resume.findFirst({ where: { candidateId: profile.id } });
        if (!resume) {
            resume = await prisma.resume.create({
                data: {
                    candidateId: profile.id,
                    originalFileName: `${candData.fullName.replace(/\s+/g, '_')}_CV.pdf`,
                    objectPath: `mock/${profile.id}.pdf`,
                    mimeType: 'application/pdf',
                    fileSizeBytes: 102400,
                },
            });
            await prisma.candidateProfile.update({
                where: { id: profile.id },
                data: { primaryResumeId: resume.id },
            });
        }
        await prisma.candidateSkill.deleteMany({ where: { candidateId: profile.id } });
        for (const sk of candData.skills) {
            if (sk.skill) {
                await prisma.candidateSkill.create({
                    data: {
                        candidateId: profile.id,
                        skillId: sk.skill.id,
                        proficiencyLevel: sk.level,
                        isPrimary: sk.isPrimary,
                    },
                });
            }
        }
        await prisma.workExperience.deleteMany({ where: { candidateProfileId: profile.id } });
        for (const exp of candData.experiences) {
            await prisma.workExperience.create({
                data: {
                    candidateProfileId: profile.id,
                    companyName: exp.companyName,
                    positionTitle: exp.positionTitle,
                    startDate: exp.startDate,
                    endDate: exp.endDate,
                    isCurrent: exp.isCurrent,
                    description: exp.description,
                    achievements: exp.achievements,
                },
            });
        }
        await prisma.education.deleteMany({ where: { candidateProfileId: profile.id } });
        for (const edu of candData.educations) {
            await prisma.education.create({
                data: {
                    candidateProfileId: profile.id,
                    schoolName: edu.schoolName,
                    major: edu.major,
                    degree: edu.degree,
                    startDate: edu.startDate,
                    endDate: edu.endDate,
                },
            });
        }
        await prisma.project.deleteMany({ where: { candidateProfileId: profile.id } });
        for (const proj of candData.projects) {
            await prisma.project.create({
                data: {
                    candidateProfileId: profile.id,
                    projectName: proj.projectName,
                    projectRole: proj.projectRole,
                    description: proj.description,
                    technologies: proj.technologies,
                },
            });
        }
        console.log(`  ✅ Profile Skills, Experience, Education & Projects Populated.`);
        const existingApp = await prisma.application.findUnique({
            where: { jobId_candidateId: { jobId, candidateId: profile.id } },
        });
        let app;
        if (existingApp) {
            await prisma.aiMatchingResult.deleteMany({ where: { applicationId: existingApp.id } });
            app = await prisma.application.update({
                where: { id: existingApp.id },
                data: {
                    processingStatus: client_1.ApplicationProcessingStatus.MATCHING,
                    currentStage: client_1.ApplicationStage.RECEIVED,
                },
            });
            console.log(`  ℹ️ Updated existing Application ID: ${app.id}`);
        }
        else {
            app = await prisma.application.create({
                data: {
                    jobId,
                    candidateId: profile.id,
                    resumeId: resume.id,
                    source: 'DIRECT_APPLY',
                    currentStage: client_1.ApplicationStage.RECEIVED,
                    processingStatus: client_1.ApplicationProcessingStatus.MATCHING,
                    profileSnapshot: {
                        fullName: candData.fullName,
                        email: candData.email,
                    },
                },
            });
            console.log(`  ✅ Created new Application ID: ${app.id}`);
        }
        if (amqpChannel) {
            const evaluationPayload = {
                applicationId: app.id,
                application_id: app.id,
                candidate_profile: {
                    profile: {
                        id: profile.id,
                        candidate_user_id: profile.userId,
                        desired_title: profile.desiredTitle,
                        professional_summary: profile.professionalSummary,
                    },
                    work_experiences: candData.experiences.map(ex => ({
                        company_name: ex.companyName,
                        position_title: ex.positionTitle,
                        start_date: ex.startDate ? ex.startDate.toISOString() : undefined,
                        end_date: ex.endDate ? ex.endDate.toISOString() : undefined,
                        is_current: ex.isCurrent,
                        description: ex.description,
                    })),
                    educations: candData.educations.map(ed => ({
                        school_name: ed.schoolName,
                        major: ed.major,
                        degree: ed.degree,
                    })),
                    projects: candData.projects.map(pr => ({
                        project_name: pr.projectName,
                        project_role: pr.projectRole,
                        description: pr.description,
                    })),
                    skills: candData.skills.map(sk => ({
                        skill_id: sk.skill?.id,
                        skill_name: sk.skill?.name,
                        proficiency_level: sk.level,
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
                        { skill_name: "Figma & UI/UX Design", is_mandatory: false, minimum_level: "BEGINNER" },
                    ],
                },
                weights: {
                    skills: 40.0,
                    experience: 30.0,
                    education: 15.0,
                    other: 15.0,
                },
            };
            amqpChannel.publish('ai_recruitment_events', 'evaluation.requested', Buffer.from(JSON.stringify(evaluationPayload)), { persistent: true });
            console.log(`  🚀 Triggered AI Evaluation via RabbitMQ for Application ID: ${app.id}`);
        }
    }
    if (amqpConn) {
        setTimeout(async () => {
            await amqpConn?.close();
        }, 1000);
    }
    console.log("\n🎉 Seed Completed Successfully!");
}
main()
    .catch((e) => {
    console.error("❌ Error running seed:", e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-frontend-candidates.js.map