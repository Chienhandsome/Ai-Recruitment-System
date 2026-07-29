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
const rabbitmq_service_1 = require("../../infrastructure/rabbitmq/rabbitmq.service");
const rabbitmq_constants_1 = require("../../infrastructure/rabbitmq/rabbitmq.constants");
const resume_hydration_service_1 = require("./resume-hydration.service");
let ResumeResultListener = ResumeResultListener_1 = class ResumeResultListener {
    rabbitMQService;
    hydrationService;
    logger = new common_1.Logger(ResumeResultListener_1.name);
    constructor(rabbitMQService, hydrationService) {
        this.rabbitMQService = rabbitMQService;
        this.hydrationService = hydrationService;
    }
    async onModuleInit() {
        await this.startListening();
    }
    async startListening() {
        const queueName = `${rabbitmq_constants_1.RABBITMQ_QUEUES.RESUME_ANALYSIS_QUEUE}_results`;
        this.logger.log('Subscribing to resume analysis result messages...');
        await this.rabbitMQService.subscribe(queueName, [
            rabbitmq_constants_1.RABBITMQ_ROUTING_KEYS.RESUME_ANALYSIS_COMPLETED,
            rabbitmq_constants_1.RABBITMQ_ROUTING_KEYS.RESUME_ANALYSIS_FAILED,
        ], async (message) => {
            await this.handleMessage(message);
        });
    }
    async handleMessage(message) {
        const msg = message;
        if (!msg || typeof msg !== 'object') {
            this.logger.warn('Received invalid message (not an object)');
            return;
        }
        if ('parsedData' in msg && msg.parsedData) {
            await this.handleCompleted(msg);
        }
        else if ('errorMessage' in msg) {
            await this.handleFailed(msg);
        }
        else {
            this.logger.warn(`Unknown message format: ${JSON.stringify(msg).substring(0, 200)}`);
        }
    }
    async handleCompleted(msg) {
        this.logger.log(`Resume analysis completed: resumeId=${msg.resumeId}, candidate=${msg.candidateProfileId}`);
        try {
            await this.hydrationService.hydrateProfile(msg.resumeId, msg.candidateProfileId, msg.parsedData);
            this.logger.log(`Profile hydration successful for resume ${msg.resumeId}`);
        }
        catch (error) {
            this.logger.error(`Profile hydration failed for resume ${msg.resumeId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleFailed(msg) {
        this.logger.warn(`Resume analysis failed: resumeId=${msg.resumeId}, error=${msg.errorMessage}`);
        try {
            await this.hydrationService.handleFailure(msg.resumeId, msg.candidateProfileId, msg.errorMessage);
        }
        catch (error) {
            this.logger.error(`Failed to handle failure for resume ${msg.resumeId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};
exports.ResumeResultListener = ResumeResultListener;
exports.ResumeResultListener = ResumeResultListener = ResumeResultListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rabbitmq_service_1.RabbitMQService,
        resume_hydration_service_1.ResumeHydrationService])
], ResumeResultListener);
//# sourceMappingURL=resume-result.listener.js.map