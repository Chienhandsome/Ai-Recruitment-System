import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SkillsService {
  private readonly logger = new Logger(SkillsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCategories() {
    let categories = await this.prisma.skillCategory.findMany({
      orderBy: { name: 'asc' },
    });

    if (categories.length === 0) {
      this.logger.log('No skill categories found. Seeding default skill categories...');
      const defaultCategories = [
        'Công nghệ thông tin (IT & Software)',
        'Thiết kế, 3D & Truyền thông (Design & Media)',
        'Kế toán, Tài chính & Ngân hàng',
        'Kinh doanh, Bán hàng & CSKH (Sales)',
        'Marketing, SEO & Quảng cáo Digital',
        'Nhân sự, Pháp lý & Hành chính (HR & Legal)',
        'Y tế, Dược phẩm & Chăm sóc sức khỏe',
        'Vận tải, Kho vận & Logistics',
        'Xây dựng, Kiến trúc & Kỹ thuật',
        'Kỹ năng mềm & Quản trị (Soft Skills)',
      ];

      for (const name of defaultCategories) {
        await this.prisma.skillCategory.create({
          data: { name },
        });
      }

      categories = await this.prisma.skillCategory.findMany({
        orderBy: { name: 'asc' },
      });
    }

    return categories;
  }

  async getSkills(categoryId?: string, search?: string) {
    const whereClause: any = { status: 'ACTIVE' };

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { skillAliases: { some: { aliasName: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const skills = await this.prisma.skill.findMany({
      where: whereClause,
      include: {
        category: true,
        skillAliases: true,
      },
      orderBy: { name: 'asc' },
      take: 150,
    });

    return skills;
  }

  async createSkill(name: string, categoryId: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestException('Tên kỹ năng không được để trống');
    }

    const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const existing = await this.prisma.skill.findFirst({
      where: {
        OR: [
          { normalizedName: normalized },
          { name: { equals: trimmed, mode: 'insensitive' } },
        ],
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.skill.create({
      data: {
        name: trimmed,
        normalizedName: normalized,
        categoryId,
        type: 'HARD',
        status: 'ACTIVE',
      },
      include: {
        category: true,
        skillAliases: true,
      },
    });
  }

  async updateSkill(id: string, name?: string, categoryId?: string, type?: 'HARD' | 'SOFT') {
    const skill = await this.prisma.skill.findUnique({ where: { id } });
    if (!skill) {
      throw new NotFoundException('Không tìm thấy kỹ năng');
    }

    const data: any = {};
    if (name && name.trim()) {
      const trimmed = name.trim();
      data.name = trimmed;
      data.normalizedName = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    if (categoryId) {
      data.categoryId = categoryId;
    }
    if (type) {
      data.type = type;
    }

    return this.prisma.skill.update({
      where: { id },
      data,
      include: {
        category: true,
        skillAliases: true,
      },
    });
  }

  async addSkillAlias(skillId: string, aliasName: string) {
    const trimmed = aliasName.trim();
    if (!trimmed) {
      throw new BadRequestException('Alias name cannot be empty');
    }

    const skill = await this.prisma.skill.findUnique({ where: { id: skillId } });
    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    const existing = await this.prisma.skillAlias.findFirst({
      where: { aliasName: { equals: trimmed, mode: 'insensitive' } },
    });

    if (existing) {
      if (existing.skillId === skillId) {
        return existing;
      }
      throw new BadRequestException(`Alias "${trimmed}" đã thuộc về kỹ năng khác`);
    }

    return this.prisma.skillAlias.create({
      data: {
        aliasName: trimmed,
        skillId,
      },
    });
  }

  async deleteSkillAlias(aliasId: string) {
    const existing = await this.prisma.skillAlias.findUnique({ where: { id: aliasId } });
    if (!existing) {
      throw new NotFoundException('Alias not found');
    }

    return this.prisma.skillAlias.delete({
      where: { id: aliasId },
    });
  }

  // --- UNRECOGNIZED SKILLS MANAGEMENT FOR ADMIN ---

  async getUnrecognizedSkills() {
    return this.prisma.unrecognizedSkill.findMany({
      where: { status: 'PENDING' },
      orderBy: { frequency: 'desc' },
    });
  }

  async mapUnrecognizedSkill(unrecognizedId: string, targetSkillId: string) {
    const unrecognized = await this.prisma.unrecognizedSkill.findUnique({
      where: { id: unrecognizedId },
    });

    if (!unrecognized) {
      throw new NotFoundException('Unrecognized skill not found');
    }

    const skill = await this.prisma.skill.findUnique({
      where: { id: targetSkillId },
    });

    if (!skill) {
      throw new NotFoundException('Target skill not found');
    }

    // Add alias if not existing
    const aliasName = unrecognized.rawSkillName.trim();
    const existingAlias = await this.prisma.skillAlias.findFirst({
      where: { aliasName: { equals: aliasName, mode: 'insensitive' } },
    });

    if (!existingAlias) {
      await this.prisma.skillAlias.create({
        data: {
          aliasName: aliasName,
          skillId: targetSkillId,
        },
      });
    }

    return this.prisma.unrecognizedSkill.update({
      where: { id: unrecognizedId },
      data: { status: 'MERGED' },
    });
  }

  async approveUnrecognizedSkill(unrecognizedId: string, categoryId: string) {
    const unrecognized = await this.prisma.unrecognizedSkill.findUnique({
      where: { id: unrecognizedId },
    });

    if (!unrecognized) {
      throw new NotFoundException('Unrecognized skill not found');
    }

    const createdSkill = await this.createSkill(unrecognized.rawSkillName, categoryId);

    await this.prisma.unrecognizedSkill.update({
      where: { id: unrecognizedId },
      data: { status: 'APPROVED' },
    });

    return createdSkill;
  }

  async rejectUnrecognizedSkill(unrecognizedId: string) {
    return this.prisma.unrecognizedSkill.update({
      where: { id: unrecognizedId },
      data: { status: 'REJECTED' },
    });
  }
}
