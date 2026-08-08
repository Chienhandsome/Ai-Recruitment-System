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
var ResumeResultListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeResultListener = void 0;
const common_1 = require("@nestjs/common");
const rabbitmq_service_1 = require("../../../infrastructure/rabbitmq/rabbitmq.service");
const rabbitmq_constants_1 = require("../../../infrastructure/rabbitmq/rabbitmq.constants");
const resume_hydration_service_1 = require("../hydration/resume-hydration.service");
let ResumeResultListener = ResumeResultListener_1 = class ResumeResultListener {
    rabbitMQService;
    hydrationService;
    logger = new common_1.Logger(ResumeResultListener_1.name);
    constructor(rabbitMQService, hydrationService) {
        this.rabbitMQService = rabbitMQService;
        this.hydrationService = hydrationService;
    }
    async onModuleInit() {
        const queueName = `${rabbitmq_constants_1.RABBITMQ_QUEUES.RESUME_ANALYSIS_QUEUE}_results`;
        await this.rabbitMQService.subscribe(queueName, [
            rabbitmq_constants_1.RABBITMQ_ROUTING_KEYS.RESUME_ANALYSIS_COMPLETED,
            rabbitmq_constants_1.RABBITMQ_ROUTING_KEYS.RESUME_ANALYSIS_FAILED,
        ], (message) => this.handleMessage(message));
    }
    async handleMessage(message) {
        if (!message || typeof message !== 'object') {
            throw new Error('Invalid resume analysis result: expected an object');
        }
        const payload = message;
        if (payload.parsedData) {
            await this.handleCompleted(payload);
            return;
        }
        if (typeof payload.errorMessage === 'string') {
            await this.handleFailed(payload);
            return;
        }
        throw new Error('Unknown resume analysis result message shape');
    }
    async handleCompleted(message) {
        this.logger.log(`Hydrating completed resume ${message.resumeId}`);
        await this.hydrationService.hydrateProfile(message.resumeId, message.candidateProfileId, message.parsedData);
    }
    async handleFailed(message) {
        this.logger.warn(`Handling failed resume ${message.resumeId}: ${message.errorMessage}`);
        await this.hydrationService.handleFailure(message.resumeId, message.candidateProfileId, message.errorMessage, message.errorCode);
    }
};
exports.ResumeResultListener = ResumeResultListener;
exports.ResumeResultListener = ResumeResultListener = ResumeResultListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rabbitmq_service_1.RabbitMQService,
        resume_hydration_service_1.ResumeHydrationService])
], ResumeResultListener);
//# sourceMappingURL=resume-result.listener.js.map