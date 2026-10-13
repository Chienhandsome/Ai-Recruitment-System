import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdatePolicyDto } from './dto/update-policy.dto';

@Injectable()
export class PoliciesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllPublished() {
    return this.prisma.systemPolicy.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAllForAdmin() {
    return this.prisma.systemPolicy.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getByCode(code: string) {
    const policy = await this.prisma.systemPolicy.findUnique({
      where: { code },
    });
    if (!policy) {
      throw new NotFoundException(`Không tìm thấy chính sách có mã ${code}`);
    }
    return policy;
  }

  async updatePolicy(adminUserId: string, code: string, dto: UpdatePolicyDto) {
    const existing = await this.getByCode(code);
    return this.prisma.systemPolicy.update({
      where: { code },
      data: {
        title: dto.title,
        description: dto.description,
        content: dto.content,
        isPublished: dto.isPublished ?? existing.isPublished,
        version: existing.version + 1,
        updatedByUserId: adminUserId,
      },
    });
  }
}
