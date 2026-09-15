import {
  Body,
  Controller,
  Get,
  Delete,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InterviewsService } from './interviews.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { SubmitInterviewFeedbackDto } from './dto/submit-interview-feedback.dto';
import { QueryInterviewsDto } from './dto/query-interviews.dto';
import { CandidateResponseInterviewDto } from './dto/candidate-response-interview.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Public } from '../auth/decorators/public.decorator';
import { AiInterviewsService } from './ai-interviews.service';
import { CreateAiInterviewDto } from './dto/create-ai-interview.dto';
import { InterviewProcessService } from './interview-process.service';
import { CreateInterviewProcessDto } from './dto/create-interview-process.dto';
import { CreateInterviewRoundDto } from './dto/create-interview-round.dto';
import { UpdateInterviewRoundDto } from './dto/update-interview-round.dto';
import { ReorderInterviewRoundsDto } from './dto/reorder-interview-rounds.dto';
import { DecideInterviewRoundDto } from './dto/decide-interview-round.dto';

@ApiTags('Interviews')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('interviews')
export class InterviewsController {
  constructor(
    private readonly interviewsService: InterviewsService,
    private readonly aiInterviewsService: AiInterviewsService,
    private readonly interviewProcessService: InterviewProcessService,
  ) {}

  @Post('processes')
  @Roles('RECRUITER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo kế hoạch phỏng vấn nhiều vòng' })
  createProcess(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInterviewProcessDto,
  ) {
    return this.interviewProcessService.create(user.id, dto);
  }

  @Get('processes/application/:applicationId')
  @Roles('RECRUITER')
  @ApiOperation({ summary: 'Lấy kế hoạch phỏng vấn của ứng viên' })
  findProcessForApplication(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    return this.interviewProcessService.findForApplication(
      user.id,
      applicationId,
    );
  }

  @Post('processes/:processId/rounds')
  @Roles('RECRUITER')
  @HttpCode(HttpStatus.CREATED)
  addRound(
    @CurrentUser() user: AuthenticatedUser,
    @Param('processId', ParseUUIDPipe) processId: string,
    @Body() dto: CreateInterviewRoundDto,
  ) {
    return this.interviewProcessService.addRound(user.id, processId, dto);
  }

  @Patch('processes/:processId/rounds/reorder')
  @Roles('RECRUITER')
  reorderRounds(
    @CurrentUser() user: AuthenticatedUser,
    @Param('processId', ParseUUIDPipe) processId: string,
    @Body() dto: ReorderInterviewRoundsDto,
  ) {
    return this.interviewProcessService.reorder(user.id, processId, dto);
  }

  @Post('processes/:processId/activate')
  @Roles('RECRUITER')
  activateProcess(
    @CurrentUser() user: AuthenticatedUser,
    @Param('processId', ParseUUIDPipe) processId: string,
  ) {
    return this.interviewProcessService.activate(user.id, processId);
  }

  @Patch('rounds/:roundId')
  @Roles('RECRUITER')
  updateRound(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roundId', ParseUUIDPipe) roundId: string,
    @Body() dto: UpdateInterviewRoundDto,
  ) {
    return this.interviewProcessService.updateRound(user.id, roundId, dto);
  }

  @Delete('rounds/:roundId')
  @Roles('RECRUITER')
  removeRound(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roundId', ParseUUIDPipe) roundId: string,
  ) {
    return this.interviewProcessService.removeRound(user.id, roundId);
  }

  @Post('rounds/:roundId/decision')
  @Roles('RECRUITER')
  decideRound(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roundId', ParseUUIDPipe) roundId: string,
    @Body() dto: DecideInterviewRoundDto,
  ) {
    return this.interviewProcessService.decide(user.id, roundId, dto);
  }

  @Post('rounds/:roundId/retry')
  @Roles('RECRUITER')
  retryRound(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roundId', ParseUUIDPipe) roundId: string,
  ) {
    return this.interviewProcessService.retry(user.id, roundId);
  }

  @Post('ai')
  @Roles('RECRUITER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo cuộc phỏng vấn online với AI' })
  async createAiInterview(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAiInterviewDto,
  ) {
    return this.aiInterviewsService.create(user.id, dto);
  }

  @Post('ai/callback')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Nhận callback có chữ ký từ Interview Service' })
  async receiveAiInterviewCallback(
    @Req() request: RawBodyRequest<Request>,
    @Body() body: unknown,
    @Headers('x-interview-event-id') eventId?: string,
    @Headers('x-interview-timestamp') timestamp?: string,
    @Headers('x-interview-signature') signature?: string,
  ) {
    return this.aiInterviewsService.receiveCallback(
      request.rawBody,
      {
        eventId,
        timestamp,
        signature,
      },
      body,
    );
  }

  @Get('ai/application/:applicationId')
  @Roles('RECRUITER')
  @ApiOperation({ summary: 'Lấy các cuộc phỏng vấn AI của một đơn ứng tuyển' })
  async findAiInterviewsForApplication(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    return this.aiInterviewsService.findForApplication(user.id, applicationId);
  }

  @Get('ai/:id')
  @Roles('RECRUITER')
  @ApiOperation({ summary: 'Lấy kết quả phỏng vấn AI dành cho HR' })
  async findAiInterview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.aiInterviewsService.findOne(user.id, id);
  }

  @Get('ai/:id/videos/:videoId')
  @Roles('RECRUITER')
  @ApiOperation({ summary: 'Tải hoặc phát video phỏng vấn AI qua proxy bảo mật' })
  async downloadAiInterviewVideo(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Query('inline') inline: string | undefined,
    @Res() response: Response,
  ) {
    const isInline = inline === 'true' || inline === '1';
    const video = await this.aiInterviewsService.downloadVideo(
      user.id,
      id,
      videoId,
      isInline,
    );
    response.setHeader('Content-Type', video.contentType);
    response.setHeader('Content-Disposition', video.contentDisposition);
    response.setHeader('Accept-Ranges', 'bytes');
    response.setHeader('Cache-Control', 'private, no-store');
    response.send(video.body);
  }

  @Post('ai/:id/decision')
  @Roles('RECRUITER')
  @ApiOperation({ summary: 'Đánh giá và quyết định vòng phỏng vấn AI' })
  async decideAiInterview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecideInterviewRoundDto,
  ) {
    return this.aiInterviewsService.decideSession(user.id, id, dto);
  }

  @Post()
  @Roles('RECRUITER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Lên lịch phỏng vấn mới cho ứng viên' })
  @ApiResponse({
    status: 201,
    description: 'Lịch phỏng vấn đã được tạo thành công.',
  })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInterviewDto,
  ) {
    return this.interviewsService.create(user.id, dto);
  }

  @Get()
  @Roles('RECRUITER')
  @ApiOperation({
    summary: 'Lấy danh sách các buổi phỏng vấn thuộc công ty của Recruiter',
  })
  async findAllForRecruiter(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryInterviewsDto,
  ) {
    return this.interviewsService.findAllForRecruiter(user.id, query);
  }

  @Get('my')
  @Roles('CANDIDATE')
  @ApiOperation({
    summary: 'Lấy danh sách các buổi phỏng vấn của ứng viên đang đăng nhập',
  })
  async findMineForCandidate(@CurrentUser() user: AuthenticatedUser) {
    return this.interviewsService.findMineForCandidate(user.id);
  }

  @Get(':id')
  @Roles('RECRUITER', 'CANDIDATE')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một buổi phỏng vấn' })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.interviewsService.findOne(user.id, id);
  }

  @Patch(':id')
  @Roles('RECRUITER')
  @ApiOperation({ summary: 'Cập nhật thông tin hoặc đổi lịch phỏng vấn' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInterviewDto,
  ) {
    return this.interviewsService.update(user.id, id, dto);
  }

  @Post(':id/feedback')
  @Roles('RECRUITER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chấm điểm và gửi nhận xét đánh giá sau phỏng vấn' })
  async submitFeedback(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitInterviewFeedbackDto,
  ) {
    return this.interviewsService.submitFeedback(user.id, id, dto);
  }

  @Patch(':id/candidate-response')
  @Roles('CANDIDATE')
  @ApiOperation({
    summary: 'Ứng viên xác nhận, xin dời lịch hoặc từ chối phỏng vấn',
  })
  async respondToInterview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CandidateResponseInterviewDto,
  ) {
    return this.interviewsService.respondToInterview(user.id, id, dto);
  }
}
