import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseStorageService } from '../../infrastructure/supabase/supabase-storage.service';
import { EntitlementsService } from './entitlements.service';
import { talentPoolVisibilityWhere } from './talent-pool-visibility';

@Injectable()
export class TalentResumeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly storage: SupabaseStorageService,
  ) {}

  async access(
    userId: string,
    candidateId: string,
    mode: 'preview' | 'download',
  ) {
    await this.entitlements.assertTalentPool(userId);
    const profile = await this.prisma.candidateProfile.findFirst({
      where: { id: candidateId, ...talentPoolVisibilityWhere() },
      select: {
        primaryResume: {
          select: {
            id: true,
            candidateId: true,
            parsingStatus: true,
            originalFileName: true,
            objectPath: true,
            storageBucket: true,
            mimeType: true,
          },
        },
      },
    });
    if (!profile)
      throw new NotFoundException(
        'Hồ sơ không còn được chia sẻ trong kho ứng viên.',
      );
    const unlock = await this.prisma.cvUnlock.findUnique({
      where: {
        unlockedByUserId_candidateProfileId: {
          unlockedByUserId: userId,
          candidateProfileId: candidateId,
        },
      },
      select: { id: true },
    });
    if (!unlock)
      throw new ForbiddenException(
        'Vui lòng mở khóa hồ sơ trước khi xem CV gốc.',
      );
    const resume = profile.primaryResume;
    if (!resume || resume.candidateId !== candidateId || !resume.objectPath)
      throw new NotFoundException('Ứng viên chưa có CV gốc khả dụng.');
    if (resume.parsingStatus !== 'PARSED')
      throw new BadRequestException(
        'CV chính chưa xử lý xong. Vui lòng quay lại sau.',
      );
    if (mode === 'preview' && resume.mimeType !== 'application/pdf')
      throw new BadRequestException('CV này chỉ hỗ trợ tải bản gốc.');
    const expiresIn = 60;
    const { signedUrl } = await this.storage.createSignedDownloadUrl(
      resume.objectPath,
      expiresIn,
      {
        bucket: resume.storageBucket,
        ...(mode === 'download'
          ? { download: resume.originalFileName.replace(/[\r\n/\\]/g, '_') }
          : {}),
      },
    );
    // Revalidate after storage I/O: do not return a link for a superseded CV or
    // consent withdrawn while the request was in flight.
    const current = await this.prisma.candidateProfile.findFirst({
      where: {
        id: candidateId,
        primaryResumeId: resume.id,
        ...talentPoolVisibilityWhere(),
      },
      select: { id: true },
    });
    if (!current)
      throw new NotFoundException(
        'Hồ sơ hoặc CV đã thay đổi. Vui lòng tải lại trang.',
      );
    return {
      url: signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      fileName: resume.originalFileName,
      mimeType: resume.mimeType,
    };
  }
}
