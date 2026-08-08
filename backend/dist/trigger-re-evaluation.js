"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const applications_service_1 = require("./src/modules/applications/applications.service");
const prisma_service_1 = require("./src/database/prisma.service");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const prisma = app.get(prisma_service_1.PrismaService);
    const applicationsService = app.get(applications_service_1.ApplicationsService);
    const applications = await prisma.application.findMany({
        where: {
            processingStatus: { in: ['COMPLETED', 'FAILED'] }
        },
        include: {
            candidate: {
                include: {
                    primaryResume: true,
                    workExperiences: true,
                    educations: true,
                    projects: true,
                    certificates: true,
                    candidateSkills: {
                        include: { skill: true },
                    },
                }
            },
            job: {
                include: {
                    jobSkills: { include: { skill: true } },
                    jobCertificates: true,
                }
            }
        }
    });
    console.log(`Found ${applications.length} applications to re-evaluate...`);
    for (const application of applications) {
        try {
            console.log(`Re-evaluating application ${application.id}...`);
            await prisma.application.update({
                where: { id: application.id },
                data: { processingStatus: 'MATCHING' },
            });
            const evaluationRequest = applicationsService.buildEvaluationRequest(application.id, application.candidate, application.job);
            const rabbitMQService = applicationsService.rabbitMQService;
            const payload = {
                applicationId: application.id,
                ...evaluationRequest,
            };
            await rabbitMQService.publish('evaluation.requested', payload);
            console.log(`Successfully queued AI Evaluation for application ${application.id}`);
        }
        catch (err) {
            console.error(`Failed to re-evaluate application ${application.id}`, err);
        }
    }
    await app.close();
    console.log('Re-evaluation trigger completed.');
}
bootstrap();
//# sourceMappingURL=trigger-re-evaluation.js.map