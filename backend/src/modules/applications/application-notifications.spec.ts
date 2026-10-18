/* eslint-disable @typescript-eslint/require-await -- Database doubles preserve asynchronous Prisma signatures. */
import { NotificationStatus, type Prisma } from '@prisma/client';
import { ApplicationsConsumer } from './applications.consumer';
import { ApplicationEvaluationService } from './application-evaluation.service';
import { NotificationsService } from '../notifications/notifications.service';

const now = new Date('2026-10-18T10:00:00Z');
const cutoff = new Date('2026-10-18T09:50:00Z');
const message = {
  applicationId: 'application-1',
  status: 'COMPLETED',
  result: { overall_score: 80 },
};

// Model commit/rollback and per-application serialization while exercising the
// real consumer, evaluation service, and notification writer together.
function setup(attempts = 1) {
  let state = {
    application: {
      id: 'application-1',
      evaluationAttempts: attempts,
      processingStatus: 'MATCHING',
      currentStage: 'RECEIVED',
      updatedAt: new Date('2026-10-18T09:00:00Z'),
    },
    notifications: new Map<string, Prisma.NotificationCreateManyInput>(),
    resultCount: 0,
    historyCount: 0,
  };
  let failingRecipient: string | undefined;
  let queue = Promise.resolve<unknown>(undefined);
  const prisma = {
    application: {
      findUnique: jest.fn(async () => ({ ...state.application })),
    },
    $transaction: jest.fn((callback: (client: unknown) => Promise<unknown>) => {
      const transaction = queue.then(async () => {
        const draft = structuredClone(state);
        const client = {
          application: {
            update: async ({ data }: Prisma.ApplicationUpdateArgs) => {
              Object.assign(draft.application, data);
              return {
                evaluationAttempts: draft.application.evaluationAttempts,
              };
            },
            updateMany: async ({
              where = {},
              data,
            }: Prisma.ApplicationUpdateManyArgs) => {
              const status = where.processingStatus;
              if (
                where.evaluationAttempts !== undefined &&
                where.evaluationAttempts !==
                  draft.application.evaluationAttempts
              )
                return { count: 0 };
              if (
                typeof status === 'string' &&
                status !== draft.application.processingStatus
              )
                return { count: 0 };
              if (
                typeof status === 'object' &&
                status.not === draft.application.processingStatus
              )
                return { count: 0 };
              if (
                where.currentStage &&
                where.currentStage !== draft.application.currentStage
              )
                return { count: 0 };
              if (
                typeof where.updatedAt === 'object' &&
                'lte' in where.updatedAt &&
                where.updatedAt.lte &&
                draft.application.updatedAt > new Date(where.updatedAt.lte)
              )
                return { count: 0 };
              Object.assign(draft.application, data);
              return { count: 1 };
            },
            findUnique: async () => ({
              ...draft.application,
              candidate: { userId: 'candidate-user', fullName: 'Nguyen Van A' },
              job: { title: 'Engineer', recruiter: { userId: 'hr-user' } },
            }),
          },
          aiMatchingResult: {
            deleteMany: async () => {
              draft.resultCount = 0;
            },
            create: async () => {
              draft.resultCount++;
            },
          },
          applicationStatusHistory: {
            create: async () => {
              draft.historyCount++;
            },
          },
          notification: {
            createMany: async ({
              data,
              skipDuplicates,
            }: Prisma.NotificationCreateManyArgs) => {
              let count = 0;
              for (const row of Array.isArray(data) ? data : [data]) {
                if (row.recipientUserId === failingRecipient) {
                  failingRecipient = undefined;
                  throw new Error('Temporary notification write failure');
                }
                if (!row.eventKey) throw new Error('Missing event key');
                if (draft.notifications.has(row.eventKey)) {
                  if (skipDuplicates) continue;
                  throw new Error('Duplicate event');
                }
                draft.notifications.set(row.eventKey, row);
                count++;
              }
              return { count };
            },
          },
        };
        const result = await callback(client);
        state = draft;
        return result;
      });
      queue = transaction.catch(() => undefined);
      return transaction;
    }),
  };
  const notifications = new NotificationsService(prisma as never);
  const evaluation = new ApplicationEvaluationService(
    prisma as never,
    { publish: jest.fn() } as never,
    notifications,
  );
  const consumer = new ApplicationsConsumer(
    prisma as never,
    { subscribe: jest.fn() } as never,
    evaluation,
    notifications,
  );
  return {
    consumer,
    evaluation,
    get state() {
      return state;
    },
    failNextNotificationFor: (recipient: string) => {
      failingRecipient = recipient;
    },
  };
}

