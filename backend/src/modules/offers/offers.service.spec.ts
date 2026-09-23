import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ApplicationStage, OfferStatus, Prisma } from '@prisma/client';
import { OffersService } from './offers.service';
import { PrismaService } from '../../database/prisma.service';
import { ApplicationAccessService } from '../applications/application-access.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('OffersService', () => {
  let service: OffersService;
  let prisma: any;
  let accessService: any;
  let notificationsService: any;

  beforeEach(async () => {
    prisma = {
      application: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      offer: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      candidateProfile: {
        findUnique: jest.fn(),
      },
      interviewProcess: {
        updateMany: jest.fn(),
      },
      interviewRound: {
        updateMany: jest.fn(),
      },
      applicationStatusHistory: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    accessService = {
      recruiterApplicationWhere: jest.fn().mockResolvedValue({}),
    };

    notificationsService = {
      createNotification: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OffersService,
        { provide: PrismaService, useValue: prisma },
        { provide: ApplicationAccessService, useValue: accessService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<OffersService>(OffersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOffer', () => {
    it('creates an offer and advances application stage to OFFERED', async () => {
      const mockApp = {
        id: 'app-1',
        currentStage: ApplicationStage.INTERVIEWED,
        job: { id: 'job-1', title: 'Senior Backend Engineer', recruiterId: 'rec-1' },
        candidate: {
          id: 'cand-1',
          userId: 'user-cand-1',
          user: { fullName: 'Tran Thi B', email: 'b@example.com' },
        },
      };

      prisma.application.findFirst.mockResolvedValue(mockApp);
      prisma.offer.upsert.mockResolvedValue({
        id: 'offer-1',
        applicationId: 'app-1',
        status: OfferStatus.PENDING,
        salary: new Prisma.Decimal(30000000),
      });

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const result = await service.createOffer('recruiter-user-1', {
        applicationId: 'app-1',
        salary: 30000000,
        startDate: nextMonth.toISOString(),
        expiresAt: nextWeek.toISOString(),
        notes: 'Chào mừng bạn gia nhập đội ngũ engineering!',
      });

      expect(result.id).toBe('offer-1');
      expect(prisma.application.update).toHaveBeenCalledWith({
        where: { id: 'app-1' },
        data: {
          currentStage: ApplicationStage.OFFERED,
          hrDecision: 'ACCEPTED',
        },
      });
      expect(notificationsService.createNotification).toHaveBeenCalled();
    });

    it('throws BadRequestException if expiresAt is in the past', async () => {
      prisma.application.findFirst.mockResolvedValue({
        id: 'app-1',
        currentStage: ApplicationStage.INTERVIEWED,
      });

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await expect(
        service.createOffer('recruiter-user-1', {
          applicationId: 'app-1',
          salary: 30000000,
          startDate: new Date().toISOString(),
          expiresAt: pastDate.toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if expiresAt is greater than or equal to startDate', async () => {
      prisma.application.findFirst.mockResolvedValue({
        id: 'app-1',
        currentStage: ApplicationStage.INTERVIEWED,
      });

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 10);
      const invalidExpiresAt = new Date();
      invalidExpiresAt.setDate(invalidExpiresAt.getDate() + 15);

      await expect(
        service.createOffer('recruiter-user-1', {
          applicationId: 'app-1',
          salary: 30000000,
          startDate: startDate.toISOString(),
          expiresAt: invalidExpiresAt.toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if application stage cannot transition to OFFERED', async () => {
      prisma.application.findFirst.mockResolvedValue({
        id: 'app-1',
        currentStage: ApplicationStage.RECEIVED,
      });

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      await expect(
        service.createOffer('recruiter-user-1', {
          applicationId: 'app-1',
          salary: 30000000,
          startDate: nextMonth.toISOString(),
          expiresAt: nextWeek.toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getOfferByApplication', () => {
    it('automatically transitions stale pending offer to EXPIRED if deadline passed', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);

      const mockApp = {
        id: 'app-1',
        currentStage: ApplicationStage.OFFERED,
        candidate: { userId: 'cand-1', user: { fullName: 'Nguyen Van A' } },
        job: { title: 'Frontend Developer', recruiter: { userId: 'rec-1' } },
        offer: {
          id: 'offer-1',
          status: OfferStatus.PENDING,
          expiresAt: pastDate,
          salary: new Prisma.Decimal(25000000),
        },
      };

      prisma.candidateProfile.findUnique.mockResolvedValue({ id: 'cand-profile-1' });
      prisma.application.findFirst.mockResolvedValue(mockApp);
      prisma.offer.update.mockResolvedValue({
        ...mockApp.offer,
        status: OfferStatus.EXPIRED,
      });

      const result = await service.getOfferByApplication('cand-1', 'app-1');

      expect(prisma.offer.update).toHaveBeenCalledWith({
        where: { id: 'offer-1' },
        data: { status: OfferStatus.EXPIRED },
      });
      expect(result.offer.status).toBe(OfferStatus.EXPIRED);
    });
  });

  describe('acceptOffer', () => {
    it('accepts offer and transitions application to HIRED', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const mockOffer = {
        id: 'offer-1',
        applicationId: 'app-1',
        status: OfferStatus.PENDING,
        expiresAt: futureDate,
        application: {
          id: 'app-1',
          candidate: {
            userId: 'cand-user-1',
            user: { fullName: 'Tran Thi B' },
          },
          job: {
            title: 'Senior Backend Engineer',
            recruiter: { userId: 'rec-user-1' },
          },
        },
      };

      prisma.offer.findUnique.mockResolvedValue(mockOffer);
      prisma.offer.update.mockResolvedValue({
        ...mockOffer,
        status: OfferStatus.ACCEPTED,
      });

      const result = await service.acceptOffer('cand-user-1', 'offer-1');

      expect(result.status).toBe(OfferStatus.ACCEPTED);
      expect(prisma.application.update).toHaveBeenCalledWith({
        where: { id: 'app-1' },
        data: {
          currentStage: ApplicationStage.HIRED,
          hrDecision: 'ACCEPTED',
        },
      });
      expect(notificationsService.createNotification).toHaveBeenCalled();
    });

    it('rejects if candidate does not own the offer', async () => {
      prisma.offer.findUnique.mockResolvedValue({
        id: 'offer-1',
        application: {
          candidate: { userId: 'other-user' },
        },
      });

      await expect(service.acceptOffer('wrong-user', 'offer-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('declineOffer', () => {
    it('declines offer and transitions application to REJECTED', async () => {
      const mockOffer = {
        id: 'offer-1',
        applicationId: 'app-1',
        status: OfferStatus.PENDING,
        application: {
          id: 'app-1',
          candidate: {
            userId: 'cand-user-1',
            user: { fullName: 'Tran Thi B' },
          },
          job: {
            title: 'Senior Backend Engineer',
            recruiter: { userId: 'rec-user-1' },
          },
        },
      };

      prisma.offer.findUnique.mockResolvedValue(mockOffer);
      prisma.offer.update.mockResolvedValue({
        ...mockOffer,
        status: OfferStatus.DECLINED,
      });

      const result = await service.declineOffer('cand-user-1', 'offer-1', {
        reason: 'SALARY_NOT_MATCH',
        note: 'Em tìm được offer khác phù hợp hơn.',
      });

      expect(result.status).toBe(OfferStatus.DECLINED);
      expect(prisma.application.update).toHaveBeenCalledWith({
        where: { id: 'app-1' },
        data: {
          currentStage: ApplicationStage.REJECTED,
          hrDecision: 'REJECTED',
          hrNotes: 'Ứng viên từ chối Offer: SALARY_NOT_MATCH',
        },
      });
    });
  });

  describe('revokeOffer', () => {
    it('revokes pending offer and rolls back application to INTERVIEWED', async () => {
      const mockOffer = {
        id: 'offer-1',
        applicationId: 'app-1',
        status: OfferStatus.PENDING,
        application: {
          id: 'app-1',
          candidate: {
            userId: 'cand-user-1',
            user: { fullName: 'Tran Thi B' },
          },
          job: {
            title: 'Senior Backend Engineer',
          },
        },
      };

      prisma.offer.findUnique.mockResolvedValue(mockOffer);
      prisma.application.findFirst.mockResolvedValue({ id: 'app-1' });
      prisma.offer.update.mockResolvedValue({
        ...mockOffer,
        status: OfferStatus.CANCELLED,
      });

      const result = await service.revokeOffer('rec-user-1', 'offer-1', 'Ngân sách thay đổi');

      expect(result.status).toBe(OfferStatus.CANCELLED);
      expect(prisma.application.update).toHaveBeenCalledWith({
        where: { id: 'app-1' },
        data: {
          currentStage: ApplicationStage.INTERVIEWED,
          hrDecision: 'CONSIDER',
        },
      });
      expect(prisma.applicationStatusHistory.create).toHaveBeenCalled();
      expect(notificationsService.createNotification).toHaveBeenCalled();
    });

    it('throws BadRequestException if offer is not PENDING', async () => {
      const mockOffer = {
        id: 'offer-1',
        applicationId: 'app-1',
        status: OfferStatus.ACCEPTED,
        application: {
          id: 'app-1',
          candidate: { userId: 'cand-user-1' },
          job: { title: 'Backend Dev' },
        },
      };

      prisma.offer.findUnique.mockResolvedValue(mockOffer);
      prisma.application.findFirst.mockResolvedValue({ id: 'app-1' });

      await expect(
        service.revokeOffer('rec-user-1', 'offer-1', 'Lý do nào đó'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
