import 'dotenv/config';
import { PrismaClient, SkillType, SkillStatus, UnrecognizedSkillStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding 10 Skills & Aliases and 10 Unrecognized Skills...');

  // 1. Ensure SkillCategories exist
  const categoriesData = [
    'Frontend & Web Development',
    'Backend & Cloud Infrastructure',
    'AI & Data Science',
    'Marketing & Media',
    'Tài chính & Nhân sự',
  ];

  const catMap = new Map<string, string>();
  for (const name of categoriesData) {
    const existing = await prisma.skillCategory.findFirst({ where: { name } });
    if (existing) {
      catMap.set(name, existing.id);
    } else {
      const created = await prisma.skillCategory.create({ data: { name } });
      catMap.set(name, created.id);
    }
  }

  const webCatId = catMap.get('Frontend & Web Development')!;
  const backendCatId = catMap.get('Backend & Cloud Infrastructure')!;
  const aiCatId = catMap.get('AI & Data Science')!;
  const mktCatId = catMap.get('Marketing & Media')!;
  const bizCatId = catMap.get('Tài chính & Nhân sự')!;

  // 2. Seed 10 Standard Skills with Aliases
  const tenSkills = [
    { name: 'Next.js', normalizedName: 'nextjs', categoryId: webCatId, type: SkillType.HARD, aliases: ['Next14', 'Next15', 'Next.js App Router'] },
    { name: 'NestJS', normalizedName: 'nestjs', categoryId: backendCatId, type: SkillType.HARD, aliases: ['Nest.js', 'Nest Framework'] },
    { name: 'Docker & Kubernetes', normalizedName: 'docker-k8s', categoryId: backendCatId, type: SkillType.HARD, aliases: ['Docker Container', 'K8s', 'Kubernetes'] },
    { name: 'Tailwind CSS', normalizedName: 'tailwindcss', categoryId: webCatId, type: SkillType.HARD, aliases: ['Tailwind', 'TailwindCSS v3', 'TailwindCSS v4'] },
    { name: 'Figma UI/UX', normalizedName: 'figma-uiux', categoryId: webCatId, type: SkillType.HARD, aliases: ['Figma Design', 'Figma Prototyping'] },
    { name: 'PyTorch & TensorFlow', normalizedName: 'pytorch-tf', categoryId: aiCatId, type: SkillType.HARD, aliases: ['PyTorch', 'TensorFlow', 'Deep Learning'] },
    { name: 'SEO & Content Marketing', normalizedName: 'seo-content', categoryId: mktCatId, type: SkillType.HARD, aliases: ['SEO Optimization', 'Google SEO'] },
    { name: 'Báo cáo Tài chính', normalizedName: 'financial-reporting', categoryId: bizCatId, type: SkillType.HARD, aliases: ['BCTC', 'Lập báo cáo tài chính'] },
    { name: 'Tuyển dụng & Sàng lọc CV', normalizedName: 'talent-acquisition', categoryId: bizCatId, type: SkillType.HARD, aliases: ['Talent Sourcing', 'Headhunting', 'Recruitment'] },
    { name: 'Kỹ năng Đàm phán & Thương lượng', normalizedName: 'negotiation-skill', categoryId: bizCatId, type: SkillType.SOFT, aliases: ['Negotiation', 'Thương lượng hợp đồng'] },
  ];

  for (const s of tenSkills) {
    const skillRecord = await prisma.skill.upsert({
      where: { normalizedName: s.normalizedName },
      update: {
        name: s.name,
        categoryId: s.categoryId,
        type: s.type,
        status: SkillStatus.ACTIVE,
      },
      create: {
        name: s.name,
        normalizedName: s.normalizedName,
        categoryId: s.categoryId,
        type: s.type,
        status: SkillStatus.ACTIVE,
      },
    });

    // Seed Aliases
    for (const aliasName of s.aliases) {
      await prisma.skillAlias.upsert({
        where: { aliasName },
        update: { skillId: skillRecord.id },
        create: {
          aliasName,
          skillId: skillRecord.id,
        },
      });
    }
  }
  console.log(`Successfully seeded 10 standard skills and their aliases.`);

  // 3. Seed 10 Pending Unrecognized Skills for Admin Review Testing
  const tenUnrecognized = [
    { rawSkillName: 'Spring Boot 3', frequency: 18 },
    { rawSkillName: 'Zustand State Management', frequency: 12 },
    { rawSkillName: 'GraphQL & Apollo', frequency: 10 },
    { rawSkillName: 'Kafka Event Streaming', frequency: 8 },
    { rawSkillName: 'Prisma ORM', frequency: 15 },
    { rawSkillName: 'TikTok Ads Optimization', frequency: 7 },
    { rawSkillName: 'Canva Pro Design', frequency: 5 },
    { rawSkillName: 'Phần mềm MISA AMIS', frequency: 6 },
    { rawSkillName: 'Kỹ năng Prompt Engineering AI', frequency: 22 },
    { rawSkillName: 'LangChain & LlamaIndex', frequency: 14 },
  ];

  for (const item of tenUnrecognized) {
    const existing = await prisma.unrecognizedSkill.findFirst({
      where: { rawSkillName: item.rawSkillName },
    });

    if (!existing) {
      await prisma.unrecognizedSkill.create({
        data: {
          rawSkillName: item.rawSkillName,
          frequency: item.frequency,
          status: UnrecognizedSkillStatus.PENDING,
        },
      });
    }
  }
  console.log(`Successfully seeded 10 unrecognized skills for Admin testing.`);

  console.log('\n===================================');
  console.log('SEED DATA COMPLETE: 10 Standard Skills & 10 Unrecognized Skills inserted into Database!');
  console.log('===================================\n');
}

main()
  .catch((e) => {
    console.error('Error seeding 10 skills:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
