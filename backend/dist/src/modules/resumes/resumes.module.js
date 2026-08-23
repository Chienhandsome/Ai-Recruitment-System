"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumesModule = void 0;
const common_1 = require("@nestjs/common");
const resumes_controller_1 = require("./resumes.controller");
const resumes_service_1 = require("./resumes.service");
const upload_resume_use_case_1 = require("./application/upload-resume.use-case");
const retry_stuck_resumes_use_case_1 = require("./application/retry-stuck-resumes.use-case");
const resume_guard_service_1 = require("./domain/resume-guard.service");
const skill_normalizer_service_1 = require("./domain/skill-normalizer.service");
const resume_hydration_service_1 = require("./hydration/resume-hydration.service");
const skill_resolver_service_1 = require("./hydration/skill-resolver.service");
const certificate_writer_1 = require("./hydration/writers/certificate-writer");
const education_writer_1 = require("./hydration/writers/education-writer");
const experience_writer_1 = require("./hydration/writers/experience-writer");
const profile_writer_1 = require("./hydration/writers/profile-writer");
const project_writer_1 = require("./hydration/writers/project-writer");
const skill_writer_1 = require("./hydration/writers/skill-writer");
const resume_result_listener_1 = require("./transport/resume-result.listener");
const prisma_module_1 = require("../../database/prisma.module");
const auth_module_1 = require("../auth/auth.module");
const supabase_module_1 = require("../../infrastructure/supabase/supabase.module");
const rabbitmq_module_1 = require("../../infrastructure/rabbitmq/rabbitmq.module");
const ai_service_wakeup_service_1 = require("../../infrastructure/ai/ai-service-wakeup.service");
let ResumesModule = class ResumesModule {
};
exports.ResumesModule = ResumesModule;
exports.ResumesModule = ResumesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule, supabase_module_1.SupabaseModule, rabbitmq_module_1.RabbitMQModule],
        controllers: [resumes_controller_1.ResumesController],
        providers: [
            resumes_service_1.ResumesService,
            upload_resume_use_case_1.UploadResumeUseCase,
            retry_stuck_resumes_use_case_1.RetryStuckResumesUseCase,
            resume_guard_service_1.ResumeGuardService,
            skill_normalizer_service_1.SkillNormalizerService,
            resume_hydration_service_1.ResumeHydrationService,
            skill_resolver_service_1.SkillResolverService,
            experience_writer_1.ExperienceWriter,
            education_writer_1.EducationWriter,
            project_writer_1.ProjectWriter,
            certificate_writer_1.CertificateWriter,
            skill_writer_1.SkillWriter,
            profile_writer_1.ProfileWriter,
            resume_result_listener_1.ResumeResultListener,
            ai_service_wakeup_service_1.AiServiceWakeupService,
        ],
        exports: [resumes_service_1.ResumesService],
    })
], ResumesModule);
//# sourceMappingURL=resumes.module.js.map