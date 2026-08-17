import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestCase {
  category: string;
  categoryName: string;
  code: string;
  candidateName: string;
  jobTitle: string;
  jobRequirements: any;
  candidateData: any;
  expectedMin: number;
  expectedMax: number;
  expectedLevel: 'HIGH' | 'MEDIUM' | 'LOW';
}

export const ADVERSARIAL_50_CASES: TestCase[] = [
  // -----------------------------------------------------------------------------------------------
  // CAT-A: EXACT MATCH (Kỳ vọng: 90 - 100)
  // -----------------------------------------------------------------------------------------------
  {
    category: 'CAT-A', categoryName: 'Exact Match', code: 'A1', candidateName: 'Nguyễn Hải Nam',
    jobTitle: 'Senior Performance Marketing Lead (E-com D2C)',
    jobRequirements: {
      experience_years: 4.0,
      skills: [
        { skill_name: 'Advantage+ Shopping Campaigns (Meta Ads)', is_mandatory: true, minimum_level: 'EXPERT' },
        { skill_name: 'Performance Max & GMC Feed', is_mandatory: true, minimum_level: 'ADVANCED' },
        { skill_name: 'GTM Server-Side & Meta CAPI', is_mandatory: true, minimum_level: 'ADVANCED' },
      ],
    },
    candidateData: {
      desired_title: 'Senior Performance Marketing Lead',
      summary: '4.5 năm chuyên sâu D2C E-commerce, quản lý ngân sách 800M/tháng, Blended ROAS 4.6 trên 12,000 đơn hàng.',
      skills: [
        { skill_name: 'Advantage+ Shopping Campaigns (Meta Ads)', proficiency_level: 'EXPERT' },
        { skill_name: 'Performance Max & GMC Feed', proficiency_level: 'EXPERT' },
        { skill_name: 'GTM Server-Side & Meta CAPI', proficiency_level: 'ADVANCED' },
      ],
      experiences: [{ position_title: 'Senior Performance Marketing Lead', company_name: 'CoolStyle D2C', start_date: '2021-01-01', end_date: '2025-06-01', description: 'Tối ưu PMax, CAPI, Shopify' }]
    },
    expectedMin: 85, expectedMax: 100, expectedLevel: 'HIGH'
  },
  {
    category: 'CAT-A', categoryName: 'Exact Match', code: 'A2', candidateName: 'Trần Hoàng Nam',
    jobTitle: 'Academic IELTS Head Teacher',
    jobRequirements: {
      experience_years: 4.0,
      skills: [
        { skill_name: 'IELTS Academic 8.5 & Band Descriptors Assessment', is_mandatory: true, minimum_level: 'EXPERT' },
        { skill_name: 'Cambridge English Curriculum Design', is_mandatory: true, minimum_level: 'ADVANCED' },
        { skill_name: 'Academic Writing Task 2 Peer Coaching', is_mandatory: true, minimum_level: 'ADVANCED' },
      ],
    },
    candidateData: {
      desired_title: 'Academic Head Teacher',
      summary: 'M.Ed Melbourne, DELTA, IELTS 8.5 Overall, 5 năm giảng dạy học thuật tại ACET & VUS.',
      skills: [
        { skill_name: 'IELTS Academic 8.5 & Band Descriptors Assessment', proficiency_level: 'EXPERT' },
        { skill_name: 'Cambridge English Curriculum Design', proficiency_level: 'EXPERT' },
        { skill_name: 'Academic Writing Task 2 Peer Coaching', proficiency_level: 'ADVANCED' },
      ],
      experiences: [{ position_title: 'Head Teacher', company_name: 'ACET Vietnam', start_date: '2020-01-01', end_date: '2025-06-01', description: 'Giảng dạy IELTS học thuật' }]
    },
    expectedMin: 85, expectedMax: 100, expectedLevel: 'HIGH'
  },
  {
    category: 'CAT-A', categoryName: 'Exact Match', code: 'A3', candidateName: 'Đặng Quốc Bảo',
    jobTitle: 'Senior Java Backend Engineer (Fintech Core)',
    jobRequirements: {
      experience_years: 4.0,
      skills: [
        { skill_name: 'Java 17 & Spring Boot 3 Microservices', is_mandatory: true, minimum_level: 'EXPERT' },
        { skill_name: 'Kafka Event Streaming & High-Load Architecture', is_mandatory: true, minimum_level: 'ADVANCED' },
        { skill_name: 'PostgreSQL Database Optimization & Indexing', is_mandatory: true, minimum_level: 'ADVANCED' },
      ],
    },
    candidateData: {
      desired_title: 'Senior Java Backend Engineer',
      summary: '4.8 năm phát triển core banking và ví điện tử, xử lý 8,000 TPS, thành thạo Spring Boot 3, Kafka, PostgreSQL.',
      skills: [
        { skill_name: 'Java 17 & Spring Boot 3 Microservices', proficiency_level: 'EXPERT' },
        { skill_name: 'Kafka Event Streaming & High-Load Architecture', proficiency_level: 'EXPERT' },
        { skill_name: 'PostgreSQL Database Optimization & Indexing', proficiency_level: 'ADVANCED' },
      ],
      experiences: [{ position_title: 'Senior Backend Engineer', company_name: 'Fintech Bank', start_date: '2020-05-01', end_date: '2025-03-01', description: 'Xây dựng microservices Java Spring Boot 3 và Kafka' }]
    },
    expectedMin: 85, expectedMax: 100, expectedLevel: 'HIGH'
  },
  {
    category: 'CAT-A', categoryName: 'Exact Match', code: 'A4', candidateName: 'Phan Minh Tuấn',
    jobTitle: 'Trưởng phòng Kế toán Thuế (Chief Tax Accountant)',
    jobRequirements: {
      experience_years: 5.0,
      skills: [
        { skill_name: 'Quyết toán Thuế Doanh nghiệp TNDN & TNCN', is_mandatory: true, minimum_level: 'EXPERT' },
        { skill_name: 'Lập Báo cáo Tài chính VAS & Kiểm toán Độc lập', is_mandatory: true, minimum_level: 'EXPERT' },
        { skill_name: 'Phần mềm Kế toán MISA Doanh nghiệp', is_mandatory: true, minimum_level: 'ADVANCED' },
      ],
    },
    candidateData: {
      desired_title: 'Kế toán trưởng / Trưởng phòng Kế toán Thuế',
      summary: 'Chứng chỉ CPA Việt Nam, 5.5 năm kế toán trưởng cho tập đoàn sản xuất, trực tiếp quyết toán thuế 3 đợt thanh tra đạt kết quả chuẩn xác.',
      skills: [
        { skill_name: 'Quyết toán Thuế Doanh nghiệp TNDN & TNCN', proficiency_level: 'EXPERT' },
        { skill_name: 'Lập Báo cáo Tài chính VAS & Kiểm toán Độc lập', proficiency_level: 'EXPERT' },
        { skill_name: 'Phần mềm Kế toán MISA Doanh nghiệp', proficiency_level: 'ADVANCED' },
      ],
      experiences: [{ position_title: 'Kế toán trưởng', company_name: 'Tập đoàn Sản xuất Đại Dương', start_date: '2019-10-01', end_date: '2025-04-01', description: 'Quyết toán thuế, lập BCTC kiểm toán MISA' }]
    },
    expectedMin: 85, expectedMax: 100, expectedLevel: 'HIGH'
  },
  {
    category: 'CAT-A', categoryName: 'Exact Match', code: 'A5', candidateName: 'Lâm Gia Bách',
    jobTitle: 'Senior UI/UX Product Designer',
    jobRequirements: {
      experience_years: 4.0,
      skills: [
        { skill_name: 'Figma Design System Architecture', is_mandatory: true, minimum_level: 'EXPERT' },
        { skill_name: 'User Research & Usability Testing', is_mandatory: true, minimum_level: 'ADVANCED' },
        { skill_name: 'Mobile App Interaction & Wireframing', is_mandatory: true, minimum_level: 'ADVANCED' },
      ],
    },
    candidateData: {
      desired_title: 'Senior Product Designer',
      summary: '4.2 năm thiết kế ứng dụng Mobile Banking và E-commerce, xây dựng toàn diện Design System trên Figma phục vụ đội ngũ 30 kỹ sư.',
      skills: [
        { skill_name: 'Figma Design System Architecture', proficiency_level: 'EXPERT' },
        { skill_name: 'User Research & Usability Testing', proficiency_level: 'ADVANCED' },
        { skill_name: 'Mobile App Interaction & Wireframing', proficiency_level: 'ADVANCED' },
      ],
      experiences: [{ position_title: 'Senior UI/UX Designer', company_name: 'Tech Unicorn', start_date: '2021-01-01', end_date: '2025-04-01', description: 'Xây dựng Figma Design System và wireframing' }]
    },
    expectedMin: 85, expectedMax: 100, expectedLevel: 'HIGH'
  },

  // -----------------------------------------------------------------------------------------------
  // CAT-B: STRONG MATCH (Kỳ vọng: 75 - 89, bị trừ nhẹ số năm kinh nghiệm)
  // -----------------------------------------------------------------------------------------------
  {
    category: 'CAT-B', categoryName: 'Strong Match', code: 'B1', candidateName: 'Lê Thị Thảo Vy',
    jobTitle: 'Senior Performance Marketing Lead (E-com D2C)',
    jobRequirements: {
      experience_years: 4.0,
      skills: [
        { skill_name: 'Quản trị Paid Media E-commerce (Meta Ads & Google PMax)', is_mandatory: true, minimum_level: 'EXPERT' },
        { skill_name: 'Tối ưu Phễu Chuyển đổi & Đơn vị Kinh tế E-com (ROAS, CAC, MER)', is_mandatory: true, minimum_level: 'ADVANCED' },
        { skill_name: 'Hạ tầng Tracking Chuyên sâu (GTM Server-Side, GA4, Meta CAPI)', is_mandatory: true, minimum_level: 'ADVANCED' },
      ],
    },
    candidateData: {
      desired_title: 'Senior Performance Media Specialist',
      summary: 'Senior Paid Media 3.4 năm tại Performance Agency cho các nhãn hàng FMCG và Mỹ phẩm E-com.',
      skills: [
        { skill_name: 'TikTok Shop Ads', proficiency_level: 'EXPERT' },
        { skill_name: 'Meta Ads Manager', proficiency_level: 'ADVANCED' },
        { skill_name: 'GA4 & GTM E-commerce Tracking', proficiency_level: 'ADVANCED' },
      ],
      experiences: [{ position_title: 'Senior Performance Media Executive', company_name: 'T-Media Agency', start_date: '2021-10-01', end_date: '2025-03-01', description: 'Quản lý tài khoản khách hàng FMCG E-commerce' }]
    },
    expectedMin: 75, expectedMax: 89, expectedLevel: 'HIGH'
  },

  // -----------------------------------------------------------------------------------------------
  // CAT-C: TRANSFERABLE MATCH (Kỳ vọng: 55 - 74)
  // -----------------------------------------------------------------------------------------------
  {
    category: 'CAT-C', categoryName: 'Transferable Match', code: 'C1', candidateName: 'Hoàng Đức Minh',
    jobTitle: 'Performance Marketing Manager (E-commerce & D2C)',
    jobRequirements: {
      experience_years: 4.0,
      skills: [
        { skill_name: 'Quản trị Paid Media E-commerce (Meta Ads & Google PMax)', is_mandatory: true, minimum_level: 'EXPERT' },
        { skill_name: 'Tối ưu Phễu Chuyển đổi & Đơn vị Kinh tế E-com (ROAS, CAC, MER)', is_mandatory: true, minimum_level: 'ADVANCED' },
        { skill_name: 'Hạ tầng Tracking Chuyên sâu (GTM Server-Side, GA4, Meta CAPI)', is_mandatory: true, minimum_level: 'ADVANCED' },
      ],
    },
    candidateData: {
      desired_title: 'B2B Growth & Performance Lead',
      summary: '4.2 năm tối ưu Lead Gen B2B SaaS, quản lý Google Search Ads ngân sách 400M/tháng, tối ưu LTV/CAC.',
      skills: [
        { skill_name: 'B2B Paid Search (Google Ads)', proficiency_level: 'EXPERT' },
        { skill_name: 'B2B SaaS Unit Economics (LTV/CAC)', proficiency_level: 'ADVANCED' },
        { skill_name: 'HubSpot Marketing Automation', proficiency_level: 'ADVANCED' },
      ],
      experiences: [{ position_title: 'B2B Growth Lead', company_name: 'CloudSaaS Tech', start_date: '2021-01-01', end_date: '2025-03-01', description: 'Tối ưu phễu lead B2B SaaS' }]
    },
    expectedMin: 55, expectedMax: 74, expectedLevel: 'MEDIUM'
  },

  // -----------------------------------------------------------------------------------------------
  // CAT-D: WEAK MATCH / JUNIOR (Kỳ vọng: 25 - 54)
  // -----------------------------------------------------------------------------------------------
  {
    category: 'CAT-D', categoryName: 'Weak Match / Junior', code: 'D1', candidateName: 'Phạm Thu Trang',
    jobTitle: 'Performance Marketing Manager (E-commerce & D2C)',
    jobRequirements: {
      experience_years: 4.0,
      skills: [
        { skill_name: 'Quản trị Paid Media E-commerce (Meta Ads & Google PMax)', is_mandatory: true, minimum_level: 'EXPERT' },
        { skill_name: 'Tối ưu Phễu Chuyển đổi & Đơn vị Kinh tế E-com (ROAS, CAC, MER)', is_mandatory: true, minimum_level: 'ADVANCED' },
        { skill_name: 'Hạ tầng Tracking Chuyên sâu (GTM Server-Side, GA4, Meta CAPI)', is_mandatory: true, minimum_level: 'ADVANCED' },
      ],
    },
    candidateData: {
      desired_title: 'Nhân viên Content & Quảng cáo Facebook',
      summary: '1.7 năm phụ trách viết bài Fanpage và chạy thử quảng cáo Facebook post engagement ngân sách nhỏ.',
      skills: [
        { skill_name: 'Facebook Ads Post Engagement', proficiency_level: 'BEGINNER' },
        { skill_name: 'Content Writing', proficiency_level: 'INTERMEDIATE' },
      ],
      experiences: [{ position_title: 'Nhân viên Content', company_name: 'Shop Thời trang Nhỏ', start_date: '2023-08-01', end_date: '2025-03-01', description: 'Viết bài fanpage và bấm nút quảng cáo' }]
    },
    expectedMin: 20, expectedMax: 54, expectedLevel: 'LOW'
  },

  // -----------------------------------------------------------------------------------------------
  // CAT-F: SAME TOOL / DIFFERENT CONTEXT (FALSE POSITIVE TRAP) (Kỳ vọng: 0 - 29)
  // -----------------------------------------------------------------------------------------------
  {
    category: 'CAT-F', categoryName: 'Same Tool / Different Context Trap', code: 'F1', candidateName: 'Đặng Minh Quân',
    jobTitle: 'Performance Marketing Manager (E-commerce & D2C Brands)',
    jobRequirements: {
      experience_years: 4.0,
      skills: [
        { skill_name: 'Quản trị Paid Media E-commerce (Meta Ads & Google PMax)', is_mandatory: true, minimum_level: 'EXPERT' },
        { skill_name: 'Tối ưu Phễu Chuyển đổi & Đơn vị Kinh tế E-com (ROAS, CAC, MER)', is_mandatory: true, minimum_level: 'ADVANCED' },
        { skill_name: 'Hạ tầng Tracking Chuyên sâu (GTM Server-Side, GA4, Meta CAPI)', is_mandatory: true, minimum_level: 'ADVANCED' },
      ],
    },
    candidateData: {
      desired_title: 'Senior Performance User Acquisition Manager',
      summary: '5.6 năm phụ trách chạy quảng cáo User Acquisition cho game mobile casual, tối ưu CPI, AppsFlyer, Unity Ads.',
      skills: [
        { skill_name: 'Mobile Game User Acquisition (Meta & Google AC)', proficiency_level: 'EXPERT' },
        { skill_name: 'Day-7 & Day-30 Game ROAS Optimization', proficiency_level: 'EXPERT' },
        { skill_name: 'AppsFlyer & SKAdNetwork Tracking', proficiency_level: 'ADVANCED' },
      ],
      experiences: [{ position_title: 'Senior UA Manager', company_name: 'GamePlay Studio', start_date: '2019-09-01', end_date: '2025-03-01', description: 'Chạy ads app install game casual' }]
    },
    expectedMin: 0, expectedMax: 29, expectedLevel: 'LOW'
  },
  {
    category: 'CAT-F', categoryName: 'Same Tool / Different Context Trap', code: 'F2', candidateName: 'Ngô Thanh Sơn',
    jobTitle: 'Backend Engineer (Enterprise Financial Core)',
    jobRequirements: {
      experience_years: 3.0,
      skills: [
        { skill_name: 'Java Spring Boot Microservices', is_mandatory: true, minimum_level: 'ADVANCED' },
        { skill_name: 'ACID Transaction & High-load Database', is_mandatory: true, minimum_level: 'ADVANCED' },
      ],
    },
    candidateData: {
      desired_title: 'Embedded Firmware Developer',
      summary: '4 năm lập trình C/C++ vi điều khiển ARM và thiết bị IoT phần cứng.',
      skills: [
        { skill_name: 'C/C++ Embedded Firmware', proficiency_level: 'EXPERT' },
        { skill_name: 'RTOS & Microcontroller Hardware', proficiency_level: 'ADVANCED' },
      ],
      experiences: [{ position_title: 'Firmware Engineer', company_name: 'IoT Hardware Lab', start_date: '2021-01-01', end_date: '2025-01-01', description: 'Lập trình firmware vi điều khiển STM32' }]
    },
    expectedMin: 0, expectedMax: 29, expectedLevel: 'LOW'
  },
  {
    category: 'CAT-F', categoryName: 'Same Tool / Different Context Trap', code: 'F3', candidateName: 'Vũ Thị Mai',
    jobTitle: 'Kế toán Thuế Doanh nghiệp (Tax Accountant)',
    jobRequirements: {
      experience_years: 3.0,
      skills: [
        { skill_name: 'Báo cáo Thuế & Hóa đơn Điện tử MISA', is_mandatory: true, minimum_level: 'ADVANCED' },
        { skill_name: 'Quyết toán Thuế TNDN & TNCN', is_mandatory: true, minimum_level: 'ADVANCED' },
      ],
    },
    candidateData: {
      desired_title: 'Chuyên viên Phân tích Đầu tư Chứng khoán',
      summary: '4 năm phân tích báo cáo tài chính định giá cổ phiếu ngân hàng và thị trường vốn.',
      skills: [
        { skill_name: 'Financial Modeling & Valuation', proficiency_level: 'ADVANCED' },
        { skill_name: 'Equity Research & Bloomberg Terminal', proficiency_level: 'ADVANCED' },
      ],
      experiences: [{ position_title: 'Equity Research Analyst', company_name: 'Securities Corp', start_date: '2021-01-01', end_date: '2025-01-01', description: 'Phân tích định giá cổ phiếu doanh nghiệp' }]
    },
    expectedMin: 0, expectedMax: 35, expectedLevel: 'LOW'
  }
];

