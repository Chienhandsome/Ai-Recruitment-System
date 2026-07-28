import 'dotenv/config';
import { PrismaClient, SkillType, SkillStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding comprehensive multi-industry Skills & Aliases...');

  const categories = [
    { name: 'Công nghệ thông tin (IT & Software)' },
    { name: 'Thiết kế, 3D & Truyền thông (Design & Media)' },
    { name: 'Kế toán, Tài chính & Ngân hàng' },
    { name: 'Kinh doanh, Bán hàng & CSKH (Sales)' },
    { name: 'Marketing, SEO & Quảng cáo Digital' },
    { name: 'Nhân sự, Pháp lý & Hành chính (HR & Legal)' },
    { name: 'Y tế, Dược phẩm & Chăm sóc sức khỏe' },
    { name: 'Vận tải, Kho vận & Logistics' },
    { name: 'Xây dựng, Kiến trúc & Kỹ thuật' },
    { name: 'Kỹ năng mềm & Quản trị (Soft Skills)' },
  ];

  const catMap = new Map<string, string>();
  for (const c of categories) {
    const existing = await prisma.skillCategory.findFirst({ where: { name: c.name } });
    if (existing) {
      catMap.set(c.name, existing.id);
    } else {
      const created = await prisma.skillCategory.create({ data: { name: c.name } });
      catMap.set(c.name, created.id);
    }
  }

  const itCat = catMap.get('Công nghệ thông tin (IT & Software)')!;
  const designCat = catMap.get('Thiết kế, 3D & Truyền thông (Design & Media)')!;
  const finCat = catMap.get('Kế toán, Tài chính & Ngân hàng')!;
  const salesCat = catMap.get('Kinh doanh, Bán hàng & CSKH (Sales)')!;
  const mktCat = catMap.get('Marketing, SEO & Quảng cáo Digital')!;
  const hrCat = catMap.get('Nhân sự, Pháp lý & Hành chính (HR & Legal)')!;
  const healthCat = catMap.get('Y tế, Dược phẩm & Chăm sóc sức khỏe')!;
  const logCat = catMap.get('Vận tải, Kho vận & Logistics')!;
  const constrCat = catMap.get('Xây dựng, Kiến trúc & Kỹ thuật')!;
  const softCat = catMap.get('Kỹ năng mềm & Quản trị (Soft Skills)')!;

  const broadSkills = [
    // 1. IT & Software
    { name: 'React.js & Next.js', normalizedName: 'react-nextjs', categoryId: itCat, type: SkillType.HARD, aliases: ['React', 'Next.js', 'NextJS App Router', 'ReactJS'] },
    { name: 'Node.js & NestJS', normalizedName: 'node-nestjs', categoryId: itCat, type: SkillType.HARD, aliases: ['NodeJS', 'NestJS', 'Express.js'] },
    { name: 'Python & Django/FastAPI', normalizedName: 'python-backend', categoryId: itCat, type: SkillType.HARD, aliases: ['Python', 'FastAPI', 'Django'] },
    { name: 'Java & Spring Boot', normalizedName: 'java-springboot', categoryId: itCat, type: SkillType.HARD, aliases: ['Java', 'Spring Boot 3', 'Spring Framework'] },
    { name: 'Docker & Kubernetes (DevOps)', normalizedName: 'docker-k8s-devops', categoryId: itCat, type: SkillType.HARD, aliases: ['Docker', 'K8s', 'Kubernetes', 'CI/CD'] },
    { name: 'AI, Machine Learning & LLM', normalizedName: 'ai-ml-llm', categoryId: itCat, type: SkillType.HARD, aliases: ['PyTorch', 'TensorFlow', 'LangChain', 'Prompt Engineering'] },
    { name: 'C# & .NET Core', normalizedName: 'dotnet-csharp', categoryId: itCat, type: SkillType.HARD, aliases: ['C#', '.NET Core', 'ASP.NET'] },
    { name: 'Flutter & React Native', normalizedName: 'mobile-crossplatform', categoryId: itCat, type: SkillType.HARD, aliases: ['Flutter', 'React Native', 'Mobile App'] },

    // 2. Design & Media
    { name: 'Figma & UI/UX Design', normalizedName: 'figma-uiux-design', categoryId: designCat, type: SkillType.HARD, aliases: ['Figma', 'UI Design', 'UX Research', 'Wireframing'] },
    { name: 'Adobe Photoshop & Illustrator', normalizedName: 'adobe-ps-ai', categoryId: designCat, type: SkillType.HARD, aliases: ['Photoshop', 'Illustrator', 'Graphic Design'] },
    { name: 'Blender 3D & Maya', normalizedName: 'blender-3d-maya', categoryId: designCat, type: SkillType.HARD, aliases: ['Blender', '3D Modeling', 'Maya 3D'] },
    { name: 'Dựng phim Adobe Premiere & After Effects', normalizedName: 'video-editing-pr-ae', categoryId: designCat, type: SkillType.HARD, aliases: ['Premiere Pro', 'After Effects', 'Video Editing'] },

    // 3. Finance & Accounting
    { name: 'Lập Báo cáo Tài chính & BCTC', normalizedName: 'financial-reporting-bctc', categoryId: finCat, type: SkillType.HARD, aliases: ['BCTC', 'Báo cáo tài chính', 'Financial Statements'] },
    { name: 'Phần mềm Kế toán MISA & SAP', normalizedName: 'accounting-misa-sap', categoryId: finCat, type: SkillType.HARD, aliases: ['MISA', 'SAP ERP', 'MISA AMIS'] },
    { name: 'Kế toán Thuế & Quản trị Thuế', normalizedName: 'tax-accounting', categoryId: finCat, type: SkillType.HARD, aliases: ['Kê khai thuế', 'Quyết toán thuế', 'Kế toán thuế'] },
    { name: 'Phân tích Đầu tư & Tài chính doanh nghiệp', normalizedName: 'corporate-finance-analysis', categoryId: finCat, type: SkillType.HARD, aliases: ['Financial Analysis', 'Thẩm định dự án'] },

    // 4. Sales & CSKH
    { name: 'Bán hàng B2B & Chốt hợp đồng', normalizedName: 'b2b-sales-closing', categoryId: salesCat, type: SkillType.HARD, aliases: ['B2B Sales', 'Chốt hợp đồng', 'Kinh doanh B2B'] },
    { name: 'Quản lý quan hệ khách hàng (CRM)', normalizedName: 'crm-management', categoryId: salesCat, type: SkillType.HARD, aliases: ['HubSpot CRM', 'Salesforce', 'Zendesk'] },
    { name: 'Tư vấn Bán hàng & Tele-sales', normalizedName: 'telesales-consulting', categoryId: salesCat, type: SkillType.HARD, aliases: ['Telesales', 'Tư vấn sản phẩm'] },

    // 5. Marketing & Digital
    { name: 'SEO Google & Optimizing Content', normalizedName: 'seo-google-content', categoryId: mktCat, type: SkillType.HARD, aliases: ['SEO', 'SEO Onpage', 'Google Search Console'] },
    { name: 'Chạy Quảng cáo Facebook & TikTok Ads', normalizedName: 'fb-tiktok-ads', categoryId: mktCat, type: SkillType.HARD, aliases: ['Facebook Ads', 'TikTok Ads', 'Meta Ads'] },
    { name: 'Sáng tạo Nội dung & Copywriting', normalizedName: 'content-copywriting', categoryId: mktCat, type: SkillType.HARD, aliases: ['Copywriting', 'Content Creator', 'Kịch bản Video'] },

    // 6. HR & Legal
    { name: 'Tuyển dụng & Sàng lọc CV (Talent Acquisition)', normalizedName: 'talent-acquisition-hr', categoryId: hrCat, type: SkillType.HARD, aliases: ['Recruitment', 'Headhunting', 'Sàng lọc CV'] },
    { name: 'Quản trị C&B (Lương & Thưởng)', normalizedName: 'compensation-benefits-cb', categoryId: hrCat, type: SkillType.HARD, aliases: ['C&B', 'Tính lương', 'Bảo hiểm xã hội BHXH'] },
    { name: 'Luật Lao động & Tư vấn Pháp lý', normalizedName: 'labor-law-legal', categoryId: hrCat, type: SkillType.HARD, aliases: ['Luật lao động', 'Hợp đồng lao động'] },

    // 7. Healthcare & Pharma
    { name: 'Trình dược viên & Tư vấn Dược phẩm', normalizedName: 'pharma-sales-consultant', categoryId: healthCat, type: SkillType.HARD, aliases: ['Trình dược viên', 'Dược phẩm', 'Tư vấn thuốc'] },
    { name: 'Chăm sóc Bệnh nhân & Điều dưỡng', normalizedName: 'nursing-patient-care', categoryId: healthCat, type: SkillType.HARD, aliases: ['Điều dưỡng', 'Chăm sóc sức khỏe'] },

    // 8. Logistics & Supply Chain
    { name: 'Quản lý Kho vận & Tồn kho (Warehouse)', normalizedName: 'warehouse-inventory-mgmt', categoryId: logCat, type: SkillType.HARD, aliases: ['Quản lý kho', 'WMS', 'Kiểm kê kho'] },
    { name: 'Xuất nhập khẩu & Thủ tục Hải quan', normalizedName: 'import-export-customs', categoryId: logCat, type: SkillType.HARD, aliases: ['XNK', 'Khai báo hải quan', 'Logistics Forwarding'] },

    // 9. Construction & Architecture
    { name: 'Vẽ kỹ thuật AutoCAD & Revit', normalizedName: 'autocad-revit-drawing', categoryId: constrCat, type: SkillType.HARD, aliases: ['AutoCAD', 'Revit', 'BIM Design'] },
    { name: 'Giám sát Thi công & Quản lý Công trình', normalizedName: 'site-construction-supervision', categoryId: constrCat, type: SkillType.HARD, aliases: ['Giám sát thi công', 'Chỉ huy trưởng công trình'] },

    // 10. Soft Skills & Management
    { name: 'Giao tiếp & Làm việc nhóm hiệu quả', normalizedName: 'communication-teamwork', categoryId: softCat, type: SkillType.SOFT, aliases: ['Teamwork', 'Làm việc nhóm', 'Giao tiếp'] },
    { name: 'Kỹ năng Lãnh đạo & Quản lý Đội ngũ', normalizedName: 'leadership-team-management', categoryId: softCat, type: SkillType.SOFT, aliases: ['Leadership', 'Quản lý nhóm', 'People Management'] },
    { name: 'Giải quyết vấn đề & Tư duy Logic', normalizedName: 'problem-solving-logic', categoryId: softCat, type: SkillType.SOFT, aliases: ['Problem Solving', 'Tư duy phản biện'] },
    { name: 'Tiếng Anh Giao tiếp & Thương mại', normalizedName: 'business-english', categoryId: softCat, type: SkillType.SOFT, aliases: ['English Communication', 'Tiếng Anh văn phòng', 'TOEIC/IELTS'] },
  ];

  let addedCount = 0;
  for (const s of broadSkills) {
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
    addedCount++;
  }

  console.log(`\n===================================`);
  console.log(`SEED COMPLETED: ${addedCount} đa dạng kỹ năng và hàng trăm Aliases đã được lưu vào CSDL!`);
  console.log(`===================================\n`);
}

main()
  .catch((e) => {
    console.error('Error seeding broad skills:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
