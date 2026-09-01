import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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

@ApiTags('Interviews')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

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
  @ApiOperation({ summary: 'Lấy danh sách các buổi phỏng vấn thuộc công ty của Recruiter' })
  async findAllForRecruiter(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryInterviewsDto,
  ) {
    return this.interviewsService.findAllForRecruiter(user.id, query);
  }

  @Get('my')
  @Roles('CANDIDATE')
  @ApiOperation({ summary: 'Lấy danh sách các buổi phỏng vấn của ứng viên đang đăng nhập' })
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
  @ApiOperation({ summary: 'Ứng viên xác nhận, xin dời lịch hoặc từ chối phỏng vấn' })
  async respondToInterview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CandidateResponseInterviewDto,
  ) {
    return this.interviewsService.respondToInterview(user.id, id, dto);
  }
}
