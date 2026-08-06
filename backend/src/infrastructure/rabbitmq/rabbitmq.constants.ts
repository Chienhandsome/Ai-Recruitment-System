export const RABBITMQ_EXCHANGE = 'ai_recruitment_events';
export const RABBITMQ_DEAD_LETTER_EXCHANGE = 'ai_recruitment_dlx';

export const RABBITMQ_ROUTING_KEYS = {
  RESUME_ANALYSIS_REQUESTED: 'resume.analysis.requested',
  RESUME_ANALYSIS_COMPLETED: 'resume.analysis.completed',
  RESUME_ANALYSIS_FAILED: 'resume.analysis.failed',
  RESUME_ANALYSIS_DEAD: 'resume.analysis.dead',

  EVALUATION_REQUESTED: 'evaluation.requested',
  EVALUATION_COMPLETED: 'evaluation.completed',
  EVALUATION_FAILED: 'evaluation.failed',
  EVALUATION_DEAD: 'evaluation.dead',
} as const;

export const RABBITMQ_QUEUES = {
  RESUME_ANALYSIS_QUEUE: 'resume_analysis_queue',
  RESUME_ANALYSIS_DEAD_QUEUE: 'resume_analysis_dead_queue',
  EVALUATION_QUEUE: 'evaluation_queue',
  EVALUATION_DEAD_QUEUE: 'evaluation_dead_queue',
} as const;
