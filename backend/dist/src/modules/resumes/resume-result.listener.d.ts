import { OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../../infrastructure/rabbitmq/rabbitmq.service';
import { ResumeHydrationService } from './resume-hydration.service';
export declare class ResumeResultListener implements OnModuleInit {
    private readonly rabbitMQService;
    private readonly hydrationService;
    private readonly logger;
    constructor(rabbitMQService: RabbitMQService, hydrationService: ResumeHydrationService);
    onModuleInit(): Promise<void>;
    private startListening;
    private handleMessage;
    private handleCompleted;
    private handleFailed;
}
