import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  AiInterviewStatus,
  ApplicationStage,
  CandidateResponseStatus,
  InterviewStatus,
  InterviewConductedBy,
  InterviewRoundStatus,
  InterviewMode,
  InterviewPurpose,
  InterviewProcessStatus,
  InterviewType,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ApplicationAccessService } from '../applications/application-access.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  canTransitionApplication,
  hrDecisionForStage,
} from '../applications/application-stage-machine';
import { InterviewRoundDecision } from './dto/decide-interview-round.dto';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { SubmitInterviewFeedbackDto } from './dto/submit-interview-feedback.dto';
import { QueryInterviewsDto } from './dto/query-interviews.dto';
import { CandidateResponseInterviewDto } from './dto/candidate-response-interview.dto';

@Injectable()
export class InterviewsService {
  private readonly logger = new Logger(InterviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accessService: ApplicationAccessService,
    private readonly notificationsService?: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateInterviewDto) {
    const scope = await this.accessService.recruiterApplicationWhere(userId);
    const application = await this.prisma.application.findFirst({
      where: { AND: [scope, { id: dto.applicationId }] },
      select: {
        id: true,
        currentStage: true,
        job: { select: { id: true, title: true, jobCode: true } },
        candidate: {
          select: {
            id: true,
            userId: true,
            user: {
              select: { id: true, fullName: true, email: true, phone: true },
            },
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException(
        'Đơn ứng tuyển không tồn tại hoặc bạn không có quyền truy cập.',
      );
    }

    const scheduledDate = new Date(dto.scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      throw new BadRequestException('Thời gian phỏng vấn không hợp lệ.');
    }
    if (scheduledDate.getTime() < Date.now() - 5 * 60 * 1000) {
      throw new BadRequestException(
        'Thời gian phỏng vấn không thể ở trong quá khứ. Vui lòng chọn thời gian trong tương lai.',
      );
    }

    const durationMinutes = dto.durationMinutes ?? 60;
    const interviewEnd = new Date(
      scheduledDate.getTime() + durationMinutes * 60 * 1000,
    );

    // Kiểm tra trùng lịch của ứng viên
    const candidateInterviews = await this.prisma.interview.findMany({
      where: {
        application: { candidateId: application.candidate.id },
        status: {
          in: [
            InterviewStatus.SCHEDULED,
            InterviewStatus.IN_PROGRESS,
            InterviewStatus.RESCHEDULED,
          ],
        },
      },
      select: {
        id: true,
        title: true,
        scheduledAt: true,
        durationMinutes: true,
      },
    });

    for (const item of candidateInterviews) {
      const itemStart = new Date(item.scheduledAt);
      const itemEnd = new Date(
        itemStart.getTime() + (item.durationMinutes || 60) * 60 * 1000,
      );
      if (scheduledDate < itemEnd && interviewEnd > itemStart) {
        throw new ConflictException(
          `Ứng viên đã có lịch phỏng vấn khác ("${item.title}") bị trùng khung giờ (${itemStart.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${itemEnd.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}).`,
        );
      }
    }

    let targetRoundId = dto.roundId;

    if (targetRoundId) {
      const round = await this.prisma.interviewRound.findFirst({
        where: {
          id: targetRoundId,
          process: { applicationId: application.id },
        },
        select: { id: true, conductedBy: true, status: true },
      });
      if (!round) {
        throw new NotFoundException('Không tìm thấy vòng phỏng vấn tương ứng.');
      }
      if (round.conductedBy !== InterviewConductedBy.HUMAN) {
        throw new BadRequestException('Vòng này phải được thực hiện bởi AI.');
      }
      if (
        round.status !== InterviewRoundStatus.READY &&
        round.status !== InterviewRoundStatus.DRAFT
      ) {
        throw new ConflictException(
          'Vòng phỏng vấn chưa sẵn sàng hoặc đã được lên lịch.',
        );
      }
    } else {
      let process = await this.prisma.interviewProcess.findUnique({
        where: { applicationId: application.id },
        include: {
          rounds: { orderBy: { order: 'desc' }, take: 1 },
        },
      });

      if (!process) {
        process = await this.prisma.interviewProcess.create({
          data: {
            applicationId: application.id,
            createdByUserId: userId,
            status: InterviewProcessStatus.ACTIVE,
            currentRoundOrder: 1,
            startedAt: new Date(),
          },
          include: { rounds: true },
        });
      } else if (process.status === InterviewProcessStatus.DRAFT) {
        await this.prisma.interviewProcess.update({
          where: { id: process.id },
          data: {
            status: InterviewProcessStatus.ACTIVE,
            startedAt: process.startedAt || new Date(),
          },
        });
      }

      const nextOrder = (process.rounds?.[0]?.order ?? 0) + 1;
      const round = await this.prisma.interviewRound.create({
        data: {
          processId: process.id,
          order: nextOrder,
          title: dto.title.trim(),
          description: dto.interviewerNotes?.trim() || undefined,
          conductedBy: InterviewConductedBy.HUMAN,
          mode:
            dto.type === InterviewType.OFFLINE
              ? InterviewMode.IN_PERSON
              : InterviewMode.VIDEO_CALL,
          purpose: InterviewPurpose.TECHNICAL,
          status: InterviewRoundStatus.READY,
          scheduledAt: scheduledDate,
          durationMinutes: dto.durationMinutes ?? 60,
          locationOrLink: dto.locationOrLink?.trim() || undefined,
        },
      });

      await this.prisma.interviewProcess.update({
        where: { id: process.id },
        data: { currentRoundOrder: nextOrder },
      });

      targetRoundId = round.id;
    }

    const result = await this.prisma.$transaction(async (prisma) => {
      const interview = await prisma.interview.create({
        data: {
          applicationId: dto.applicationId,
          roundId: targetRoundId,
          title: dto.title,
          type: dto.type,
          scheduledAt: scheduledDate,
          durationMinutes: dto.durationMinutes ?? 60,
          locationOrLink: dto.locationOrLink,
          interviewerNotes: dto.interviewerNotes,
          status: InterviewStatus.SCHEDULED,
        },
      });

      if (targetRoundId) {
        await prisma.interviewRound.update({
          where: { id: targetRoundId },
          data: {
            status: InterviewRoundStatus.SCHEDULED,
            scheduledAt: scheduledDate,
            durationMinutes: dto.durationMinutes ?? 60,
            locationOrLink: dto.locationOrLink,
          },
        });
      }

      // Automatically advance stage to INTERVIEW_SCHEDULED if transition is allowed
      if (
        application.currentStage !== ApplicationStage.INTERVIEW_SCHEDULED &&
        canTransitionApplication(
          application.currentStage,
          ApplicationStage.INTERVIEW_SCHEDULED,
        )
      ) {
        await prisma.application.update({
          where: { id: application.id },
          data: {
            currentStage: ApplicationStage.INTERVIEW_SCHEDULED,
            hrDecision: hrDecisionForStage(
              ApplicationStage.INTERVIEW_SCHEDULED,
            ),
          },
        });

        await prisma.applicationStatusHistory.create({
          data: {
            applicationId: application.id,
            previousStage: application.currentStage,
            newStage: ApplicationStage.INTERVIEW_SCHEDULED,
            changedByUserId: userId,
            note: `Lên lịch phỏng vấn: ${dto.title} (${scheduledDate.toLocaleString('vi-VN')})`,
          },
        });
      }

      this.logger.log(
        `Interview ${interview.id} scheduled for application ${application.id} by user ${userId}`,
      );

      return {
        ...interview,
        score: interview.score !== null ? Number(interview.score) : null,
        application: {
          id: application.id,
          job: application.job,
          candidate: {
            id: application.candidate.id,
            ...application.candidate.user,
          },
        },
      };
    });

    const recipientUserId =
      application.candidate?.userId || application.candidate?.user?.id;
    if (this.notificationsService && recipientUserId) {
      await this.notificationsService.createNotification({
        recipientUserId,
        applicationId: application.id,
        type: NotificationType.INTERVIEW_SCHEDULED,
        title: `Thư mời phỏng vấn: ${application.job?.title || 'Công việc'}`,
        message: `Bạn có buổi phỏng vấn "${dto.title}" vào lúc ${new Date(dto.scheduledAt).toLocaleString('vi-VN')}.`,
        payload: {
          applicationId: application.id,
          interviewId: result.id,
          scheduledAt: dto.scheduledAt,
          locationOrLink: dto.locationOrLink,
          jobTitle: application.job?.title,
        },
      });
    }

    return result;
  }

  async findAllForRecruiter(userId: string, query: QueryInterviewsDto) {
    const scope = await this.accessService.recruiterApplicationWhere(userId);
    const where: Prisma.InterviewWhereInput = {
      application: {
        AND: [
          scope,
          query.jobId ? { jobId: query.jobId } : {},
          query.applicationId ? { id: query.applicationId } : {},
        ],
      },
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
    };

    const skip = (query.page - 1) * query.limit;

    const [total, items] = await Promise.all([
      this.prisma.interview.count({ where }),
      this.prisma.interview.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { scheduledAt: 'desc' },
        include: {
          round: {
            select: {
              id: true,
              order: true,
              title: true,
              status: true,
              conductedBy: true,
              mode: true,
              resultScore: true,
            },
          },
          application: {
            select: {
              id: true,
              currentStage: true,
              job: { select: { id: true, title: true, jobCode: true } },
              candidate: {
                select: {
                  id: true,
                  desiredTitle: true,
                  user: {
                    select: {
                      fullName: true,
                      email: true,
                      phone: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      data: items.map((item) => ({
        ...item,
        score: item.score !== null ? Number(item.score) : null,
      })),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findMineForCandidate(userId: string) {
    const candidateId = await this.accessService.candidateProfileId(userId);

    const interviews = await this.prisma.interview.findMany({
      where: {
        application: {
          candidateId,
        },
      },
      orderBy: { scheduledAt: 'desc' },
      include: {
        round: {
          select: {
            id: true,
            order: true,
            title: true,
            status: true,
            conductedBy: true,
            mode: true,
            resultScore: true,
          },
        },
        application: {
          select: {
            id: true,
            currentStage: true,
            job: {
              select: {
                id: true,
                title: true,
                location: true,
                recruiter: {
                  select: {
                    title: true,
                    user: {
                      select: {
                        fullName: true,
                        email: true,
                        phone: true,
                      },
                    },
                    company: {
                      select: { id: true, name: true, logoUrl: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return interviews.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      status: item.status,
      candidateResponse: item.candidateResponse,
      candidateNotes: item.candidateNotes,
      proposedSlots: item.proposedSlots,
      scheduledAt: item.scheduledAt,
      durationMinutes: item.durationMinutes,
      locationOrLink: item.locationOrLink,
      interviewerNotes: item.interviewerNotes,
      round: item.round,
      application: {
        id: item.application.id,
        currentStage: item.application.currentStage,
        job: {
          id: item.application.job.id,
          title: item.application.job.title,
          location: item.application.job.location,
          company: item.application.job.recruiter?.company,
          recruiter: item.application.job.recruiter
            ? {
                title: item.application.job.recruiter.title,
                fullName: item.application.job.recruiter.user?.fullName,
                email: item.application.job.recruiter.user?.email,
                phone: item.application.job.recruiter.user?.phone,
              }
            : null,
        },
      },
    }));
  }

  async findOne(userId: string, id: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id },
      include: {
        application: {
          select: {
            id: true,
            currentStage: true,
            candidateId: true,
            job: {
              select: {
                id: true,
                title: true,
                recruiter: {
                  select: { id: true, userId: true, companyId: true },
                },
              },
            },
            candidate: {
              select: {
                id: true,
                userId: true,
                user: { select: { fullName: true, email: true, phone: true } },
              },
            },
          },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException('Không tìm thấy lịch phỏng vấn.');
    }

    const isCandidateOwner = interview.application.candidate.userId === userId;
    if (!isCandidateOwner) {
      const scope = await this.accessService
        .recruiterApplicationWhere(userId)
        .catch(() => null);
      if (!scope) {
        throw new NotFoundException('Không tìm thấy lịch phỏng vấn.');
      }
      const app = await this.prisma.application.findFirst({
        where: { AND: [scope, { id: interview.applicationId }] },
        select: { id: true },
      });
      if (!app) {
        throw new NotFoundException('Không tìm thấy lịch phỏng vấn.');
      }
    }

    return {
      ...interview,
      score: interview.score !== null ? Number(interview.score) : null,
    };
  }

  async update(userId: string, id: string, dto: UpdateInterviewDto) {
    const scope = await this.accessService.recruiterApplicationWhere(userId);
    const existing = await this.prisma.interview.findFirst({
      where: {
        id,
        application: scope,
      },
      include: {
        application: {
          select: {
            id: true,
            currentStage: true,
            job: { select: { title: true } },
            candidate: {
              select: {
                id: true,
                userId: true,
                user: { select: { fullName: true } },
              },
            },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy lịch phỏng vấn để cập nhật.');
    }

    const scheduledDate = dto.scheduledAt
      ? new Date(dto.scheduledAt)
      : undefined;
    if (scheduledDate && isNaN(scheduledDate.getTime())) {
      throw new BadRequestException('Thời gian phỏng vấn không hợp lệ.');
    }

    if (scheduledDate) {
      if (scheduledDate.getTime() < Date.now() - 5 * 60 * 1000) {
        throw new BadRequestException(
          'Thời gian phỏng vấn không thể ở trong quá khứ. Vui lòng chọn thời gian trong tương lai.',
        );
      }
      const durationMinutes =
        dto.durationMinutes ?? existing.durationMinutes ?? 60;
      const interviewEnd = new Date(
        scheduledDate.getTime() + durationMinutes * 60 * 1000,
      );

      const candidateInterviews = await this.prisma.interview.findMany({
        where: {
          id: { not: existing.id },
          application: { candidateId: existing.application.candidate.id },
          status: {
            in: [
              InterviewStatus.SCHEDULED,
              InterviewStatus.IN_PROGRESS,
              InterviewStatus.RESCHEDULED,
            ],
          },
        },
        select: {
          id: true,
          title: true,
          scheduledAt: true,
          durationMinutes: true,
        },
      });

      for (const item of candidateInterviews) {
        const itemStart = new Date(item.scheduledAt);
        const itemEnd = new Date(
          itemStart.getTime() + (item.durationMinutes || 60) * 60 * 1000,
        );
        if (scheduledDate < itemEnd && interviewEnd > itemStart) {
          throw new ConflictException(
            `Ứng viên đã có lịch phỏng vấn khác ("${item.title}") bị trùng khung giờ (${itemStart.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${itemEnd.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}).`,
          );
        }
      }
    }

    // Determine candidate response & status transitions
    let targetCandidateResponse = dto.candidateResponse;
    if (targetCandidateResponse === undefined && scheduledDate) {
      if (
        existing.candidateResponse ===
        CandidateResponseStatus.RESCHEDULE_REQUESTED
      ) {
        targetCandidateResponse = CandidateResponseStatus.PENDING;
      }
    }

    let targetStatus = dto.status;
    if (
      !targetStatus &&
      scheduledDate &&
      existing.status === InterviewStatus.RESCHEDULED
    ) {
      targetStatus = InterviewStatus.SCHEDULED;
    }

    const updated = await this.prisma.$transaction(async (prisma) => {
      const result = await prisma.interview.update({
        where: { id },
        data: {
          title: dto.title,
          type: dto.type,
          status: targetStatus,
          candidateResponse: targetCandidateResponse,
          scheduledAt: scheduledDate,
          durationMinutes: dto.durationMinutes,
          locationOrLink: dto.locationOrLink,
          interviewerNotes: dto.interviewerNotes,
        },
      });

      if (targetStatus === InterviewStatus.CANCELLED && existing.roundId) {
        await prisma.interviewRound.update({
          where: { id: existing.roundId },
          data: { status: InterviewRoundStatus.CANCELLED },
        });
      }

      const dateStr = scheduledDate
        ? scheduledDate.toLocaleString('vi-VN')
        : existing.scheduledAt.toLocaleString('vi-VN');

      let historyNote = `Nhà tuyển dụng đã cập nhật lịch phỏng vấn: "${result.title}" (${dateStr}).`;
      if (targetStatus === InterviewStatus.CANCELLED) {
        historyNote = `Nhà tuyển dụng đã hủy buổi phỏng vấn: "${result.title}" (${dateStr}).`;
      } else if (targetCandidateResponse === CandidateResponseStatus.ACCEPTED) {
        historyNote = `Nhà tuyển dụng đã chấp nhận khung giờ mới và chốt lịch phỏng vấn: "${result.title}" (${dateStr}).`;
      }

      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: existing.application.id,
          previousStage: existing.application.currentStage,
          newStage: existing.application.currentStage,
          changedByUserId: userId,
          note: historyNote,
        },
      });

      return result;
    });

    if (this.notificationsService && existing.application.candidate?.userId) {
      const jobTitle = existing.application.job?.title || 'Công việc';
      const dateStr = (scheduledDate || existing.scheduledAt).toLocaleString(
        'vi-VN',
      );

      let notifTitle = `Cập nhật lịch phỏng vấn: ${jobTitle}`;
      let notifMsg = `Lịch phỏng vấn "${updated.title}" cho vị trí ${jobTitle} đã được cập nhật lại vào lúc ${dateStr}. Vui lòng kiểm tra và xác nhận trên hệ thống.`;

      if (targetStatus === InterviewStatus.CANCELLED) {
        notifTitle = `Hủy lịch phỏng vấn: ${jobTitle}`;
        notifMsg = `Buổi phỏng vấn "${updated.title}" cho vị trí ${jobTitle} vào lúc ${dateStr} đã được hủy bỏ.`;
      } else if (targetCandidateResponse === CandidateResponseStatus.ACCEPTED) {
        notifTitle = `Xác nhận đổi lịch phỏng vấn: ${jobTitle}`;
        notifMsg = `Nhà tuyển dụng đã đồng ý dời lịch phỏng vấn "${updated.title}" sang lúc ${dateStr}. Buổi phỏng vấn đã được chốt thành công.`;
      }

      await this.notificationsService.createNotification({
        recipientUserId: existing.application.candidate.userId,
        applicationId: existing.application.id,
        type: NotificationType.APPLICATION_STATUS_CHANGED,
        title: notifTitle,
        message: notifMsg,
        payload: {
          applicationId: existing.application.id,
          interviewId: updated.id,
          scheduledAt: updated.scheduledAt,
          candidateResponse: updated.candidateResponse,
        },
      });
    }

    return {
      ...updated,
      score: updated.score !== null ? Number(updated.score) : null,
    };
  }

  async submitFeedback(
    userId: string,
    id: string,
    dto: SubmitInterviewFeedbackDto,
  ) {
    const scope = await this.accessService.recruiterApplicationWhere(userId);
    const existing = await this.prisma.interview.findFirst({
      where: {
        id,
        application: scope,
      },
      include: {
        application: {
          select: {
            id: true,
            currentStage: true,
            job: { select: { title: true } },
            candidate: { select: { userId: true } },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy lịch phỏng vấn.');
    }

    let targetStage = existing.application.currentStage;

    const result = await this.prisma.$transaction(async (prisma) => {
      const updatedInterview = await prisma.interview.update({
        where: { id },
        data: {
          score: dto.score,
          interviewerNotes: dto.interviewerNotes,
          status: InterviewStatus.COMPLETED,
        },
      });

      if (existing.roundId) {
        const round = await prisma.interviewRound.findUnique({
          where: { id: existing.roundId },
          include: { process: true },
        });

        if (round) {
          if (dto.decision === InterviewRoundDecision.PASSED) {
            const nextRound = await prisma.interviewRound.findFirst({
              where: {
                processId: round.processId,
                order: { gt: round.order },
                status: { not: InterviewRoundStatus.CANCELLED },
              },
              orderBy: { order: 'asc' },
            });

            await prisma.interviewRound.update({
              where: { id: existing.roundId },
              data: {
                status: InterviewRoundStatus.PASSED,
                resultScore: dto.score,
                decisionNote: dto.interviewerNotes,
                decidedByUserId: userId,
                decidedAt: new Date(),
              },
            });

            if (nextRound) {
              await prisma.interviewRound.update({
                where: { id: nextRound.id },
                data: { status: InterviewRoundStatus.READY },
              });
              await prisma.interviewProcess.update({
                where: { id: round.processId },
                data: { currentRoundOrder: nextRound.order },
              });
              targetStage = ApplicationStage.INTERVIEW_SCHEDULED;
            } else {
              // Final round completed!
              await prisma.interviewProcess.update({
                where: { id: round.processId },
                data: {
                  status: InterviewProcessStatus.COMPLETED,
                  currentRoundOrder: null,
                  completedAt: new Date(),
                },
              });

              targetStage = ApplicationStage.INTERVIEWED;
              if (
                existing.application.currentStage !== ApplicationStage.INTERVIEWED &&
                canTransitionApplication(
                  existing.application.currentStage,
                  ApplicationStage.INTERVIEWED,
                )
              ) {
                await prisma.application.update({
                  where: { id: existing.application.id },
                  data: {
                    currentStage: ApplicationStage.INTERVIEWED,
                    hrDecision: hrDecisionForStage(ApplicationStage.INTERVIEWED),
                  },
                });

                await prisma.applicationStatusHistory.create({
                  data: {
                    applicationId: existing.application.id,
                    previousStage: existing.application.currentStage,
                    newStage: ApplicationStage.INTERVIEWED,
                    changedByUserId: userId,
                    note: `Hoàn tất vòng phỏng vấn cuối cùng với ${dto.score}/100 điểm. Ứng viên đã đạt toàn bộ quy trình phỏng vấn!`,
                  },
                });
              }
            }
          } else if (dto.decision === InterviewRoundDecision.FAILED) {
            await prisma.interviewRound.update({
              where: { id: existing.roundId },
              data: {
                status: InterviewRoundStatus.FAILED,
                resultScore: dto.score,
                decisionNote: dto.interviewerNotes,
                decidedByUserId: userId,
                decidedAt: new Date(),
              },
            });

            await prisma.interviewProcess.update({
              where: { id: round.processId },
              data: {
                status: InterviewProcessStatus.CANCELLED,
                currentRoundOrder: null,
                completedAt: new Date(),
              },
            });

            await prisma.interviewRound.updateMany({
              where: {
                processId: round.processId,
                id: { not: existing.roundId },
                status: {
                  in: [
                    InterviewRoundStatus.DRAFT,
                    InterviewRoundStatus.READY,
                    InterviewRoundStatus.SCHEDULED,
                    InterviewRoundStatus.IN_PROGRESS,
                    InterviewRoundStatus.AWAITING_REVIEW,
                  ],
                },
              },
              data: { status: InterviewRoundStatus.CANCELLED },
            });

            await prisma.interview.updateMany({
              where: {
                applicationId: existing.application.id,
                id: { not: existing.id },
                status: {
                  in: [
                    InterviewStatus.SCHEDULED,
                    InterviewStatus.IN_PROGRESS,
                    InterviewStatus.RESCHEDULED,
                  ],
                },
              },
              data: { status: InterviewStatus.CANCELLED },
            });

            await prisma.aiInterviewSession.updateMany({
              where: {
                applicationId: existing.application.id,
                status: {
                  in: [
                    AiInterviewStatus.CREATED,
                    AiInterviewStatus.IN_PROGRESS,
                  ],
                },
              },
              data: {
                status: AiInterviewStatus.TERMINATED,
                terminationReason: 'Ứng viên không đạt vòng phỏng vấn.',
              },
            });

            targetStage = ApplicationStage.REJECTED;
            await prisma.application.update({
              where: { id: existing.application.id },
              data: {
                currentStage: ApplicationStage.REJECTED,
                hrDecision: hrDecisionForStage(ApplicationStage.REJECTED),
                hrNotes: dto.interviewerNotes,
              },
            });

            await prisma.applicationStatusHistory.create({
              data: {
                applicationId: existing.application.id,
                previousStage: existing.application.currentStage,
                newStage: ApplicationStage.REJECTED,
                changedByUserId: userId,
                note: `Không đạt vòng phỏng vấn (${dto.score}/100 điểm). Nhận xét: ${dto.interviewerNotes.slice(0, 300)}`,
              },
            });
          } else if (dto.decision === InterviewRoundDecision.NO_SHOW) {
            await prisma.interview.update({
              where: { id },
              data: {
                status: InterviewStatus.RESCHEDULED,
                candidateResponse: CandidateResponseStatus.PENDING,
                interviewerNotes:
                  dto.interviewerNotes ||
                  'Ứng viên vắng mặt (No-Show). Đang chờ ứng viên đề xuất dời lịch trong 24 giờ.',
              },
            });

            await prisma.interviewRound.update({
              where: { id: existing.roundId },
              data: {
                status: InterviewRoundStatus.NO_SHOW,
                decisionNote:
                  dto.interviewerNotes ||
                  'Ứng viên vắng mặt (No-Show). Cho phép dời lịch trong 24 giờ.',
                decidedByUserId: userId,
                decidedAt: new Date(),
              },
            });

            await prisma.applicationStatusHistory.create({
              data: {
                applicationId: existing.application.id,
                previousStage: existing.application.currentStage,
                newStage: existing.application.currentStage,
                changedByUserId: userId,
                note: `Đã đánh dấu ứng viên Vắng mặt (No-Show). Đã gửi thông báo cho ứng viên 24 giờ để đề xuất dời lịch lại.`,
              },
            });
          } else {
            await prisma.interviewRound.update({
              where: { id: existing.roundId },
              data: {
                status: InterviewRoundStatus.AWAITING_REVIEW,
                resultScore: dto.score,
              },
            });
          }
        }
      } else {
        targetStage = dto.nextStage ?? ApplicationStage.INTERVIEWED;
        const currentStage = existing.application.currentStage;
        if (
          currentStage !== targetStage &&
          canTransitionApplication(currentStage, targetStage)
        ) {
          await prisma.application.update({
            where: { id: existing.application.id },
            data: {
              currentStage: targetStage,
              hrDecision: hrDecisionForStage(targetStage),
            },
          });

          await prisma.applicationStatusHistory.create({
            data: {
              applicationId: existing.application.id,
              previousStage: currentStage,
              newStage: targetStage,
              changedByUserId: userId,
              note: `Đánh giá phỏng vấn: ${dto.score}/100 điểm. Nhận xét: ${dto.interviewerNotes.slice(0, 300)}`,
            },
          });
        }
      }

      this.logger.log(
        `Feedback submitted for interview ${id}. Score: ${dto.score}, application stage: ${targetStage}`,
      );

      return {
        ...updatedInterview,
        score: Number(updatedInterview.score),
        applicationStage: targetStage,
      };
    });

    if (this.notificationsService && existing.application.candidate?.userId) {
      let notifTitle = `Kết quả phỏng vấn: ${existing.application.job?.title || 'Công việc'}`;
      let notifMsg = `Buổi phỏng vấn "${existing.title}" đã được chấm điểm (${dto.score}/100 điểm).`;

      if (dto.decision === InterviewRoundDecision.NO_SHOW) {
        notifTitle = `Thông báo vắng mặt buổi phỏng vấn: ${existing.application.job?.title || 'Công việc'}`;
        notifMsg = `Bạn đã vắng mặt trong buổi phỏng vấn "${existing.title}". Bạn có 24 giờ để gửi đề xuất khung giờ dời lịch trên hệ thống. Sau thời gian này, hồ sơ sẽ tự động chuyển sang Chưa phù hợp.`;
      } else if (dto.decision === InterviewRoundDecision.PASSED) {
        notifMsg = `Chúc mừng! Bạn đã đạt yêu cầu vòng phỏng vấn "${existing.title}" (${dto.score}/100 điểm).`;
      } else if (dto.decision === InterviewRoundDecision.FAILED) {
        notifMsg = `Cảm ơn bạn đã tham gia. Kết quả vòng phỏng vấn "${existing.title}" chưa phù hợp với yêu cầu hiện tại.`;
      }

      await this.notificationsService.createNotification({
        recipientUserId: existing.application.candidate.userId,
        applicationId: existing.application.id,
        type: NotificationType.APPLICATION_STATUS_CHANGED,
        title: notifTitle,
        message: notifMsg,
        payload: {
          applicationId: existing.application.id,
          interviewId: existing.id,
          score: dto.score,
          decision: dto.decision,
          nextStage: targetStage,
          isNoShow: dto.decision === InterviewRoundDecision.NO_SHOW,
        },
      });
    }

    return result;
  }

  async respondToInterview(
    userId: string,
    id: string,
    dto: CandidateResponseInterviewDto,
  ) {
    const interview = await this.prisma.interview.findUnique({
      where: { id },
      include: {
        application: {
          select: {
            id: true,
            currentStage: true,
            candidate: {
              select: {
                id: true,
                userId: true,
                user: { select: { fullName: true, email: true, phone: true } },
              },
            },
            job: {
              select: {
                id: true,
                title: true,
                recruiter: {
                  select: {
                    id: true,
                    userId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException('Không tìm thấy lịch phỏng vấn.');
    }

    if (interview.application.candidate.userId !== userId) {
      throw new NotFoundException(
        'Bạn không có quyền phản hồi lịch phỏng vấn này.',
      );
    }

    if (
      interview.status === InterviewStatus.COMPLETED ||
      interview.status === InterviewStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Buổi phỏng vấn này đã hoàn thành hoặc đã bị hủy.',
      );
    }

    let newStatus: InterviewStatus = interview.status;
    if (dto.response === CandidateResponseStatus.DECLINED) {
      newStatus = InterviewStatus.CANCELLED;
    } else if (dto.response === CandidateResponseStatus.RESCHEDULE_REQUESTED) {
      newStatus = InterviewStatus.RESCHEDULED;
    }

    const updated = await this.prisma.$transaction(async (prisma) => {
      const result = await prisma.interview.update({
        where: { id },
        data: {
          candidateResponse: dto.response,
          candidateNotes: dto.candidateNotes,
          proposedSlots: dto.proposedSlots
            ? (dto.proposedSlots as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          status: newStatus,
        },
      });

      if (
        interview.roundId &&
        dto.response === CandidateResponseStatus.DECLINED
      ) {
        await prisma.interviewRound.update({
          where: { id: interview.roundId },
          data: { status: InterviewRoundStatus.CANCELLED },
        });
      } else if (
        interview.roundId &&
        dto.response === CandidateResponseStatus.RESCHEDULE_REQUESTED
      ) {
        await prisma.interviewRound.update({
          where: { id: interview.roundId },
          data: {
            status: InterviewRoundStatus.READY,
            decisionNote: `Ứng viên đề xuất dời lịch: ${dto.candidateNotes || 'Không có ghi chú'}.`,
          },
        });
      }

      const candidateName =
        interview.application.candidate.user?.fullName || 'Ứng viên';
      let statusText = 'đã xác nhận tham gia';
      if (dto.response === CandidateResponseStatus.RESCHEDULE_REQUESTED) {
        statusText = 'đã đề xuất dời lịch';
      } else if (dto.response === CandidateResponseStatus.DECLINED) {
        statusText = 'đã từ chối tham gia';
      }

      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: interview.application.id,
          previousStage: interview.application.currentStage,
          newStage: interview.application.currentStage,
          changedByUserId: userId,
          note: `Ứng viên ${candidateName} ${statusText} phỏng vấn: "${interview.title}".${dto.candidateNotes ? ` Ghi chú: ${dto.candidateNotes}` : ''}`,
        },
      });

      return result;
    });

    if (
      this.notificationsService &&
      interview.application.job.recruiter?.userId
    ) {
      const candidateName =
        interview.application.candidate.user?.fullName || 'Ứng viên';
      let statusText = 'đã xác nhận tham gia';
      if (dto.response === CandidateResponseStatus.RESCHEDULE_REQUESTED) {
        statusText = 'đã đề xuất dời lịch';
      } else if (dto.response === CandidateResponseStatus.DECLINED) {
        statusText = 'đã từ chối tham gia';
      }

      await this.notificationsService.createNotification({
        recipientUserId: interview.application.job.recruiter.userId,
        applicationId: interview.application.id,
        type: NotificationType.APPLICATION_STATUS_CHANGED,
        title: `Phản hồi phỏng vấn: ${candidateName}`,
        message: `${candidateName} ${statusText} buổi phỏng vấn "${interview.title}" cho vị trí ${interview.application.job.title}.${dto.candidateNotes ? ` Ghi chú: ${dto.candidateNotes}` : ''}`,
        payload: {
          applicationId: interview.application.id,
          interviewId: interview.id,
          candidateResponse: dto.response,
          candidateNotes: dto.candidateNotes,
          proposedSlots: dto.proposedSlots,
        },
      });
    }

    return {
      ...updated,
      score: updated.score !== null ? Number(updated.score) : null,
    };
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleExpiredNoShows(now = new Date()) {
    const expiredCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const expiredRounds = await this.prisma.interviewRound.findMany({
      where: {
        status: InterviewRoundStatus.NO_SHOW,
        decidedAt: { lte: expiredCutoff },
      },
      include: {
        interviews: {
          select: {
            id: true,
            status: true,
            candidateResponse: true,
          },
        },
        process: {
          include: {
            application: {
              include: {
                candidate: { select: { userId: true } },
                job: { select: { title: true } },
              },
            },
          },
        },
      },
    });

    for (const round of expiredRounds) {
      const hasRescheduled = round.interviews.some(
        (i) => i.candidateResponse === CandidateResponseStatus.RESCHEDULE_REQUESTED,
      );
      if (hasRescheduled) {
        continue;
      }

      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.interviewRound.update({
            where: { id: round.id },
            data: {
              status: InterviewRoundStatus.FAILED,
              decisionNote:
                'Quá thời hạn 24 giờ đề xuất dời lịch sau buổi phỏng vấn vắng mặt (No-Show).',
            },
          });

          await tx.interview.updateMany({
            where: { roundId: round.id },
            data: {
              status: InterviewStatus.CANCELLED,
            },
          });

          const app = round.process?.application;
          if (
            app &&
            app.currentStage !== ApplicationStage.REJECTED &&
            app.currentStage !== ApplicationStage.WITHDRAWN
          ) {
            await tx.application.update({
              where: { id: app.id },
              data: {
                currentStage: ApplicationStage.REJECTED,
                statusHistories: {
                  create: {
                    previousStage: app.currentStage,
                    newStage: ApplicationStage.REJECTED,
                    note: 'Tự động đóng hồ sơ do quá thời hạn 24 giờ đề xuất dời lịch sau khi vắng mặt (No-Show).',
                  },
                },
              },
            });

            if (this.notificationsService && app.candidate?.userId) {
              await this.notificationsService.createNotification({
                recipientUserId: app.candidate.userId,
                applicationId: app.id,
                type: NotificationType.APPLICATION_STATUS_CHANGED,
                title: `Hồ sơ đã dừng lại: ${app.job?.title || 'Công việc'}`,
                message: `Hồ sơ ứng tuyển của bạn đã dừng lại do quá thời hạn 24 giờ đề xuất dời lịch sau buổi phỏng vấn vắng mặt.`,
                payload: {
                  applicationId: app.id,
                  newStage: ApplicationStage.REJECTED,
                  reason: 'NO_SHOW_EXPIRED',
                },
              });
            }
          }
        });
      } catch (err) {
        this.logger.error(
          `Error auto-closing expired no-show round ${round.id}:`,
          err,
        );
      }
    }
  }
}
