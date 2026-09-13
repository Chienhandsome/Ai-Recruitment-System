import { z } from 'zod';

export const interviewServiceCreateResponseSchema = z.object({
  interview_id: z.string().uuid(),
  launch_url: z.string().url(),
  expires_at: z.string().datetime({ offset: true }),
  status: z.literal('CREATED'),
});

const questionSchema = z.object({
  number: z.number().int().positive(),
  text: z.string(),
  competency: z.string(),
  source: z.enum(['opening', 'llm', 'fallback']),
});

const turnSchema = z.object({
  question: questionSchema,
  transcript: z.string(),
  answered_at: z.string().datetime({ offset: true }),
});

const videoSchema = z.object({
  id: z.string().uuid(),
  question_number: z.number().int().positive(),
  content_type: z.enum(['video/webm', 'video/mp4']),
  size_bytes: z.number().int().nonnegative(),
  created_at: z.string().datetime({ offset: true }),
});

const securityEventSchema = z.object({
  type: z.string(),
  happened_at: z.string().datetime({ offset: true }),
});

export const aiInterviewCallbackSchema = z.object({
  event_id: z.string().uuid(),
  event_type: z.enum([
    'interview.completed',
    'interview.terminated',
    'interview.expired',
  ]),
  occurred_at: z.string().datetime({ offset: true }),
  data: z.object({
    interview_id: z.string().uuid(),
    recruitment_application_id: z.string().uuid(),
    status: z.enum(['COMPLETED', 'TERMINATED', 'EXPIRED']),
    started_at: z.string().datetime({ offset: true }).nullable(),
    completed_at: z.string().datetime({ offset: true }).nullable(),
    transcript: z.array(turnSchema),
    videos: z.array(videoSchema),
    security_events: z.array(securityEventSchema),
    termination_reason: z.string().nullable(),
  }),
});

export type AiInterviewCallback = z.infer<typeof aiInterviewCallbackSchema>;