// =================================================================================================
// RUN SUITE & CALCULATE METRICS
// =================================================================================================

async function runSuite() {
  console.log('================================================================================');
  console.log('       🚀 THỰC THI BỘ KIỂM THỬ ĐỐI KHÁNG TỰ ĐỘNG (ADVERSARIAL BENCHMARK SUITE)');
  console.log('================================================================================\n');

  let totalCases = ADVERSARIAL_50_CASES.length;
  let passedCases = 0;
  let falsePositives = 0;
  let absErrors: number[] = [];

  const results = [];

  for (const tc of ADVERSARIAL_50_CASES) {
    const payload = {
      application_id: `test-${tc.code}`,
      candidate_profile: {
        profile: {
          desired_title: tc.candidateData.desired_title,
          professional_summary: tc.candidateData.summary,
        },
        educations: [],
        work_experiences: (tc.candidateData.experiences || []).map((e: any) => ({
          company_name: e.company_name,
          position_title: e.position_title,
          start_date: e.start_date,
          end_date: e.end_date,
          description: e.description,
        })),
        projects: [],
        skills: tc.candidateData.skills,
        certificates: [],
      },
      job: {
        title: tc.jobTitle,
        required_experience_years: tc.jobRequirements.experience_years,
        required_skills: tc.jobRequirements.skills,
        required_certificates: [],
      },
    };

    const aiRes = await fetch('http://127.0.0.1:8000/api/v1/matching/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!aiRes.ok) {
      console.error(`❌ Lỗi khi test case ${tc.code}:`, await aiRes.text());
      continue;
    }

    const res: any = await aiRes.json();
    const actualScore = res.overall_score;
    const matchLevel = res.match_level;

    // Check bounds
    const isWithinRange = actualScore >= tc.expectedMin - 5.0 && actualScore <= tc.expectedMax + 5.0;
    if (isWithinRange) passedCases++;

    // Check False Positive for Traps
    if (tc.category === 'CAT-F' && actualScore >= 40.0) {
      falsePositives++;
    }

    const midTarget = (tc.expectedMin + tc.expectedMax) / 2.0;
    absErrors.push(Math.abs(actualScore - midTarget));

    results.push({
      code: tc.code,
      name: tc.candidateName,
      cat: tc.category,
      expected: `${tc.expectedMin} - ${tc.expectedMax}`,
      actual: actualScore.toFixed(2),
      level: matchLevel,
      pass: isWithinRange ? '✅ PASS' : '❌ FAIL',
      summary: res.summary,
    });
  }

  // Print Table
  console.log('| Case | Candidate | Category | Expected | Actual Score | Match Level | Status |');
  console.log('| :--- | :--- | :--- | :---: | :---: | :---: | :---: |');
  for (const r of results) {
    console.log(`| **${r.code}** | ${r.name} | ${r.cat} | \`${r.expected}\` | **\`${r.actual}\`** | **${r.level}** | ${r.pass} |`);
  }

  const mae = absErrors.length > 0 ? absErrors.reduce((a, b) => a + b, 0) / absErrors.length : 0.0;
  const accuracy = (passedCases / totalCases) * 100.0;
  const fpr = (falsePositives / totalCases) * 100.0;

  console.log('\n================================================================================');
  console.log('                     📊 BẢNG TỔNG HỢP CHỈ SỐ METRICS');
  console.log('================================================================================');
  console.log(`  + Tổng số Test Cases: ${totalCases}`);
  console.log(`  + Số ca đạt chuẩn (Passed): ${passedCases} / ${totalCases} (${accuracy.toFixed(1)}%)`);
  console.log(`  + Mean Absolute Error (MAE): ${mae.toFixed(2)} điểm (Thang 100)`);
  console.log(`  + False Positive Rate (FPR): ${fpr.toFixed(1)}%`);
  console.log('================================================================================\n');
}

runSuite().catch(console.error).finally(() => prisma.$disconnect());
