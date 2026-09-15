import { UnauthorizedException } from '@nestjs/common';
import {
  AiInterviewStatus,
  ApplicationStage,
  InterviewRoundStatus,
} from '@prisma/client';
import { createHmac } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { ApplicationAccessService } from '../applications/application-access.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AiInterviewsService } from './ai-interviews.service';

const APPLICATION_ID = '11111111-1111-4111-8111-111111111111';
const SESSION_ID = '22222222-2222-4222-8222-222222222222';
const REMOTE_ID = '33333333-3333-4333-8333-333333333333';
const EVENT_ID = '44444444-4444-4444-8444-444444444444';

describe('AiInterviewsService', () => {
  let prisma: any;
  let notifications: any;
  let service: AiInterviewsService;

  beforeEach(() => {
    prisma = {
      application: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      applicationStatusHistory: { create: jest.fn() },
      aiInterviewSession: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      aiInterviewCallbackEvent: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      interviewRound: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (callback) => callback(prisma)),
    };
    notifications = { createNotification: jest.fn().mockResolvedValue({}) };
    service = new AiInterviewsService(
      prisma as PrismaService,
      {
        recruiterApplicationWhere: jest.fn().mockResolvedValue({}),
      } as unknown as ApplicationAccessService,
      notifications as NotificationsService,
    );
    process.env.INTERVIEW_CALLBACK_SECRET = 'callback-test-secret';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.INTERVIEW_CALLBACK_SECRET;
  });

  it('collects CV/JD, creates a remote interview and notifies the candidate', async () => {
    prisma.application.findFirst.mockResolvedValue({
      id: APPLICATION_ID,
      profileSnapshot: { source: 'application' },
      currentStage: ApplicationStage.SHORTLISTED,
      candidate: {
        id: '55555555-5555-4555-8555-555555555555',
        userId: '66666666-6666-4666-8666-666666666666',
        fullName: 'Nguyễn Văn A',
        email: 'candidate@example.com',
        desiredTitle: 'Backend Engineer',
        professionalSummary: 'Java developer',
        candidateSkills: [],
        workExperiences: [],
        educations: [],
        projects: [],
        certificates: [],
      },
      resume: { id: 'resume-1', parsedData: { summary: 'Java developer' } },
      job: {
        id: '77777777-7777-4777-8777-777777777777',
        jobCode: 'BE-01',
        title: 'Backend Engineer',
        description: 'Build APIs',
        requirements: 'Java, SQL',
        employmentType: 'FULL_TIME',
        experienceLevel: 'JUNIOR',
        requiredExperienceYears: 1,
        location: 'HCM',
        recruiter: { userId: '88888888-8888-4888-8888-888888888888' },
        jobSkills: [],
      },
    });
    const remoteResponse = {
      interview_id: REMOTE_ID,
      launch_url: 'http://127.0.0.1:4174/?launch=one-time-token',
      expires_at: '2026-09-16T10:00:00+00:00',
      status: 'CREATED',
    };
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(remoteResponse), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    prisma.aiInterviewSession.create.mockResolvedValue({
      id: SESSION_ID,
      applicationId: APPLICATION_ID,
      interviewServiceId: REMOTE_ID,
      status: AiInterviewStatus.CREATED,
      launchUrl: remoteResponse.launch_url,
      expiresAt: new Date(remoteResponse.expires_at),
    });

    const result = await service.create('99999999-9999-4999-8999-999999999999', {
      applicationId: APPLICATION_ID,
      openingQuestions: ['Giới thiệu bản thân'],
      competencies: ['technical_experience'],
      maxQuestions: 6,
      expiresInHours: 72,
    });

    expect(result.interviewServiceId).toBe(REMOTE_ID);
    const request = (global.fetch as jest.Mock).mock.calls[0];
    const sent = JSON.parse(request[1].body as string);
    expect(sent.recruitment_application_id).toBe(APPLICATION_ID);
    expect(sent.cv.candidate_profile.professional_summary).toBe('Java developer');
    expect(sent.jd.title).toBe('Backend Engineer');
    expect(sent.callback_url).toContain('/interviews/ai/callback');
    expect(notifications.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: '66666666-6666-4666-8666-666666666666',
        applicationId: APPLICATION_ID,
      }),
    );
  });

  it('verifies HMAC, stores the callback once and advances the application', async () => {
    const payload = {
      event_id: EVENT_ID,
      event_type: 'interview.completed',
      occurred_at: '2026-09-13T10:00:00+00:00',
      data: {
        interview_id: REMOTE_ID,
        recruitment_application_id: APPLICATION_ID,
        status: 'COMPLETED',
        started_at: '2026-09-13T09:55:00+00:00',
        completed_at: '2026-09-13T10:00:00+00:00',
        transcript: [],
        videos: [],
        security_events: [],
        termination_reason: null,
      },
    };
    const rawBody = Buffer.from(JSON.stringify(payload));
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createHmac('sha256', 'callback-test-secret')
      .update(timestamp)
      .update('.')
      .update(rawBody)
      .digest('hex');
    prisma.aiInterviewCallbackEvent.findUnique.mockResolvedValue(null);
    prisma.aiInterviewSession.findUnique.mockResolvedValue({
      id: SESSION_ID,
      applicationId: APPLICATION_ID,
      application: {
        id: APPLICATION_ID,
        currentStage: ApplicationStage.INTERVIEW_SCHEDULED,
        job: {
          title: 'Backend Engineer',
          recruiter: { userId: '88888888-8888-4888-8888-888888888888' },
        },
      },
    });

    const result = await service.receiveCallback(
      rawBody,
      { eventId: EVENT_ID, timestamp, signature: `v1=${signature}` },
      payload,
    );

    expect(result).toEqual({ accepted: true, duplicate: false });
    expect(prisma.aiInterviewCallbackEvent.create).toHaveBeenCalled();
    expect(prisma.aiInterviewSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: AiInterviewStatus.COMPLETED }),
      }),
    );
    expect(prisma.application.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: APPLICATION_ID } }),
    );
    expect(notifications.createNotification).toHaveBeenCalled();
  });

  it('rejects callbacks with an invalid signature', async () => {
    await expect(
      service.receiveCallback(
        Buffer.from('{}'),
        {
          eventId: EVENT_ID,
          timestamp: String(Math.floor(Date.now() / 1000)),
          signature: `v1=${'0'.repeat(64)}`,
        },
        {},
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('moves a managed AI round to review without completing the application', async () => {
    const payload = {
      event_id: EVENT_ID,
      event_type: 'interview.completed',
      occurred_at: '2026-09-13T10:00:00+00:00',
      data: {
        interview_id: REMOTE_ID,
        recruitment_application_id: APPLICATION_ID,
        status: 'COMPLETED',
        started_at: '2026-09-13T09:55:00+00:00',
        completed_at: '2026-09-13T10:00:00+00:00',
        transcript: [],
        videos: [],
        security_events: [],
        termination_reason: null,
      },
    };
    const rawBody = Buffer.from(JSON.stringify(payload));
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createHmac('sha256', 'callback-test-secret')
      .update(timestamp)
      .update('.')
      .update(rawBody)
      .digest('hex');
    prisma.aiInterviewCallbackEvent.findUnique.mockResolvedValue(null);
    prisma.aiInterviewSession.findUnique.mockResolvedValue({
      id: SESSION_ID,
      applicationId: APPLICATION_ID,
      roundId: 'round-1',
      round: { id: 'round-1' },
      application: {
        id: APPLICATION_ID,
        currentStage: ApplicationStage.INTERVIEW_SCHEDULED,
        job: {
          title: 'Backend Engineer',
          recruiter: { userId: '88888888-8888-4888-8888-888888888888' },
        },
      },
    });

    await service.receiveCallback(
      rawBody,
      { eventId: EVENT_ID, timestamp, signature: `v1=${signature}` },
      payload,
    );

    expect(prisma.interviewRound.update).toHaveBeenCalledWith({
      where: { id: 'round-1' },
      data: { status: InterviewRoundStatus.AWAITING_REVIEW },
    });
    expect(prisma.application.update).not.toHaveBeenCalled();
  });
});
