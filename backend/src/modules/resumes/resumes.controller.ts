import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ResumesService } from './resumes.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@ApiTags('Resumes')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('resumes')
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  @ApiOperation({ summary: 'Upload a resume (PDF or DOCX, max 5MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Resume uploaded, analysis queued' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  async uploadResume(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required.');
    }

    return this.resumesService.uploadResume(user.id, {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get resume parsing status' })
  @ApiResponse({ status: 200, description: 'Resume status returned' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  async getResumeStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) resumeId: string,
  ) {
    return this.resumesService.getResumeStatus(user.id, resumeId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all resumes for the current candidate' })
  @ApiResponse({ status: 200, description: 'List of resumes' })
  async getMyResumes(@CurrentUser() user: AuthenticatedUser) {
    return this.resumesService.getMyResumes(user.id);
  }
}
