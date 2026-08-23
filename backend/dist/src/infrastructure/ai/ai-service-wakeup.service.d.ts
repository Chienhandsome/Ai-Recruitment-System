import { ConfigService } from '@nestjs/config';
export declare class AiServiceWakeupService {
    private readonly configService;
    private readonly logger;
    private wakeupInFlight;
    constructor(configService: ConfigService);
    wake(): Promise<void>;
    private requestWakeup;
}
