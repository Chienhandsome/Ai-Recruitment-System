import { aiInterviewCallbackSchema } from './ai-interview.schemas';

const callbackPayload = {
  event_id: '041d6d2d-21bb-4136-8b3c-e8cd378b64d9',
  event_type: 'interview.completed',
  occurred_at: '2026-09-15T11:58:46.084229+00:00',
  data: {
    interview_id: 'bb10845d-b00d-4288-8773-3469bedf9f44',
    recruitment_application_id: 'a93781aa-2592-4f07-8b54-c03a33100d0c',
    status: 'COMPLETED',
    started_at: '2026-09-15 11:53:48.899264+00:00',
    completed_at: '2026-09-15 11:58:46.084229+00:00',
    transcript: [
      {
        question: {
          number: 1,
          text: 'Giới thiệu bản thân',
          competency: 'introduction',
          source: 'opening',
        },
        transcript: 'Câu trả lời',
        answered_at: '2026-09-15 11:54:22.984006+00:00',
      },
    ],
    videos: [
      {
        id: '209877f5-bb61-4fad-86c0-86af941ecdc2',
        question_number: 1,
        content_type: 'video/webm',
        size_bytes: 2731023,
        created_at: '2026-09-15 11:54:21.841307+00:00',
      },
    ],
    security_events: [],
    termination_reason: null,
  },
} as const;

describe('aiInterviewCallbackSchema', () => {
  it('normalizes legacy Python datetime strings from queued callbacks', () => {
    const parsed = aiInterviewCallbackSchema.parse(callbackPayload);

    expect(parsed.data.started_at).toBe('2026-09-15T11:53:48.899264+00:00');
    expect(parsed.data.completed_at).toBe('2026-09-15T11:58:46.084229+00:00');
    expect(parsed.data.transcript[0].answered_at).toContain('T');
    expect(parsed.data.videos[0].created_at).toContain('T');
  });

  it('still rejects malformed callback datetimes', () => {
    const parsed = aiInterviewCallbackSchema.safeParse({
      ...callbackPayload,
      data: { ...callbackPayload.data, completed_at: 'not-a-date' },
    });

    expect(parsed.success).toBe(false);
  });
});