describe('Atomic application notifications', () => {
  it('creates one recruiter notification on duplicate or concurrent completion deliveries', async () => {
    const h = setup();
    await Promise.all([
      h.consumer.handleMessage(message),
      h.consumer.handleMessage(message),
    ]);
    await h.consumer.handleMessage(message);

    expect(h.state.notifications.size).toBe(2);
    expect(
      h.state.notifications.has(
        'evaluation:application-1:1:completed:recruiter',
      ),
    ).toBe(true);
    expect(
      h.state.notifications.has(
        'evaluation:application-1:1:screening:candidate',
      ),
    ).toBe(true);
    expect(h.state.historyCount).toBe(1);
    expect(h.state.resultCount).toBe(1);
  });

  it('preserves READ status and readAt on redelivery', async () => {
    const h = setup();
    await h.consumer.handleMessage(message);
    const key = 'evaluation:application-1:1:completed:recruiter';
    Object.assign(h.state.notifications.get(key)!, {
      status: NotificationStatus.READ,
      readAt: now,
    });
    await h.consumer.handleMessage(message);
    expect(h.state.notifications.get(key)).toMatchObject({
      status: 'READ',
      readAt: now,
    });
    expect(h.state.notifications.size).toBe(2);
  });

  it('allows a new notification for a genuinely new evaluation attempt', async () => {
    const h = setup();
    await h.consumer.handleMessage(message);
    h.state.application.evaluationAttempts = 2;
    h.state.application.processingStatus = 'MATCHING';
    await h.consumer.handleMessage({
      ...message,
      result: { overall_score: 90 },
    });
    expect(h.state.notifications.size).toBe(3);
    expect(
      h.state.notifications.has(
        'evaluation:application-1:2:completed:recruiter',
      ),
    ).toBe(true);
    expect(h.state.historyCount).toBe(1);
  });

  it.each(['hr-user', 'candidate-user'])(
    'rolls back result, stage and all notifications if writing for %s fails',
    async (recipient) => {
      const h = setup();
      const markForRetry = jest.spyOn(h.evaluation, 'markForRetry');
      h.failNextNotificationFor(recipient);

      await expect(h.consumer.handleMessage(message)).rejects.toThrow(
        'Temporary notification write failure',
      );
      expect(h.state.application).toMatchObject({
        processingStatus: 'MATCHING',
        currentStage: 'RECEIVED',
      });
      expect(h.state.notifications.size).toBe(0);
      expect(h.state.historyCount).toBe(0);
      expect(h.state.resultCount).toBe(0);
      expect(markForRetry).not.toHaveBeenCalled();

      await h.consumer.handleMessage(message);
      expect(h.state.application).toMatchObject({
        processingStatus: 'COMPLETED',
        currentStage: 'SCREENING',
      });
      expect(h.state.notifications.size).toBe(2);
      expect(h.state.historyCount).toBe(1);
    },
  );

  it('creates only one exhausted alert for repeated failure messages', async () => {
    const h = setup(5);
    const failedMessage = {
      applicationId: 'application-1',
      status: 'FAILED',
      error: 'AI unavailable',
    };
    await Promise.all([
      h.consumer.handleMessage(failedMessage),
      h.consumer.handleMessage(failedMessage),
    ]);
    expect(h.state.application.processingStatus).toBe('FAILED');
    expect(h.state.notifications.size).toBe(1);
    expect(
      h.state.notifications.has(
        'evaluation:application-1:5:exhausted:recruiter',
      ),
    ).toBe(true);
  });

  it('retries a failed exhausted-alert write without committing FAILED prematurely', async () => {
    const h = setup(5);
    h.failNextNotificationFor('hr-user');
    const failedMessage = {
      applicationId: 'application-1',
      status: 'FAILED',
      error: 'AI unavailable',
    };
    await expect(h.consumer.handleMessage(failedMessage)).rejects.toThrow(
      'Temporary notification write failure',
    );
    expect(h.state.application.processingStatus).toBe('MATCHING');
    expect(h.state.notifications.size).toBe(0);
    await h.consumer.handleMessage(failedMessage);
    expect(h.state.application.processingStatus).toBe('FAILED');
    expect(h.state.notifications.size).toBe(1);
  });

  it('lets the scheduler retry the whole exhausted transition if its alert fails', async () => {
    const h = setup(5);
    h.failNextNotificationFor('hr-user');
    await expect(
      h.evaluation.failStuckEvaluation('application-1', 5, cutoff, now),
    ).rejects.toThrow('Temporary notification write failure');
    expect(h.state.application.processingStatus).toBe('MATCHING');
    await h.evaluation.failStuckEvaluation('application-1', 5, cutoff, now);
    await h.evaluation.failStuckEvaluation('application-1', 5, cutoff, now);
    expect(h.state.application.processingStatus).toBe('FAILED');
    expect(h.state.notifications.size).toBe(1);
  });

  it('does not mark a completed or newer attempt FAILED from a stale failure', async () => {
    const h = setup(6);
    await h.evaluation.markForRetry(
      'application-1',
      'Old attempt failed',
      5,
      now,
    );
    expect(h.state.application.processingStatus).toBe('MATCHING');
    await h.consumer.handleMessage(message);
    await h.evaluation.failStuckEvaluation('application-1', 6, cutoff, now);
    await h.evaluation.markForRetry('application-1', 'Late failure', 6, now);
    expect(h.state.application.processingStatus).toBe('COMPLETED');
    expect(
      [...h.state.notifications.values()].some(
        (row) => row.type === 'SYSTEM_ALERT',
      ),
    ).toBe(false);
  });
});
