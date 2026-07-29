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
const resume_hydration_service_1 = require("./resume-hydration.service");
const resume_result_listener_1 = require("./resume-result.listener");
const prisma_module_1 = require("../../database/prisma.module");
const auth_module_1 = require("../auth/auth.module");
const supabase_module_1 = require("../../infrastructure/supabase/supabase.module");
const rabbitmq_module_1 = require("../../infrastructure/rabbitmq/rabbitmq.module");
let ResumesModule = class ResumesModule {
};
exports.ResumesModule = ResumesModule;
exports.ResumesModule = ResumesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule, supabase_module_1.SupabaseModule, rabbitmq_module_1.RabbitMQModule],
        controllers: [resumes_controller_1.ResumesController],
        providers: [resumes_service_1.ResumesService, resume_hydration_service_1.ResumeHydrationService, resume_result_listener_1.ResumeResultListener],
        exports: [resumes_service_1.ResumesService],
    })
], ResumesModule);
//# sourceMappingURL=resumes.module.js.map