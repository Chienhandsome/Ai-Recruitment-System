import 'dotenv/config';
import { PrismaClient, JobStatus, EmploymentType, ExperienceLevel, SkillRequirementType, ProficiencyLevel, MatchLevel, ApplicationStage, ApplicationProcessingStatus } from '@prisma/client';
import { createSupabaseAdminClient } from '../src/infrastructure/supabase/supabase-admin-client';

const prisma = new PrismaClient();

async function main() {
  console.log('================================================================================');
  console.log('       🔥 THỰC THI BỘ ADVERSARIAL BENCHMARK ĐA CHIỀU (5 ỨNG VIÊN THỬ THÁCH)');
  console.log('================================================================================\n');

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY?.trim() ?? process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required.');
  }

  const supabase = createSupabaseAdminClient(supabaseUrl, supabaseSecretKey);

  // 1. Tạo Tài khoản HR
  const hrEmail = 'hr_performance@recruitment.com';
  const hrPassword = 'Password123@';

  const { data: userList } = await supabase.auth.admin.listUsers();
  let hrAuthId = userList?.users?.find((u) => u.email === hrEmail)?.id;

  if (!hrAuthId) {
    const { data: newHr } = await supabase.auth.admin.createUser({
      email: hrEmail,
      password: hrPassword,
      email_confirm: true,
      user_metadata: { full_name: 'L’Aura Talent Acquisition Team' },
    });
    hrAuthId = newHr.user!.id;
  }

  const recruiterRole = await prisma.role.upsert({
    where: { code: 'RECRUITER' },
    update: {},
    create: { code: 'RECRUITER', name: 'Recruiter', description: 'Nhà tuyển dụng' },
  });

  const candidateRole = await prisma.role.upsert({
    where: { code: 'CANDIDATE' },
    update: {},
    create: { code: 'CANDIDATE', name: 'Candidate', description: 'Ứng viên' },
  });

  const hrUser = await prisma.user.upsert({
    where: { id: hrAuthId },
    update: { fullName: 'L’Aura Talent Acquisition Team' },
    create: { id: hrAuthId, email: hrEmail, fullName: 'L’Aura Talent Acquisition Team' },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: hrUser.id, roleId: recruiterRole.id } },
    update: {},
    create: { userId: hrUser.id, roleId: recruiterRole.id },
  });

  const company = await prisma.company.upsert({
    where: { code: 'LAURA-COSMETICS' },
    update: {},
    create: {
      name: 'L’Aura Cosmetics & Wellness Vietnam',
      code: 'LAURA-COSMETICS',
      website: 'https://lauracosmetics.vn',
      description: 'Thương hiệu Bán lẻ D2C Chăm sóc Sức khỏe & Sắc đẹp Cao cấp',
    },
  });

  const dept = await prisma.department.upsert({
    where: { code: 'GROWTH-MKT' },
    update: {},
    create: {
      name: 'Phòng Tiếp thị & Tăng trưởng Số (Growth Marketing)',
      code: 'GROWTH-MKT',
      companyId: company.id,
    },
  });

  const recruiterProfile = await prisma.recruiterProfile.upsert({
    where: { userId: hrUser.id },
    update: { companyId: company.id, departmentId: dept.id },
    create: {
      userId: hrUser.id,
      companyId: company.id,
      departmentId: dept.id,
      title: 'Head of People & Culture',
    },
  });

  // 2. Tạo Bài Tuyển Dụng (Job Description)
  console.log('📄 1. Đang khởi tạo JD: Performance Marketing Manager (E-commerce & D2C)...');

  const mktCategory = await prisma.skillCategory.upsert({
    where: { name: 'Marketing & Truyền thông' },
    update: {},
    create: { name: 'Marketing & Truyền thông' },
  });

  const jdSkillsData = [
    { name: 'Quản trị Paid Media E-commerce (Meta Ads & Google PMax)', norm: 'paid media ecommerce meta google pmax', man: true, lvl: ProficiencyLevel.EXPERT },
    { name: 'Tối ưu Phễu Chuyển đổi & Đơn vị Kinh tế E-com (ROAS, CAC, MER)', norm: 'unit economics ecommerce roas cac mer', man: true, lvl: ProficiencyLevel.ADVANCED },
    { name: 'Hạ tầng Tracking Chuyên sâu (GTM Server-Side, GA4, Meta CAPI)', norm: 'tracking gtm server side ga4 meta capi', man: true, lvl: ProficiencyLevel.ADVANCED },
    { name: 'Tối ưu Nền tảng D2C & Sàn TMĐT (Shopify, TikTok Shop)', norm: 'd2c shopify tiktok shop ecommerce', man: false, lvl: ProficiencyLevel.INTERMEDIATE },
    { name: 'A/B Testing & Tối ưu Tỷ lệ Chuyển đổi (CRO)', norm: 'cro ab testing conversion rate optimization', man: false, lvl: ProficiencyLevel.INTERMEDIATE },
  ];

  const jdSkills = [];
  for (const s of jdSkillsData) {
    const sk = await prisma.skill.upsert({
      where: { normalizedName: s.norm },
      update: {},
      create: { name: s.name, normalizedName: s.norm, categoryId: mktCategory.id },
    });
    jdSkills.push({ skill: sk, man: s.man, lvl: s.lvl });
  }

  const jobPosting = await prisma.jobPosting.upsert({
    where: { jobCode: 'JOB-MKT-PERFORMANCE-2026' },
    update: {
      title: 'Performance Marketing Manager (E-commerce & D2C Brands)',
      requiredExperienceYears: 4,
      experienceLevel: ExperienceLevel.SENIOR,
      status: JobStatus.PUBLISHED,
    },
    create: {
      jobCode: 'JOB-MKT-PERFORMANCE-2026',
      title: 'Performance Marketing Manager (E-commerce & D2C Brands)',
      recruiterId: recruiterProfile.id,
      departmentId: dept.id,
      status: JobStatus.PUBLISHED,
      employmentType: EmploymentType.FULL_TIME,
      experienceLevel: ExperienceLevel.SENIOR,
      requiredExperienceYears: 4,
      minSalary: 35000000,
      maxSalary: 50000000,
      currency: 'VND',
      location: 'Quận 1, TP. Hồ Chí Minh',
      description: 'Chịu trách nhiệm toàn quyền về tăng trưởng doanh thu từ các kênh Paid Traffic trên hệ sinh thái Website D2C Shopify, Shopee Mall, TikTok Shop. Quản trị ngân sách 400 - 800 triệu/tháng, tối ưu hóa các chỉ số Unit Economics: CAC, AOV, ROAS, MER.',
      requirements: 'Có tối thiểu 4 năm kinh nghiệm chạy Performance Ads ngành Bán lẻ E-commerce / D2C / FMCG, trực tiếp quản trị ngân sách từ 300 triệu/tháng. Nắm vững GTM Server-Side, GA4 E-commerce Enhanced Tracking, Meta Pixel & CAPI. Tối ưu phễu chuyển đổi E-commerce.',
      benefits: 'Lương 35 - 50 triệu + Thưởng Performance hàng quý, Bảo hiểm sức khỏe VIP, Làm việc mô hình Hybrid linh hoạt.',
    },
  });

  await prisma.jobSkill.deleteMany({ where: { jobId: jobPosting.id } });
  for (const js of jdSkills) {
    await prisma.jobSkill.create({
      data: {
        jobId: jobPosting.id,
        skillId: js.skill.id,
        requirementType: js.man ? SkillRequirementType.MANDATORY : SkillRequirementType.PREFERRED,
        minimumProficiency: js.lvl,
      },
    });
  }

  console.log(`  + Đã xuất bản JD: '${jobPosting.title}' (ID: ${jobPosting.id})\n`);

  // --------------------------------------------------------------------------------
  // 3. DANH SÁCH 5 ỨNG VIÊN THỰC TẾ (STRESS-TEST BENCHMARK)
  // --------------------------------------------------------------------------------
  const candidatesPayload = [
    // ------------------------------------------------------------------------------
    // CANDIDATE 1 — EXTREME MATCH (Kỳ vọng: 90 - 100)
    // ------------------------------------------------------------------------------
    {
      code: 'C1',
      name: 'Nguyễn Hải Nam',
      email: 'c1_hainam@recruitment.com',
      expectedLevel: 'Extreme Match',
      expectedRange: '90 - 100',
      profile: {
        desired_title: 'Head of Performance Marketing / Growth Lead (E-commerce)',
        summary: 'Hơn 4.5 năm kinh nghiệm chuyên sâu trong lĩnh vực Paid Acquisition và Data-Driven Growth cho các thương hiệu Bán lẻ D2C (Thời trang & Chăm sóc cá nhân). Sở trường kiểm soát ngân sách lớn, tối ưu hóa toàn diện phễu chuyển đổi số (Full-funnel conversion) và xây dựng hạ tầng Tracking Server-Side. Đã từng trực tiếp quản lý ngân sách quảng cáo lũy kế hơn 25 tỷ VNĐ với chỉ số MER trung bình toàn sàn luôn duy trì ở mức 4.8.',
      },
      educations: [
        {
          school_name: 'Đại học Kinh tế TP. Hồ Chí Minh (UEH)',
          major: 'Thương mại Điện tử (E-Commerce)',
          degree: 'Cử nhân Xuất sắc',
        },
      ],
      work_experiences: [
        {
          company_name: 'Công ty Cổ phần Thời trang D2C CoolStyle',
          position_title: 'Senior Performance Marketing Lead',
          description: 'Chịu trách nhiệm toàn quyền về tăng trưởng doanh thu từ các kênh Paid Traffic trên hệ thống Website Shopify và Shopee Mall, quản lý ngân sách bình quân 600 - 900 triệu VNĐ/tháng. Trực tiếp triển khai cấu trúc chiến dịch Meta Ads nâng cao (Advantage+ Shopping Campaigns) kết hợp hệ thống phễu Retargeting đa tầng, đạt tỷ lệ chuyển đổi website 3.8% và duy trì Blended ROAS 4.6 trên quy mô 12.000 đơn hàng/tháng. Tái cấu trúc toàn bộ Google Performance Max (PMax) dựa trên phân nhóm Margin sản phẩm, kết hợp chuẩn hóa Google Merchant Center Feed giúp giảm 28% CPA đơn hàng. Cấu hình Google Tag Manager Server-Side qua Cloud Server, triển khai Meta CAPI và Google Enhanced Conversions khắc phục 95% thất thoát dữ liệu iOS.',
          achievements: 'Tăng 140% doanh thu D2C, duy trì Blended ROAS 4.6 trên quy mô 12.000 đơn hàng/tháng.',
          start_date: '2022-04-01',
          end_date: '2025-04-01', // 3.0 năm
        },
        {
          company_name: 'Tập đoàn Bán lẻ Mỹ phẩm BeautyHub',
          position_title: 'Digital Acquisition Specialist',
          description: 'Phụ trách thực thi chiến dịch quảng cáo Paid Search và Paid Social cho hơn 50 thương hiệu mỹ phẩm nhập khẩu, tối ưu chi phí thu nạp khách hàng mới (CAC giảm 22%). Triển khai A/B Testing liên tục trên hơn 30 Landing Page (LadiPage), tối ưu UX giỏ hàng và tăng tỷ lệ Add-to-Cart từ 8% lên 13.5%. Phối hợp với team CRM thiết lập các luồng Automation trên Klaviyo theo hành vi bỏ quên giỏ hàng (Abandoned Cart), đóng góp 18% tổng doanh thu ròng.',
          achievements: 'Giảm 22% CAC, tăng tỷ lệ hoàn tất đơn hàng 35%.',
          start_date: '2020-10-01',
          end_date: '2022-03-31', // 1.5 năm (Tổng 4.5 năm)
        },
      ],
      skills: [
        { skill_name: 'Advantage+ Shopping Campaigns (Meta Ads)', proficiency_level: 'EXPERT' },
        { skill_name: 'Performance Max & GMC Product Feed', proficiency_level: 'EXPERT' },
        { skill_name: 'GTM Server-Side & Meta CAPI', proficiency_level: 'ADVANCED' },
        { skill_name: 'Full-Funnel E-commerce Conversion', proficiency_level: 'EXPERT' },
        { skill_name: 'Contribution Margin & Blended ROAS Analytics', proficiency_level: 'ADVANCED' },
      ],
      certificates: [
        { certificate_name: 'Meta Certified Media Buying Professional' },
        { certificate_name: 'Google Ads Search & Shopping Certified' },
      ],
    },

    // ------------------------------------------------------------------------------
    // CANDIDATE 2 — STRONG MATCH (Kỳ vọng: 75 - 89)
    // ------------------------------------------------------------------------------
    {
      code: 'C2',
      name: 'Lê Thị Thảo Vy',
      email: 'c2_thaovy@recruitment.com',
      expectedLevel: 'Strong Match',
      expectedRange: '75 - 89',
      profile: {
        desired_title: 'Senior Performance Media Specialist / Assistant Manager',
        summary: 'Senior Paid Media Specialist với 3.5 năm kinh nghiệm tại các Performance Agency hàng đầu, trực tiếp quản lý và thực thi chiến dịch Paid Traffic cho các nhãn hàng Bán lẻ & E-commerce lớn (FMCG, Mỹ phẩm). Thành thạo tối ưu thuật toán đấu thầu tự động, làm chủ bộ công cụ Ads Manager, Tracking GTM/GA4 và phân tích số liệu chuyển đổi.',
      },
      educations: [
        {
          school_name: 'Đại học Khoa học Xã hội & Nhân văn TP.HCM',
          major: 'Quan hệ Quốc tế (International Relations)',
          degree: 'Cử nhân',
        },
      ],
      work_experiences: [
        {
          company_name: 'T-Media Performance Agency',
          position_title: 'Senior Performance Media Executive',
          description: 'Trực tiếp quản lý và chạy quảng cáo chuyển đổi cho 4 tài khoản khách hàng E-commerce ngành FMCG và Mỹ phẩm, tổng ngân sách điều phối trung bình 1.2 tỷ VNĐ/tháng. Lên media plan, setup và tối ưu hàng ngày trên Meta Ads, Google Ads (Search, Shopping, Display) và TikTok Ads; bảo đảm các cam kết KPI về ROAS (trung bình 3.9 – 4.3) và CAC theo hợp đồng dịch vụ. Thực hiện cài đặt chuyển đổi: Thiết lập sự kiện Custom Events qua Google Tag Manager, cấu hình GA4 E-commerce Tracking và Pixel Meta cho website khách hàng.',
          achievements: 'Đạt 100% KPI cam kết hợp đồng cho các nhãn hàng lớn.',
          start_date: '2022-08-01',
          end_date: '2025-02-01', // 2.5 năm
        },
        {
          company_name: 'Digital First Agency',
          position_title: 'Digital Media Planner',
          description: 'Lập kế hoạch phân bổ ngân sách Digital đa kênh, phụ trách setup tài khoản quảng cáo Facebook và Google Search cho các đợt Siêu Sale Mega Day (9.9, 11.11, 12.12). Đo lường chỉ số Cost per Click (CPC), Cost per Acquisition (CPA) và hỗ trợ trích xuất dữ liệu Google Analytics.',
          achievements: 'Thực thi thành công hơn 15 chiến dịch Mega Sale.',
          start_date: '2021-09-01',
          end_date: '2022-07-31', // 0.9 năm (Tổng 3.4 năm - Dưới 4 năm)
        },
      ],
      skills: [
        { skill_name: 'Meta Ads Manager', proficiency_level: 'ADVANCED' },
        { skill_name: 'Google Ads (PMax, Search, Shopping)', proficiency_level: 'ADVANCED' },
        { skill_name: 'TikTok Shop Ads', proficiency_level: 'INTERMEDIATE' },
        { skill_name: 'GA4 & GTM E-commerce Tracking', proficiency_level: 'ADVANCED' },
        { skill_name: 'Media Planning & Budget Allocation', proficiency_level: 'ADVANCED' },
      ],
      certificates: [
        { certificate_name: 'Google Ads Search Certification' },
      ],
    },

    // ------------------------------------------------------------------------------
    // CANDIDATE 3 — TRANSFERABLE MATCH (Kỳ vọng: 55 - 74)
    // ------------------------------------------------------------------------------
    {
      code: 'C3',
      name: 'Hoàng Đức Minh',
      email: 'c3_ducminh@recruitment.com',
      expectedLevel: 'Transferable Match',
      expectedRange: '55 - 74',
      profile: {
        desired_title: 'B2B Growth & Performance Lead',
        summary: 'Hơn 4 năm kinh nghiệm làm Performance Marketing chuyên sâu trong khối Doanh nghiệp Công nghệ B2B SaaS và Giải pháp Doanh nghiệp (Enterprise Software). Chuyên gia tối ưu hóa kênh Paid Search, Inbound Funnel, đo lường vòng đời khách hàng B2B (Lead-to-Opportunity-to-Closed Won), quản trị hệ thống dữ liệu Attribution trên HubSpot và Google Analytics. Chưa từng chạy giỏ hàng E-commerce vật lý.',
      },
      educations: [
        {
          school_name: 'Đại học Ngoại Thương Cơ sở II',
          major: 'Quản trị Kinh doanh Quốc tế',
          degree: 'Cử nhân',
        },
      ],
      work_experiences: [
        {
          company_name: 'CloudFlow Enterprise SaaS',
          position_title: 'B2B Growth & Performance Lead',
          description: 'Quản lý toàn bộ ngân sách Paid Acquisition 350 triệu VNĐ/tháng tập trung vào các kênh: Google Ads (Search chuyên sâu, Dynamic Search Ads, Display Remarketing) và LinkedIn Ads. Tối ưu hóa chuyển đổi phễu B2B: Tăng 45% số lượng MQL (Marketing Qualified Leads), giảm 30% Cost per Lead (CPL) và phối hợp với đội Sales tăng tỷ lệ chốt Deal phần mềm. Cài đặt hệ thống đo lường chuyển đổi phức tạp: Tích hợp GTM với Form điền Lead, đồng bộ dữ liệu Offline Conversion từ HubSpot CRM ngược về Google Ads để tối ưu hóa theo giá trị Deal thực tế. Phân tích chỉ số tài chính B2B: Customer Lifetime Value (LTV), Payback Period, Churn Rate và Customer Acquisition Cost (CAC).',
          achievements: 'Tăng 45% MQL, giảm 30% CPL.',
          start_date: '2022-03-01',
          end_date: '2025-03-01', // 3.0 năm
        },
        {
          company_name: 'BaseVN Software Corp',
          position_title: 'Digital Marketing Specialist',
          description: 'Thực thi các chiến dịch Google Search Ads nhắm mục tiêu doanh nghiệp vừa và nhỏ (SME), thu hút hơn 800 lượt đăng ký dùng thử phần mềm/tháng. Quản lý hệ thống Email Nurturing tự động, đo lường chỉ số Open Rate và Click Rate qua ActiveCampaign.',
          achievements: 'Đạt 800+ lượt dùng thử phần mềm mỗi tháng.',
          start_date: '2021-01-01',
          end_date: '2022-02-28', // 1.1 năm (Tổng 4.1 năm)
        },
      ],
      skills: [
        { skill_name: 'B2B Paid Search (Google Ads)', proficiency_level: 'EXPERT' },
        { skill_name: 'LinkedIn Campaign Manager', proficiency_level: 'ADVANCED' },
        { skill_name: 'HubSpot Offline Conversion Sync', proficiency_level: 'ADVANCED' },
        { skill_name: 'MQL/SQL Funnel Optimization', proficiency_level: 'EXPERT' },
        { skill_name: 'B2B SaaS Unit Economics (LTV/CAC)', proficiency_level: 'ADVANCED' },
      ],
      certificates: [
        { certificate_name: 'HubSpot Inbound Marketing Certified' },
        { certificate_name: 'Google Ads Search Certification' },
      ],
    },

    // ------------------------------------------------------------------------------
    // CANDIDATE 4 — WEAK MATCH (Kỳ vọng: 30 - 54)
    // ------------------------------------------------------------------------------
    {
      code: 'C4',
      name: 'Phạm Thu Trang',
      email: 'c4_thutrang@recruitment.com',
      expectedLevel: 'Weak Match',
      expectedRange: '30 - 54',
      profile: {
        desired_title: 'Nhân viên Marketing / Quảng cáo Fanpage',
        summary: 'Cử nhân Marketing với hơn 1.8 năm làm việc trong lĩnh vực Truyền thông mạng xã hội và Quản trị Fanpage cho các cửa hàng thời trang bán lẻ. Mong muốn tìm kiếm cơ hội thử sức trong vai trò Performance Marketing để phát triển chuyên sâu kỹ năng chạy quảng cáo và tối ưu doanh số.',
      },
      educations: [
        {
          school_name: 'Đại học Văn Lang',
          major: 'Marketing Thương mại',
          degree: 'Cử nhân',
        },
      ],
      work_experiences: [
        {
          company_name: 'Shop Thời trang Nữ Dear Bella',
          position_title: 'Nhân viên Content & Quảng cáo Facebook',
          description: 'Viết bài quảng cáo, chụp ảnh sản phẩm và lên lịch đăng bài hàng ngày cho Fanpage và trang Instagram (hơn 50k followers). Trực tiếp cài đặt quảng cáo Facebook cơ bản: Chạy các chiến dịch Tương tác bài viết (Post Engagement), chiến dịch Tin nhắn (Click-to-Messenger) để khách hỏi giá và chốt đơn qua inbox; ngân sách khoảng 15 – 25 triệu VNĐ/tháng. Theo dõi tin nhắn hàng ngày, hỗ trợ bộ phận trực chat tư vấn size và chốt đơn hàng cho khách. Livestream bán hàng trên TikTok cá nhân của shop 2 buổi/tuần, giới thiệu các mẫu váy mới.',
          achievements: 'Tăng lượng tương tác Fanpage lên 25%.',
          start_date: '2023-05-01',
          end_date: '2025-01-01', // 1.7 năm
        },
      ],
      skills: [
        { skill_name: 'Sáng tạo nội dung (Content Writing)', proficiency_level: 'ADVANCED' },
        { skill_name: 'Chạy Ads Facebook Fanpage cơ bản (Post Boost)', proficiency_level: 'BEGINNER' },
        { skill_name: 'Livestream Bán hàng TikTok', proficiency_level: 'INTERMEDIATE' },
        { skill_name: 'Thiết kế Canva & Edit CapCut', proficiency_level: 'INTERMEDIATE' },
      ],
      certificates: [],
    },

    // ------------------------------------------------------------------------------
    // CANDIDATE 5 — FALSE POSITIVE / ADVERSARIAL TRAP (Kỳ vọng: 0 - 29)
    // ------------------------------------------------------------------------------
    {
      code: 'C5',
      name: 'Đặng Minh Quân',
      email: 'c5_minhquan@recruitment.com',
      expectedLevel: 'False Positive Trap (Gaming UA)',
      expectedRange: '0 - 29',
      profile: {
        desired_title: 'Senior Performance User Acquisition Manager (Mobile Gaming)',
        summary: 'Hơn 5 năm kinh nghiệm làm Senior Performance Marketing và Lead User Acquisition (UA) trong ngành Công nghiệp Game Di Động (Mobile Gaming & App Publishing). Chuyên gia tối ưu hóa chiến dịch quảng cáo trả phí (Paid Performance Ads) quy mô toàn cầu với ngân sách quản lý lên đến $50,000 USD/tháng. Sở trường tối ưu chỉ số ROAS, CAC, CPI, phân tích Attribution Modeling và thiết lập A/B testing quy mô hàng trăm creatives mỗi tuần. Hoàn toàn không có kinh nghiệm E-com D2C giỏ hàng vật lý.',
      },
      educations: [
        {
          school_name: 'Đại học Bách Khoa TP.HCM',
          major: 'Hệ thống Thông tin Quản lý',
          degree: 'Kỹ sư',
        },
      ],
      work_experiences: [
        {
          company_name: 'Virtual Apps & Gaming Global',
          position_title: 'Senior Performance User Acquisition Manager',
          description: 'Lãnh đạo chiến lược Paid Performance User Acquisition trên phạm vi toàn cầu (Thị trường Mỹ, Châu Âu, Đông Nam Á) cho 6 tựa game casual và hybrid-casual trên hệ điều hành iOS và Android. Quản trị và tối ưu ngân sách quảng cáo Performance lớn ($40,000 – $60,000 USD/tháng) trên các nền tảng: Meta Ads Manager (App Install Campaigns, Value Optimization), Google App Campaigns (Google AC, Search, YouTube Ads), TikTok Ads for Apps và Unity Ads. Tối ưu hóa sâu các chỉ số kinh tế đơn vị: Giá mỗi lượt cài đặt (CPI), Chi phí chuyển đổi người dùng trả phí (CAC), Tỷ lệ hoàn vốn chi tiêu quảng cáo (Day-7 ROAS >= 35%, Day-30 ROAS >= 115%) và Doanh thu trung bình trên mỗi người dùng (ARPU / LTV). Cấu hình Mobile Measurement Partner (MMP) AppsFlyer và Adjust, tích hợp SDK, SKAdNetwork (SKAN 4.0). Phối hợp 3D Motion chạy A/B testing 80 Playable Ads/tuần.',
          achievements: 'Scale ngân sách lên $50k/tháng, đạt 2M downloads toàn cầu.',
          start_date: '2021-06-01',
          end_date: '2025-03-01', // 3.8 năm
        },
        {
          company_name: 'Joystick Mobile Studio',
          position_title: 'Performance Ads Specialist',
          description: 'Setup và tối ưu chiến dịch quảng cáo ứng dụng qua Facebook Ads và Google AdMob; đo lường chỉ số Retargeting người dùng không hoạt động (Re-engagement campaigns). Phân tích dữ liệu Cohort Analysis trên Firebase Analytics và BigQuery để tìm kiếm tệp người dùng trả phí cao (Whales).',
          achievements: 'Tối ưu Day-7 ROAS game đạt 40%.',
          start_date: '2019-08-01',
          end_date: '2021-05-31', // 1.8 năm (Tổng 5.6 năm)
        },
      ],
      skills: [
        { skill_name: 'Mobile Game User Acquisition (Meta & Google AC)', proficiency_level: 'EXPERT' },
        { skill_name: 'AppsFlyer MMP & SKAdNetwork Tracking', proficiency_level: 'EXPERT' },
        { skill_name: 'Day-7 & Day-30 Game ROAS Optimization', proficiency_level: 'EXPERT' },
        { skill_name: 'Playable Ads & App Store CRO', proficiency_level: 'ADVANCED' },
        { skill_name: 'Unity & AdMob Monetization', proficiency_level: 'ADVANCED' },
      ],
      certificates: [
        { certificate_name: 'AppsFlyer Certified Expert' },
        { certificate_name: 'Google App Advertising Specialist' },
      ],
    },
  ];

  // --------------------------------------------------------------------------------
  // 4. THỰC HIỆN TẠO VÀ CHẤM ĐIỂM TỪNG ỨNG VIÊN QUA FASTAPI MODEL V3
  // --------------------------------------------------------------------------------
  const benchmarkResults = [];

  console.log('🤖 2. Đang gửi dữ liệu từng ứng viên sang AI Matching Engine (FastAPI) để chấm điểm thực tế...\n');

  for (const c of candidatesPayload) {
    let candAuthId = userList?.users?.find((u) => u.email === c.email)?.id;
    if (!candAuthId) {
      const { data: newCand } = await supabase.auth.admin.createUser({
        email: c.email,
        password: 'Password123@',
        email_confirm: true,
        user_metadata: { full_name: c.name },
      });
      candAuthId = newCand.user!.id;
    }

    const candUser = await prisma.user.upsert({
      where: { id: candAuthId },
      update: { fullName: c.name },
      create: { id: candAuthId, email: c.email, fullName: c.name },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: candUser.id, roleId: candidateRole.id } },
      update: {},
      create: { userId: candUser.id, roleId: candidateRole.id },
    });

    const candProfile = await prisma.candidateProfile.upsert({
      where: { userId: candAuthId },
      update: {
        fullName: c.name,
        desiredTitle: c.profile.desired_title,
        professionalSummary: c.profile.summary,
      },
      create: {
        userId: candAuthId,
        email: c.email,
        fullName: c.name,
        desiredTitle: c.profile.desired_title,
        professionalSummary: c.profile.summary,
      },
    });

    // Cập nhật Skills trong DB
    await prisma.candidateSkill.deleteMany({ where: { candidateId: candProfile.id } });
    for (const sk of c.skills) {
      const dbSk = await prisma.skill.upsert({
        where: { normalizedName: sk.skill_name.toLowerCase().replace(/[^a-z0-9]/g, ' ') },
        update: {},
        create: {
          name: sk.skill_name,
          normalizedName: sk.skill_name.toLowerCase().replace(/[^a-z0-9]/g, ' '),
          categoryId: mktCategory.id,
        },
      });
      await prisma.candidateSkill.create({
        data: {
          candidateId: candProfile.id,
          skillId: dbSk.id,
          proficiencyLevel: sk.proficiency_level as ProficiencyLevel,
        },
      });
    }

    // Cập nhật Education trong DB
    await prisma.education.deleteMany({ where: { candidateProfileId: candProfile.id } });
    for (const edu of c.educations) {
      await prisma.education.create({
        data: {
          candidateProfileId: candProfile.id,
          schoolName: edu.school_name,
          major: edu.major,
          degree: edu.degree,
        },
      });
    }

    // Cập nhật Work Experience trong DB
    await prisma.workExperience.deleteMany({ where: { candidateProfileId: candProfile.id } });
    for (const exp of c.work_experiences) {
      await prisma.workExperience.create({
        data: {
          candidateProfileId: candProfile.id,
          companyName: exp.company_name,
          positionTitle: exp.position_title,
          description: exp.description,
          achievements: exp.achievements,
          startDate: new Date(exp.start_date),
          endDate: new Date(exp.end_date),
        },
      });
    }

    // Tạo Resume & Nộp Hồ sơ
    const resume = await prisma.resume.create({
      data: {
        candidateId: candProfile.id,
        originalFileName: `${c.name.replace(/\s+/g, '_')}_CV.pdf`,
        objectPath: `resumes/${candAuthId}/cv.pdf`,
        mimeType: 'application/pdf',
        fileSizeBytes: 1024 * 400,
        parsingStatus: 'PARSED',
      },
    });

    const application = await prisma.application.upsert({
      where: { jobId_candidateId: { jobId: jobPosting.id, candidateId: candProfile.id } },
      update: {
        resumeId: resume.id,
        processingStatus: ApplicationProcessingStatus.COMPLETED,
        currentStage: ApplicationStage.SCREENING,
      },
      create: {
        jobId: jobPosting.id,
        candidateId: candProfile.id,
        resumeId: resume.id,
        processingStatus: ApplicationProcessingStatus.COMPLETED,
        currentStage: ApplicationStage.SCREENING,
      },
    });

    // GỌI FASTAPI MATCHING ENGINE ĐỂ CHẤM ĐIỂM
    const evalPayload = {
      application_id: application.id,
      candidate_profile: {
        profile: {
          desired_title: c.profile.desired_title,
          professional_summary: (c.profile as any).summary ?? (c.profile as any).professional_summary,
        },
        educations: c.educations,
        work_experiences: c.work_experiences,
        projects: [],
        skills: c.skills,
        certificates: c.certificates,
      },
      job: {
        title: jobPosting.title,
        experience_level: 'SENIOR',
        employment_type: 'FULL_TIME',
        description: jobPosting.description,
        requirements: jobPosting.requirements,
        required_experience_years: 4.0,
        required_skills: [
          { skill_name: 'Quản trị Paid Media E-commerce (Meta Ads & Google PMax)', is_mandatory: true, minimum_level: 'EXPERT' },
          { skill_name: 'Tối ưu Phễu Chuyển đổi & Đơn vị Kinh tế E-com (ROAS, CAC, MER)', is_mandatory: true, minimum_level: 'ADVANCED' },
          { skill_name: 'Hạ tầng Tracking Chuyên sâu (GTM Server-Side, GA4, Meta CAPI)', is_mandatory: true, minimum_level: 'ADVANCED' },
          { skill_name: 'Tối ưu Nền tảng D2C & Sàn TMĐT (Shopify, TikTok Shop)', is_mandatory: false, minimum_level: 'INTERMEDIATE' },
          { skill_name: 'A/B Testing & Tối ưu Tỷ lệ Chuyển đổi (CRO)', is_mandatory: false, minimum_level: 'INTERMEDIATE' },
        ],
        required_certificates: [],
      },
    };

    const aiRes = await fetch('http://127.0.0.1:8000/api/v1/matching/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evalPayload),
    });

    if (!aiRes.ok) {
      console.error(`❌ Lỗi khi chấm điểm ${c.name}:`, await aiRes.text());
      continue;
    }

    const res: any = await aiRes.json();

    // Lưu vào Database
    await prisma.aiMatchingResult.upsert({
      where: { applicationId_version: { applicationId: application.id, version: 1 } },
      update: {
        overallScore: res.overall_score,
        matchLevel: res.match_level as MatchLevel,
        skillScore: res.skills_score,
        experienceScore: res.experience_score,
        educationScore: res.education_score,
        projectScore: res.other_score,
        matchedSkills: res.matched_skills,
        missingSkills: res.missing_skills,
        missingRequiredSkills: res.missing_required_skills,
        strengths: res.strengths,
        gaps: res.gaps,
        reasoningSummary: res.summary,
      },
      create: {
        applicationId: application.id,
        version: 1,
        overallScore: res.overall_score,
        matchLevel: res.match_level as MatchLevel,
        skillScore: res.skills_score,
        experienceScore: res.experience_score,
        educationScore: res.education_score,
        projectScore: res.other_score,
        matchedSkills: res.matched_skills,
        missingSkills: res.missing_skills,
        missingRequiredSkills: res.missing_required_skills,
        strengths: res.strengths,
        gaps: res.gaps,
        reasoningSummary: res.summary,
      },
    });

    benchmarkResults.push({
      code: c.code,
      name: c.name,
      expectedLevel: c.expectedLevel,
      expectedRange: c.expectedRange,
      actualScore: res.overall_score.toFixed(2),
      matchLevel: res.match_level,
      skillScore: res.skills_score.toFixed(2),
      expScore: res.experience_score.toFixed(2),
      eduScore: res.education_score.toFixed(2),
      summary: res.summary,
      strengths: res.strengths || [],
      gaps: res.gaps || [],
    });

    console.log(`  + Đã chấm xong [${c.code}] ${c.name} ➔ Điểm AI: ${res.overall_score.toFixed(2)}/100 (${res.match_level})`);
  }

  // --------------------------------------------------------------------------------
  // 5. IN BẢNG ĐỐI CHIẾU BENCHMARK VÀ GIẢI TRÌNH CHUYÊN SÂU
  // --------------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log('              🏆 BẢNG TỔNG KẾT ADVERSARIAL BENCHMARK EVALUATION');
  console.log('================================================================================');
  console.log('| Ứng viên | Phân loại Kỳ vọng | Khung điểm Chuẩn | Điểm AI Thực tế | Cấp độ Khớp | Điểm Thành phần |');
  console.log('| :--- | :--- | :---: | :---: | :---: | :--- |');
  for (const r of benchmarkResults) {
    console.log(`| **${r.code} - ${r.name}** | ${r.expectedLevel} | \`${r.expectedRange}\` | **\`${r.actualScore} / 100\`** | **${r.matchLevel}** | Skills: ${r.skillScore}, Exp: ${r.expScore}, Edu: ${r.eduScore} |`);
  }
  console.log('================================================================================\n');

  console.log('📝 CHI TIẾT GIẢI TRÌNH CHẨN ĐOÁN CỦA TỪNG ỨNG VIÊN:');
  for (const r of benchmarkResults) {
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`👤 [${r.code}] ${r.name} — ${r.actualScore}/100 (${r.matchLevel}) | Kỳ vọng: ${r.expectedLevel} (${r.expectedRange})`);
    console.log(`📄 Tóm tắt chẩn đoán: ${r.summary}`);
    console.log(`💪 Điểm mạnh (${r.strengths.length}):`);
    r.strengths.forEach((s: string) => console.log(`   + ${s}`));
    console.log(`⚠️ Điểm cần lưu ý / Hạn chế (${r.gaps.length}):`);
    r.gaps.forEach((g: string) => console.log(`   - ${g}`));
  }
  console.log('--------------------------------------------------------------------------------\n');

  console.log('✅ Đã cập nhật toàn bộ 5 ứng viên vào cơ sở dữ liệu và hoàn tất chấm điểm thực tế!');
  console.log('🌐 Bạn có thể mở ngay http://localhost:3000/recruiter/dashboard để xem bảng xếp hạng 5 ứng viên trên Web!');
}

main()
  .catch((e) => {
    console.error('Error running benchmark:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
