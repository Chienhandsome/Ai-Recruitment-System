import { z } from 'zod';

// Older Interview Service callbacks serialized Python datetimes with a space
// between the date and time. Normalize that RFC3339-compatible legacy shape so
// already queued callbacks can be delivered after this fix is deployed.
const callbackDatetimeSchema = z.preprocess(
  (value) =>
    typeof value === 'string'
      ? value.replace(/^(\d{4}-\d{2}-\d{2})\s(?=\d{2}:)/, '$1T')
      : value,
  z.string().datetime({ offset: true }),
);

export const interviewServiceCreateResponseSchema = z.object({
  interview_id: z.string().uuid(),
  launch_url: z.string().url(),
  expires_at: z.string().datetime({ offset: true }),
  status: z.literal('CREATED'),
});

const questionSchema = z.object({
  number: z.number().int().positive(),
  text: z.string(),
  competency: z.string().optional().default('general'),
  source: z.string().optional().default('opening'),
});

const turnSchema = z.object({
  question: questionSchema,
  transcript: z.string(),
  answered_at: callbackDatetimeSchema,
});

const videoSchema = z.object({
  id: z.string(),
  question_number: z.number().int().positive(),
  content_type: z.string(),
  size_bytes: z.number().int().nonnegative(),
  created_at: callbackDatetimeSchema,
});

const securityEventSchema = z.object({
  type: z.string(),
  happened_at: callbackDatetimeSchema,
});

export const aiInterviewCallbackSchema = z.object({
  event_id: z.string().uuid(),
  event_type: z.enum([
    'interview.completed',
    'interview.terminated',
    'interview.expired',
  ]),
  occurred_at: callbackDatetimeSchema,
  data: z.object({
    interview_id: z.string().uuid(),
    recruitment_application_id: z.string().uuid(),
    status: z.enum(['COMPLETED', 'TERMINATED', 'EXPIRED']),
    started_at: callbackDatetimeSchema.nullable(),
    completed_at: callbackDatetimeSchema.nullable(),
    transcript: z.array(turnSchema),
    videos: z.array(videoSchema),
    security_events: z.array(securityEventSchema),
    termination_reason: z.string().nullable(),
  }),
});

export type AiInterviewCallback = z.infer<typeof aiInterviewCallbackSchema>;
