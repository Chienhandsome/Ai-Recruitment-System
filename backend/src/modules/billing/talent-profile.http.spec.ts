import { INestApplication, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import type { App } from 'supertest/types';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { TalentPoolService } from './talent-pool.service';
import { TalentResumeService } from './talent-resume.service';
import { EntitlementsService } from './entitlements.service';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseStorageService } from '../../infrastructure/supabase/supabase-storage.service';
import { SupabaseAuthService } from '../auth/supabase-auth.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard, clearAllUserRoleCache } from '../auth/guards/roles.guard';

const candidateId = '22222222-2222-4222-8222-222222222222';
const hrId = '11111111-1111-4111-8111-111111111111';
describe('Talent profile and CV HTTP integration (in-memory DB/storage)', () => {
  let app: INestApplication<App>;
  let visible: boolean;
  let unlocked: boolean;
  let paid: boolean;
  const resume = {
    id: 'resume-1',
    candidateId,
    originalFileName: 'test.pdf',
    objectPath: 'candidates/test/cv.pdf',
    storageBucket: 'resumes',
    fileSizeBytes: 512,
    mimeType: 'application/pdf',
    parsingStatus: 'PARSED',
    updatedAt: new Date(),
  };
  const storage = {
    createSignedDownloadUrl: jest.fn().mockResolvedValue({
      signedUrl: 'https://storage.example/test.pdf',
      expiresIn: 60,
    }),
  };
  beforeAll(async () => {
    const prisma = {
      user: {
        findUnique: jest
          .fn()
          .mockImplementation(({ where }: { where: { id: string } }) =>
            Promise.resolve({
              status: 'ACTIVE',
              userRoles: [
                {
                  role: { code: where.id === hrId ? 'RECRUITER' : 'CANDIDATE' },
                },
              ],
            }),
          ),
      },
      candidateProfile: {
        findFirst: jest.fn().mockImplementation(() =>
          Promise.resolve(
            visible
              ? {
                  id: candidateId,
                  fullName: 'Test Candidate',
                  email: 'test@example.invalid',
                  phone: null,
                  address: null,
                  linkedinUrl: null,
                  githubUrl: null,
                  portfolioUrl: null,
                  professionalSummary: 'Backend Developer',
                  desiredTitle: 'Engineer',
                  projects: [],
                  certificates: [],
                  primaryResume: resume,
                }
              : null,
          ),
        ),
      },
      cvUnlock: {
        findUnique: jest
          .fn()
          .mockImplementation(() =>
            Promise.resolve(unlocked ? { id: 'unlock-1' } : null),
          ),
        create: jest.fn().mockImplementation(() => {
          unlocked = true;
          return Promise.resolve({ id: 'unlock-1' });
        }),
      },
      packageEntitlement: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const module = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        TalentPoolService,
        TalentResumeService,
        { provide: BillingService, useValue: {} },
        {
          provide: PrismaService,
          useValue: {
            ...prisma,
            $transaction: (callback: (tx: typeof prisma) => Promise<unknown>) =>
              callback(prisma),
          },
        },
        {
          provide: EntitlementsService,
          useValue: {
            assertTalentPool: () => {
              if (!paid) throw new ForbiddenException();
              return Promise.resolve({
                entitlementId: 'ent-1',
                cvUnlockRemaining: 2,
              });
            },
          },
        },
        { provide: SupabaseStorageService, useValue: storage },
        {
          provide: SupabaseAuthService,
          useValue: {
            verifyAccessToken: (token: string) =>
              Promise.resolve({
                id: token === 'hr' ? hrId : candidateId,
                email: 'test@example.invalid',
                fullName: 'Test',
              }),
          },
        },
        SupabaseAuthGuard,
        RolesGuard,
      ],
    }).compile();
    app = module.createNestApplication({ logger: false });
    app.useGlobalGuards(
      new SupabaseAuthGuard(
        module.get(Reflector),
        module.get(SupabaseAuthService),
      ),
      new RolesGuard(module.get(Reflector), module.get(PrismaService)),
    );
    await app.init();
  });
  beforeEach(() => {
    visible = true;
    unlocked = false;
    paid = true;
    clearAllUserRoleCache();
    storage.createSignedDownloadUrl.mockClear();
  });
  afterAll(async () => {
    clearAllUserRoleCache();
    await app.close();
  });
  const path = `/billing/talent-pool/${candidateId}`;

  it('runs locked profile → unlock → original CV preview/download without further credit consumption', async () => {
    await request(app.getHttpServer())
      .get(path)
      .auth('hr', { type: 'bearer' })
      .expect(200)
      .expect('Cache-Control', 'private, no-store')
      .expect(({ body }: { body: { resume: unknown; contact: unknown } }) => {
        expect(body.resume).toBeNull();
        expect(body.contact).toBeNull();
      });
    await request(app.getHttpServer())
      .post(`${path}/resume-access`)
      .auth('hr', { type: 'bearer' })
      .expect(403);
    await request(app.getHttpServer())
      .post(`${path}/unlock`)
      .auth('hr', { type: 'bearer' })
      .expect(201)
      .expect(
        ({
          body,
        }: {
          body: { contactUnlocked: boolean; resume: { id: string } };
        }) => {
          expect(body.contactUnlocked).toBe(true);
          expect(body.resume.id).toBe('resume-1');
        },
      );
    await request(app.getHttpServer())
      .post(`${path}/resume-access?mode=preview`)
      .auth('hr', { type: 'bearer' })
      .expect(201)
      .expect('Cache-Control', 'private, no-store');
    await request(app.getHttpServer())
      .post(`${path}/resume-access?mode=download`)
      .auth('hr', { type: 'bearer' })
      .expect(201);
    expect(storage.createSignedDownloadUrl).toHaveBeenLastCalledWith(
      resume.objectPath,
      60,
      { bucket: 'resumes', download: 'test.pdf' },
    );
  });
  it('blocks anonymous and candidate requests through the actual auth/role guards', async () => {
    await request(app.getHttpServer())
      .post(`${path}/resume-access`)
      .expect(401);
    await request(app.getHttpServer())
      .post(`${path}/resume-access`)
      .auth('candidate', { type: 'bearer' })
      .expect(403);
    expect(storage.createSignedDownloadUrl).not.toHaveBeenCalled();
  });
  it('rejects hidden profiles and expired packages even after an unlock', async () => {
    unlocked = true;
    visible = false;
    await request(app.getHttpServer())
      .get(path)
      .auth('hr', { type: 'bearer' })
      .expect(404);
    await request(app.getHttpServer())
      .post(`${path}/resume-access`)
      .auth('hr', { type: 'bearer' })
      .expect(404);
    visible = true;
    paid = false;
    await request(app.getHttpServer())
      .post(`${path}/resume-access`)
      .auth('hr', { type: 'bearer' })
      .expect(403);
    expect(storage.createSignedDownloadUrl).not.toHaveBeenCalled();
  });
  it('validates UUID and mode without issuing links', async () => {
    await request(app.getHttpServer())
      .post('/billing/talent-pool/not-a-uuid/resume-access')
      .auth('hr', { type: 'bearer' })
      .expect(400);
    await request(app.getHttpServer())
      .post(`${path}/resume-access?mode=other`)
      .auth('hr', { type: 'bearer' })
      .expect(400);
    expect(storage.createSignedDownloadUrl).not.toHaveBeenCalled();
  });
});
