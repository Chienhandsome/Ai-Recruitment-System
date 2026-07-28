import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SkillsService {
  private readonly logger = new Logger(SkillsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCategories() {
    let categories = await this.prisma.jobCategory.findMany({
      orderBy: { name: 'asc' },
    });

    if (categories.length === 0) {
      this.logger.log('No job categories found. Seeding default multi-industry categories...');
      const defaultCategories = [
        { name: 'Công nghệ thông tin (IT)', slug: 'it-software' },
        { name: 'Thiết kế & Đồ họa (Design/3D)', slug: 'design-media' },
        { name: 'Kế toán & Tài chính', slug: 'accounting-finance' },
        { name: 'Kinh doanh & Bán hàng (Sales)', slug: 'sales-business' },
        { name: 'Marketing & Truyền thông', slug: 'marketing-pr' },
        { name: 'Nhân sự & Hành chính', slug: 'hr-admin' },
        { name: 'Y tế & Dược phẩm', slug: 'healthcare-pharma' },
        { name: 'Vận tải & Logistics', slug: 'logistics-supplychain' },
      ];

      for (const cat of defaultCategories) {
        await this.prisma.jobCategory.upsert({
          where: { slug: cat.slug },
          update: {},
          create: cat,
        });
      }

      categories = await this.prisma.jobCategory.findMany({
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

    if (search) {
      whereClause.name = { contains: search, mode: 'insensitive' };
    }

    let skills = await this.prisma.skill.findMany({
      where: whereClause,
      include: { category: true },
      orderBy: { name: 'asc' },
      take: 100,
    });

    if (skills.length === 0 && !search) {
      this.logger.log('Seeding initial skill dictionary...');
      const categories = await this.getCategories();
      const itCat = categories.find((c) => c.slug === 'it-software') || categories[0];
      const designCat = categories.find((c) => c.slug === 'design-media') || categories[0];
      const accCat = categories.find((c) => c.slug === 'accounting-finance') || categories[0];

      const initialSkills = [
        { name: 'React.js', normalizedName: 'reactjs', categoryId: itCat.id, type: 'HARD' as const },
        { name: 'TypeScript', normalizedName: 'typescript', categoryId: itCat.id, type: 'HARD' as const },
        { name: 'Node.js', normalizedName: 'nodejs', categoryId: itCat.id, type: 'HARD' as const },
        { name: 'Python', normalizedName: 'python', categoryId: itCat.id, type: 'HARD' as const },
        { name: 'PostgreSQL', normalizedName: 'postgresql', categoryId: itCat.id, type: 'HARD' as const },
        { name: 'Blender 3D', normalizedName: 'blender-3d', categoryId: designCat.id, type: 'HARD' as const },
        { name: 'Photoshop', normalizedName: 'photoshop', categoryId: designCat.id, type: 'HARD' as const },
        { name: 'Figma', normalizedName: 'figma', categoryId: designCat.id, type: 'HARD' as const },
        { name: 'Báo cáo Tài chính', normalizedName: 'financial-report', categoryId: accCat.id, type: 'HARD' as const },
        { name: 'Phần mềm MISA', normalizedName: 'misa-software', categoryId: accCat.id, type: 'HARD' as const },
        { name: 'Giao tiếp & Làm việc nhóm', normalizedName: 'teamwork-communication', categoryId: itCat.id, type: 'SOFT' as const },
        { name: 'Tiếng Anh Giao tiếp', normalizedName: 'english-communication', categoryId: itCat.id, type: 'SOFT' as const },
      ];

      for (const s of initialSkills) {
        await this.prisma.skill.upsert({
          where: { normalizedName: s.normalizedName },
          update: {},
          create: s,
        });
      }

      skills = await this.prisma.skill.findMany({
        where: whereClause,
        include: { category: true },
        orderBy: { name: 'asc' },
        take: 100,
      });
    }

    return skills;
  }

  async createSkill(name: string, categoryId: string) {
    const trimmed = name.trim();
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
      include: { category: true },
    });
  }
}
