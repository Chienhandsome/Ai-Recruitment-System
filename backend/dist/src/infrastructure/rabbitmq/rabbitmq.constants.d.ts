export declare const RABBITMQ_EXCHANGE = "ai_recruitment_events";
export declare const RABBITMQ_DEAD_LETTER_EXCHANGE = "ai_recruitment_dlx";
export declare const RABBITMQ_ROUTING_KEYS: {
    readonly RESUME_ANALYSIS_REQUESTED: "resume.analysis.requested";
    readonly RESUME_ANALYSIS_COMPLETED: "resume.analysis.completed";
    readonly RESUME_ANALYSIS_FAILED: "resume.analysis.failed";
    readonly RESUME_ANALYSIS_DEAD: "resume.analysis.dead";
    readonly EVALUATION_REQUESTED: "evaluation.requested";
    readonly EVALUATION_COMPLETED: "evaluation.completed";
    readonly EVALUATION_FAILED: "evaluation.failed";
    readonly EVALUATION_DEAD: "evaluation.dead";
};
export declare const RABBITMQ_QUEUES: {
    readonly RESUME_ANALYSIS_QUEUE: "resume_analysis_queue";
    readonly RESUME_ANALYSIS_DEAD_QUEUE: "resume_analysis_dead_queue";
    readonly EVALUATION_QUEUE: "evaluation_queue";
    readonly EVALUATION_DEAD_QUEUE: "evaluation_dead_queue";
};
