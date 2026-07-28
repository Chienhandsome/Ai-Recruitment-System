"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./database/prisma.module");
const supabase_module_1 = require("./infrastructure/supabase/supabase.module");
const rabbitmq_module_1 = require("./infrastructure/rabbitmq/rabbitmq.module");
const companies_module_1 = require("./modules/companies/companies.module");
const departments_module_1 = require("./modules/departments/departments.module");
const users_module_1 = require("./modules/users/users.module");
const roles_module_1 = require("./modules/roles/roles.module");
const jobs_module_1 = require("./modules/jobs/jobs.module");
const skills_module_1 = require("./modules/skills/skills.module");
const candidates_module_1 = require("./modules/candidates/candidates.module");
const resumes_module_1 = require("./modules/resumes/resumes.module");
const applications_module_1 = require("./modules/applications/applications.module");
const screenings_module_1 = require("./modules/screenings/screenings.module");
const interviews_module_1 = require("./modules/interviews/interviews.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const auth_module_1 = require("./modules/auth/auth.module");
const recruiters_module_1 = require("./modules/recruiters/recruiters.module");
const admin_module_1 = require("./modules/admin/admin.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            prisma_module_1.PrismaModule,
            supabase_module_1.SupabaseModule,
            rabbitmq_module_1.RabbitMQModule,
            companies_module_1.CompaniesModule,
            departments_module_1.DepartmentsModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            jobs_module_1.JobsModule,
            skills_module_1.SkillsModule,
            candidates_module_1.CandidatesModule,
            resumes_module_1.ResumesModule,
            applications_module_1.ApplicationsModule,
            screenings_module_1.ScreeningsModule,
            interviews_module_1.InterviewsModule,
            notifications_module_1.NotificationsModule,
            auth_module_1.AuthModule,
            recruiters_module_1.RecruitersModule,
            admin_module_1.AdminModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map