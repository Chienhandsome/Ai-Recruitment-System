import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStage,
  InterviewConductedBy,
  InterviewMode,
  InterviewProcessStatus,
  InterviewRoundStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ApplicationAccessService } from '../applications/application-access.service';
import {
  canTransitionApplication,
  hrDecisionForStage,
} from '../applications/application-stage-machine';
import { CreateInterviewProcessDto } from './dto/create-interview-process.dto';
import { CreateInterviewRoundDto } from './dto/create-interview-round.dto';
import { UpdateInterviewRoundDto } from './dto/update-interview-round.dto';
import { ReorderInterviewRoundsDto } from './dto/reorder-interview-rounds.dto';
import {
  DecideInterviewRoundDto,
  InterviewRoundDecision,
} from './dto/decide-interview-round.dto';

const processInclude = {
  rounds: {
    orderBy: { order: 'asc' as const },
    include: {
      interviews: { orderBy: { createdAt: 'desc' as const } },
      aiInterviewSessions: { orderBy: { createdAt: 'desc' as const } },
    },
  },
} as const;

@Injectable()
export class InterviewProcessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessService: ApplicationAccessService,
  ) {}

  async create(userId: string, dto: CreateInterviewProcessDto) {
    const scope = await this.accessService.recruiterApplicationWhere(userId);
    const application = await this.prisma.application.findFirst({
      where: { AND: [scope, { id: dto.applicationId }] },
      select: {
        id: true,
        currentStage: true,
        interviewProcess: { select: { id: true } },
      },
    });
    if (!application) {
      throw new NotFoundException('Không tìm thấy đơn ứng tuyển.');
    }
    if (application.interviewProcess) {
      throw new ConflictException('Ứng viên đã có quy trình phỏng vấn.');
    }
    if (
      application.currentStage !== ApplicationStage.SHORTLISTED &&
      application.currentStage !== ApplicationStage.INTERVIEW_SCHEDULED
    ) {
      throw new BadRequestException(
        'Chỉ có thể tạo quy trình phỏng vấn sau khi ứng viên đạt vòng CV.',
      );
    }

    return this.prisma.interviewProcess.create({
      data: {
        applicationId: application.id,
        createdByUserId: userId,
      },
      include: processInclude,
    });
  }

  async findForApplication(userId: string, applicationId: string) {
    const scope = await this.accessService.recruiterApplicationWhere(userId);
    const process = await this.prisma.interviewProcess.findFirst({
      where: { applicationId, application: scope },
      include: processInclude,
    });
    return process ? this.serialize(process) : null;
  }

  async addRound(
    userId: string,
    processId: string,
    dto: CreateInterviewRoundDto,
  ) {
    const process = await this.findOwnedProcess(userId, processId);
    this.assertProcessEditable(process.status);
    this.validateRoundCombination(dto.conductedBy, dto.mode);

    const last = await this.prisma.interviewRound.findFirst({
      where: { processId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const round = await this.prisma.interviewRound.create({
      data: {
        processId,
        order: (last?.order ?? 0) + 1,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        conductedBy: dto.conductedBy,
        mode: dto.mode,
        purpose: dto.purpose,
        required: dto.required,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        durationMinutes: dto.durationMinutes ?? 60,
        locationOrLink: dto.locationOrLink?.trim(),
        evaluationCriteria: dto.evaluationCriteria
          ? (dto.evaluationCriteria as Prisma.InputJsonValue)
          : undefined,
      },
      include: { interviews: true, aiInterviewSessions: true },
    });
    return this.serialize(round);
  }

  async updateRound(
    userId: string,
    roundId: string,
    dto: UpdateInterviewRoundDto,
  ) {
    const round = await this.findOwnedRound(userId, roundId);
    if (
      round.status !== InterviewRoundStatus.DRAFT &&
      round.status !== InterviewRoundStatus.READY
    ) {
      throw new ConflictException('Không thể sửa vòng đã bắt đầu.');
    }
    const conductedBy = dto.conductedBy ?? round.conductedBy;
    const mode = dto.mode ?? round.mode;
    this.validateRoundCombination(conductedBy, mode);

    const updated = await this.prisma.interviewRound.update({
      where: { id: roundId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() }
          : {}),
        ...(dto.conductedBy !== undefined
          ? { conductedBy: dto.conductedBy }
          : {}),
        ...(dto.mode !== undefined ? { mode: dto.mode } : {}),
        ...(dto.purpose !== undefined ? { purpose: dto.purpose } : {}),
        ...(dto.required !== undefined ? { required: dto.required } : {}),
        ...(dto.scheduledAt !== undefined
          ? { scheduledAt: new Date(dto.scheduledAt) }
          : {}),
        ...(dto.durationMinutes !== undefined
          ? { durationMinutes: dto.durationMinutes }
          : {}),
        ...(dto.locationOrLink !== undefined
          ? { locationOrLink: dto.locationOrLink.trim() }
          : {}),
        ...(dto.evaluationCriteria !== undefined
          ? {
              evaluationCriteria:
                dto.evaluationCriteria as Prisma.InputJsonValue,
            }
          : {}),
      },
      include: { interviews: true, aiInterviewSessions: true },
    });
    return this.serialize(updated);
  }

  async removeRound(userId: string, roundId: string) {
    const round = await this.findOwnedRound(userId, roundId);
    if (round.process.status !== InterviewProcessStatus.DRAFT) {
      throw new ConflictException(
        'Chỉ có thể xóa vòng khi kế hoạch còn là bản nháp.',
      );
    }
    await this.prisma.$transaction(async (prisma) => {
      await prisma.interviewRound.delete({ where: { id: roundId } });
      const remaining = await prisma.interviewRound.findMany({
        where: { processId: round.processId },
        orderBy: { order: 'asc' },
        select: { id: true },
      });
      for (let index = 0; index < remaining.length; index += 1) {
        await prisma.interviewRound.update({
          where: { id: remaining[index].id },
          data: { order: index + 1 },
        });
      }
    });
    return { deleted: true };
  }

  async reorder(
    userId: string,
    processId: string,
    dto: ReorderInterviewRoundsDto,
  ) {
    const process = await this.findOwnedProcess(userId, processId);
    if (process.status !== InterviewProcessStatus.DRAFT) {
      throw new ConflictException(
        'Chỉ có thể sắp xếp kế hoạch khi còn là bản nháp.',
      );
    }
    const rounds = await this.prisma.interviewRound.findMany({
      where: { processId },
      select: { id: true },
    });
    const existingIds = new Set(rounds.map((item) => item.id));
    if (
      dto.roundIds.length !== rounds.length ||
      new Set(dto.roundIds).size !== rounds.length ||
      dto.roundIds.some((id) => !existingIds.has(id))
    ) {
      throw new BadRequestException(
        'Danh sách sắp xếp phải chứa chính xác toàn bộ vòng.',
      );
    }
    await this.prisma.$transaction(async (prisma) => {
      for (let index = 0; index < dto.roundIds.length; index += 1) {
        await prisma.interviewRound.update({
          where: { id: dto.roundIds[index] },
          data: { order: -(index + 1) },
        });
      }
      for (let index = 0; index < dto.roundIds.length; index += 1) {
        await prisma.interviewRound.update({
          where: { id: dto.roundIds[index] },
          data: { order: index + 1 },
        });
      }
    });
    return this.findForApplication(userId, process.applicationId);
  }

  async activate(userId: string, processId: string) {
    const process = await this.findOwnedProcess(userId, processId);
    if (process.status !== InterviewProcessStatus.DRAFT) {
      throw new ConflictException(
        'Quy trình đã được kích hoạt hoặc đã kết thúc.',
      );
    }
    const rounds = await this.prisma.interviewRound.findMany({
      where: { processId },
      orderBy: { order: 'asc' },
      select: { id: true, order: true },
    });
    if (!rounds.length) {
      throw new BadRequestException(
        'Cần ít nhất một vòng trước khi kích hoạt.',
      );
    }
    const currentStage = process.application.currentStage;
    if (
      currentStage !== ApplicationStage.INTERVIEW_SCHEDULED &&
      !canTransitionApplication(
        currentStage,
        ApplicationStage.INTERVIEW_SCHEDULED,
      )
    ) {
      throw new BadRequestException(
        `Không thể bắt đầu phỏng vấn từ trạng thái ${currentStage}.`,
      );
    }

    await this.prisma.$transaction(async (prisma) => {
      const activated = await prisma.interviewProcess.updateMany({
        where: { id: processId, status: InterviewProcessStatus.DRAFT },
        data: {
          status: InterviewProcessStatus.ACTIVE,
          currentRoundOrder: rounds[0].order,
          startedAt: new Date(),
        },
      });
      if (activated.count !== 1) {
        throw new ConflictException(
          'Quy trình vừa được thay đổi. Vui lòng tải lại.',
        );
      }
      await prisma.interviewRound.update({
        where: { id: rounds[0].id },
        data: { status: InterviewRoundStatus.READY },
      });
      if (currentStage !== ApplicationStage.INTERVIEW_SCHEDULED) {
        await prisma.application.update({
          where: { id: process.applicationId },
          data: {
            currentStage: ApplicationStage.INTERVIEW_SCHEDULED,
            hrDecision: hrDecisionForStage(
              ApplicationStage.INTERVIEW_SCHEDULED,
            ),
          },
        });
      }
      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: process.applicationId,
          previousStage: currentStage,
          newStage: ApplicationStage.INTERVIEW_SCHEDULED,
          changedByUserId: userId,
          note: `Kích hoạt kế hoạch phỏng vấn gồm ${rounds.length} vòng.`,
        },
      });
    });
    return this.findForApplication(userId, process.applicationId);
  }

  async decide(userId: string, roundId: string, dto: DecideInterviewRoundDto) {
    const round = await this.findOwnedRound(userId, roundId);
    if (round.status !== InterviewRoundStatus.AWAITING_REVIEW) {
      throw new ConflictException(
        'Vòng phỏng vấn chưa sẵn sàng để quyết định.',
      );
    }
    const passed = dto.decision === InterviewRoundDecision.PASSED;
    const decisionNote = dto.note?.trim();
    if (!passed && !decisionNote) {
      throw new BadRequestException(
        'Vui lòng nhập lý do trước khi từ chối ứng viên.',
      );
    }
    if (
      !passed &&
      round.process.application.currentStage !== ApplicationStage.REJECTED &&
      !canTransitionApplication(
        round.process.application.currentStage,
        ApplicationStage.REJECTED,
      )
    ) {
      throw new BadRequestException(
        `Không thể từ chối ứng viên từ trạng thái ${round.process.application.currentStage}.`,
      );
    }
    const nextRound = passed
      ? await this.prisma.interviewRound.findFirst({
          where: {
            processId: round.processId,
            order: { gt: round.order },
            status: { not: InterviewRoundStatus.CANCELLED },
          },
          orderBy: { order: 'asc' },
        })
      : null;
    const finalPassStage =
      passed &&
      !nextRound &&
      (round.process.application.currentStage ===
        ApplicationStage.INTERVIEWED ||
        canTransitionApplication(
          round.process.application.currentStage,
          ApplicationStage.INTERVIEWED,
        ))
        ? ApplicationStage.INTERVIEWED
        : round.process.application.currentStage;

    await this.prisma.$transaction(async (prisma) => {
      const decided = await prisma.interviewRound.updateMany({
        where: { id: roundId, status: InterviewRoundStatus.AWAITING_REVIEW },
        data: {
          status: passed
            ? InterviewRoundStatus.PASSED
            : InterviewRoundStatus.FAILED,
          resultScore: dto.score,
          decisionNote,
          decidedByUserId: userId,
          decidedAt: new Date(),
        },
      });
      if (decided.count !== 1) {
        throw new ConflictException(
          'Vòng vừa được người khác xử lý. Vui lòng tải lại.',
        );
      }

      if (passed && nextRound) {
        await prisma.interviewRound.update({
          where: { id: nextRound.id },
          data: { status: InterviewRoundStatus.READY },
        });
        await prisma.interviewProcess.update({
          where: { id: round.processId },
          data: { currentRoundOrder: nextRound.order },
        });
      } else if (passed) {
        await prisma.interviewProcess.update({
          where: { id: round.processId },
          data: {
            status: InterviewProcessStatus.COMPLETED,
            currentRoundOrder: null,
            completedAt: new Date(),
          },
        });
        if (
          round.process.application.currentStage !==
            ApplicationStage.INTERVIEWED &&
          canTransitionApplication(
            round.process.application.currentStage,
            ApplicationStage.INTERVIEWED,
          )
        ) {
          await prisma.application.update({
            where: { id: round.process.applicationId },
            data: {
              currentStage: ApplicationStage.INTERVIEWED,
              hrDecision: hrDecisionForStage(ApplicationStage.INTERVIEWED),
            },
          });
        }
      } else {
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
            id: { not: roundId },
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
        if (
          round.process.application.currentStage !== ApplicationStage.REJECTED
        ) {
          await prisma.application.update({
            where: { id: round.process.applicationId },
            data: {
              currentStage: ApplicationStage.REJECTED,
              hrDecision: hrDecisionForStage(ApplicationStage.REJECTED),
              hrNotes: decisionNote,
            },
          });
        }
      }

      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: round.process.applicationId,
          previousStage: round.process.application.currentStage,
          newStage: !passed
            ? ApplicationStage.REJECTED
            : !nextRound
              ? finalPassStage
              : round.process.application.currentStage,
          changedByUserId: userId,
          note: `${passed ? 'Đạt' : 'Từ chối ứng viên tại'} ${round.title}.${decisionNote ? ` ${decisionNote}` : ''}`,
        },
      });
    });
    return this.findForApplication(userId, round.process.applicationId);
  }

  async retry(userId: string, roundId: string) {
    const round = await this.findOwnedRound(userId, roundId);
    if (
      round.status !== InterviewRoundStatus.AWAITING_REVIEW &&
      round.status !== InterviewRoundStatus.FAILED &&
      round.status !== InterviewRoundStatus.EXPIRED &&
      round.status !== InterviewRoundStatus.NO_SHOW
    ) {
      throw new ConflictException(
        'Chỉ có thể thực hiện lại vòng đang chờ đánh giá hoặc bị gián đoạn.',
      );
    }
    if (
      round.process.application.currentStage === ApplicationStage.REJECTED ||
      round.process.status === InterviewProcessStatus.CANCELLED
    ) {
      throw new ConflictException(
        'Hồ sơ đã bị từ chối. Hãy mở lại hồ sơ trước khi tạo vòng phỏng vấn mới.',
      );
    }
    await this.prisma.$transaction(async (prisma) => {
      await prisma.interviewRound.update({
        where: { id: roundId },
        data: {
          status: InterviewRoundStatus.READY,
          resultScore: null,
          decisionNote: null,
          decidedByUserId: null,
          decidedAt: null,
        },
      });
      await prisma.interviewProcess.update({
        where: { id: round.processId },
        data: {
          status: InterviewProcessStatus.ACTIVE,
          currentRoundOrder: round.order,
          completedAt: null,
        },
      });
      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: round.process.applicationId,
          previousStage: round.process.application.currentStage,
          newStage: round.process.application.currentStage,
          changedByUserId: userId,
          note: `HR yêu cầu thực hiện lại ${round.title}.`,
        },
      });
    });
    return this.findForApplication(userId, round.process.applicationId);
  }

  private async findOwnedProcess(userId: string, processId: string) {
    const scope = await this.accessService.recruiterApplicationWhere(userId);
    const process = await this.prisma.interviewProcess.findFirst({
      where: { id: processId, application: scope },
      include: { application: { select: { id: true, currentStage: true } } },
    });
    if (!process)
      throw new NotFoundException('Không tìm thấy quy trình phỏng vấn.');
    return process;
  }

  private async findOwnedRound(userId: string, roundId: string) {
    const scope = await this.accessService.recruiterApplicationWhere(userId);
    const round = await this.prisma.interviewRound.findFirst({
      where: { id: roundId, process: { application: scope } },
      include: {
        process: {
          include: {
            application: { select: { id: true, currentStage: true } },
          },
        },
      },
    });
    if (!round) throw new NotFoundException('Không tìm thấy vòng phỏng vấn.');
    return round;
  }

  private assertProcessEditable(status: InterviewProcessStatus) {
    if (
      status === InterviewProcessStatus.COMPLETED ||
      status === InterviewProcessStatus.CANCELLED
    ) {
      throw new ConflictException('Quy trình phỏng vấn đã kết thúc.');
    }
  }

  private validateRoundCombination(
    conductedBy: InterviewConductedBy,
    mode: InterviewMode,
  ) {
    if (
      conductedBy === InterviewConductedBy.AI &&
      mode !== InterviewMode.ASYNC_WEB
    ) {
      throw new BadRequestException(
        'Vòng AI phải sử dụng hình thức ASYNC_WEB.',
      );
    }
    if (
      conductedBy === InterviewConductedBy.HUMAN &&
      mode === InterviewMode.ASYNC_WEB
    ) {
      throw new BadRequestException(
        'Vòng với người phỏng vấn không thể dùng ASYNC_WEB.',
      );
    }
  }

  private serialize<T>(value: T): T {
    const parsed: unknown = JSON.parse(
      JSON.stringify(value, (_key: string, item: unknown) =>
        Prisma.Decimal.isDecimal(item) ? Number(item) : item,
      ),
    );
    return parsed as T;
  }
}
