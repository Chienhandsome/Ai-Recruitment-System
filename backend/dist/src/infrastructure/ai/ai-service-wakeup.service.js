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
var AiServiceWakeupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiServiceWakeupService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const DEFAULT_WAKE_TIMEOUT_MS = 65_000;
let AiServiceWakeupService = AiServiceWakeupService_1 = class AiServiceWakeupService {
    configService;
    logger = new common_1.Logger(AiServiceWakeupService_1.name);
    wakeupInFlight = null;
    constructor(configService) {
        this.configService = configService;
    }
    wake() {
        const aiServiceUrl = this.configService
            .get('AI_SERVICE_URL')
            ?.trim()
            .replace(/\/+$/, '');
        if (!aiServiceUrl) {
            this.logger.warn('AI_SERVICE_URL is not configured; cannot wake AI worker.');
            return Promise.resolve();
        }
        if (this.wakeupInFlight)
            return this.wakeupInFlight;
        this.wakeupInFlight = this.requestWakeup(aiServiceUrl).finally(() => {
            this.wakeupInFlight = null;
        });
        return this.wakeupInFlight;
    }
    async requestWakeup(aiServiceUrl) {
        const configuredTimeout = Number(this.configService.get('AI_SERVICE_WAKE_TIMEOUT_MS'));
        const timeoutMs = Number.isFinite(configuredTimeout) && configuredTimeout > 0
            ? configuredTimeout
            : DEFAULT_WAKE_TIMEOUT_MS;
        try {
            const response = await fetch(`${aiServiceUrl}/health`, {
                signal: AbortSignal.timeout(timeoutMs),
            });
            if (!response.ok) {
                this.logger.warn(`AI service wake-up returned HTTP ${response.status}.`);
                return;
            }
            this.logger.log('AI service is awake and ready to consume queued work.');
        }
        catch (error) {
            this.logger.warn(`AI service wake-up failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};
exports.AiServiceWakeupService = AiServiceWakeupService;
exports.AiServiceWakeupService = AiServiceWakeupService = AiServiceWakeupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiServiceWakeupService);
//# sourceMappingURL=ai-service-wakeup.service.js.map