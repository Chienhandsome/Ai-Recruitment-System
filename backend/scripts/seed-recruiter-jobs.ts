import 'dotenv/config';
import {
  EmploymentType,
  ExperienceLevel,
  JobStatus,
  PrismaClient,
  ProficiencyLevel,
  SkillRequirementType,
  WorkingModel,
} from '@prisma/client';

const prisma = new PrismaClient();
const RECRUITER_EMAIL = 'cerkvena291@gmail.com';

type SeedJob = {
  code: string;
  title: string;
  category: string;
  description: string;
  requirements: string;
  benefits: string;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  workingModel: WorkingModel;
  location: string;
  minSalary: number;
  maxSalary: number;
  experienceYears: number;
  skills: string[];
  requiresProofOfWork?: boolean;
};

const commonBenefits =
  'Thu nhập cạnh tranh; xét tăng lương định kỳ; bảo hiểm theo quy định; ngân sách học tập; thiết bị làm việc; 12 ngày phép năm và hoạt động gắn kết đội ngũ.';

const jobs: SeedJob[] = [
  {
    code: 'CRK-202608-001',
    title: 'Frontend Developer (React/TypeScript)',
    category: 'it-software',
    description:
      'Phát triển giao diện web cho sản phẩm tuyển dụng, xây dựng component dùng chung, tối ưu hiệu năng và phối hợp với thiết kế, backend, QA để bàn giao tính năng.',
    requirements:
      'Có từ 2 năm phát triển frontend; thành thạo React, TypeScript, HTML/CSS; hiểu REST API, Git và kiểm thử giao diện; tư duy sản phẩm tốt.',
    benefits: commonBenefits,
    employmentType: EmploymentType.FULL_TIME,
    experienceLevel: ExperienceLevel.MIDDLE,
    workingModel: WorkingModel.HYBRID,
    location: 'Hà Nội',
    minSalary: 18000000,
    maxSalary: 30000000,
    experienceYears: 2,
    skills: ['react', 'typescript', 'javascript', 'git', 'problem-solving'],
    requiresProofOfWork: true,
  },
  {
    code: 'CRK-202608-002',
    title: 'Backend Developer (Node.js/NestJS)',
    category: 'it-software',
    description:
      'Thiết kế API và dịch vụ backend, phát triển nghiệp vụ, tối ưu truy vấn dữ liệu, viết kiểm thử và tham gia cải thiện độ ổn định của hệ thống.',
    requirements:
      'Từ 2 năm với Node.js; có kinh nghiệm NestJS, TypeScript, PostgreSQL và thiết kế REST API; hiểu Docker, bảo mật ứng dụng và Git.',
    benefits: commonBenefits,
    employmentType: EmploymentType.FULL_TIME,
    experienceLevel: ExperienceLevel.MIDDLE,
    workingModel: WorkingModel.HYBRID,
    location: 'TP. Hồ Chí Minh',
    minSalary: 20000000,
    maxSalary: 35000000,
    experienceYears: 2,
    skills: ['node.js', 'nestjs', 'typescript', 'postgresql', 'docker'],
    requiresProofOfWork: true,
  },
  {
    code: 'CRK-202608-003',
    title: 'Java Backend Engineer (Spring Boot)',
    category: 'it-software',
    description:
      'Xây dựng dịch vụ Java cho hệ thống giao dịch, thiết kế API, xử lý dữ liệu và phối hợp triển khai các tính năng có yêu cầu cao về hiệu năng.',
    requirements:
      'Từ 3 năm Java/Spring Boot; nắm vững SQL, REST API, mô hình microservices và kiểm thử; có khả năng phân tích sự cố sản xuất.',
    benefits: commonBenefits,
    employmentType: EmploymentType.FULL_TIME,
    experienceLevel: ExperienceLevel.MIDDLE,
    workingModel: WorkingModel.HYBRID,
    location: 'Hà Nội',
    minSalary: 25000000,
    maxSalary: 40000000,
    experienceYears: 3,
    skills: ['java', 'spring-boot', 'sql', 'microservices', 'git'],
    requiresProofOfWork: true,
  },
  {
    code: 'CRK-202608-004',
    title: 'Fullstack Developer (.NET/Vue.js)',
    category: 'it-software',
    description:
      'Phát triển xuyên suốt các tính năng web từ giao diện đến API, bảo trì hệ thống hiện có và tham gia thiết kế giải pháp kỹ thuật cùng đội sản phẩm.',
    requirements:
      'Từ 3 năm kinh nghiệm; vững C#, .NET, Vue.js và SQL Server; hiểu REST API, Git và nguyên tắc viết mã dễ bảo trì.',
    benefits: commonBenefits,
    employmentType: EmploymentType.FULL_TIME,
    experienceLevel: ExperienceLevel.MIDDLE,
    workingModel: WorkingModel.ON_SITE,
    location: 'Hà Nội',
    minSalary: 22000000,
    maxSalary: 35000000,
    experienceYears: 3,
    skills: ['c-sharp', 'dotnet', 'vue.js', 'sql-server', 'git'],
    requiresProofOfWork: true,
  },
  {
    code: 'CRK-202608-005',
    title: 'Mobile Developer (React Native)',
    category: 'it-software',
    description:
      'Phát triển và duy trì ứng dụng di động đa nền tảng, tích hợp API, tối ưu trải nghiệm người dùng và chất lượng phát hành trên iOS/Android.',
    requirements:
      'Từ 2 năm phát triển mobile; thành thạo React Native, JavaScript/TypeScript; hiểu vòng đời ứng dụng, REST API và quy trình phát hành store.',
    benefits: commonBenefits,
    employmentType: EmploymentType.FULL_TIME,
    experienceLevel: ExperienceLevel.MIDDLE,
    workingModel: WorkingModel.HYBRID,
    location: 'TP. Hồ Chí Minh',
    minSalary: 18000000,
    maxSalary: 32000000,
    experienceYears: 2,
    skills: ['react-native', 'typescript', 'javascript', 'rest-api', 'git'],
    requiresProofOfWork: true,
  },
  {
    code: 'CRK-202608-006',
    title: 'QA Automation Engineer',
    category: 'it-software',
    description:
      'Thiết kế chiến lược kiểm thử, xây dựng bộ test tự động cho web/API, quản lý lỗi và phối hợp với kỹ sư để ngăn lỗi hồi quy.',
    requirements:
      'Từ 2 năm QA; có kinh nghiệm automation, API testing, Selenium hoặc Playwright; biết SQL, quản lý test case và làm việc theo Agile.',
    benefits: commonBenefits,
    employmentType: EmploymentType.FULL_TIME,
    experienceLevel: ExperienceLevel.MIDDLE,
    workingModel: WorkingModel.HYBRID,
    location: 'Đà Nẵng',
    minSalary: 16000000,
    maxSalary: 28000000,
    experienceYears: 2,
    skills: ['test-automation', 'api-testing', 'selenium', 'sql', 'agile'],
  },
  {
    code: 'CRK-202608-007',
    title: 'Data Analyst',
    category: 'it-software',
    description:
      'Khai thác dữ liệu kinh doanh, xây dựng dashboard, theo dõi KPI và chuyển hóa kết quả phân tích thành đề xuất có thể hành động.',
    requirements:
      'Từ 2 năm phân tích dữ liệu; thành thạo SQL, Excel và Power BI; biết làm sạch dữ liệu, trực quan hóa và trình bày insight cho đơn vị nghiệp vụ.',
    benefits: commonBenefits,
    employmentType: EmploymentType.FULL_TIME,
    experienceLevel: ExperienceLevel.MIDDLE,
    workingModel: WorkingModel.HYBRID,
    location: 'Hà Nội',
    minSalary: 18000000,
    maxSalary: 30000000,
    experienceYears: 2,
    skills: [
      'data-analysis',
      'sql',
      'power-bi',
      'advanced-excel',
      'analytical-thinking',
    ],
    requiresProofOfWork: true,
  },
  {
    code: 'CRK-202608-008',
    title: 'AI/Machine Learning Engineer',
    category: 'it-software',
    description:
      'Xây dựng pipeline dữ liệu và mô hình máy học, đánh giá chất lượng, triển khai dịch vụ suy luận và theo dõi hiệu năng mô hình sau phát hành.',
    requirements:
      'Từ 2 năm với Python và machine learning; có kinh nghiệm scikit-learn hoặc PyTorch, xử lý dữ liệu và triển khai mô hình; nền tảng thống kê tốt.',
    benefits: commonBenefits,
    employmentType: EmploymentType.FULL_TIME,
    experienceLevel: ExperienceLevel.MIDDLE,
    workingModel: WorkingModel.HYBRID,
    location: 'TP. Hồ Chí Minh',
    minSalary: 25000000,
    maxSalary: 45000000,
    experienceYears: 2,
    skills: ['python', 'machine-learning', 'pytorch', 'pandas', 'mlops'],
    requiresProofOfWork: true,
  },
  {
    code: 'CRK-202608-009',
    title: 'DevOps/Cloud Engineer',
    category: 'it-software',
    description:
      'Xây dựng CI/CD, quản lý hạ tầng cloud và container, giám sát hệ thống, tự động hóa vận hành và cải thiện độ tin cậy dịch vụ.',
    requirements:
      'Từ 3 năm DevOps; vững AWS, Docker, Kubernetes, Linux và CI/CD; biết Infrastructure as Code, monitoring và xử lý sự cố.',
    benefits: commonBenefits,
    employmentType: EmploymentType.FULL_TIME,
    experienceLevel: ExperienceLevel.MIDDLE,
    workingModel: WorkingModel.REMOTE,
    location: 'Toàn quốc',
    minSalary: 28000000,
    maxSalary: 45000000,
    experienceYears: 3,
    skills: ['aws', 'docker', 'kubernetes', 'linux', 'cicd'],
  },
  {
    code: 'CRK-202608-010',
    title: 'Software Business Analyst',
    category: 'it-software',
    description:
      'Khảo sát nghiệp vụ, mô hình hóa quy trình, viết đặc tả và user story, làm cầu nối giữa khách hàng, sản phẩm, kỹ thuật và QA.',
    requirements:
      'Từ 2 năm BA phần mềm; thành thạo phân tích yêu cầu, BPMN/UML, user story và Jira; giao tiếp, điều phối stakeholder tốt.',
    benefits: commonBenefits,
    employmentType: EmploymentType.FULL_TIME,
    experienceLevel: ExperienceLevel.MIDDLE,
    workingModel: WorkingModel.HYBRID,
    location: 'Hà Nội',
    minSalary: 18000000,
    maxSalary: 30000000,
    experienceYears: 2,
    skills: [
      'business-analysis',
      'requirements-analysis',
      'bpmn',
      'user-stories',
      'jira',
    ],
  },
  {
    code: 'CRK-202608-011',
    title: 'Kế toán Tổng hợp',
    category: 'accounting-finance',
    description:
      'Hạch toán nghiệp vụ, đối chiếu số liệu, theo dõi công nợ, lập báo cáo tài chính và phối hợp hoàn thiện hồ sơ thuế định kỳ.',
    requirements:
      'Từ 2 năm kế toán tổng hợp; nắm VAS, thuế, Excel và phần mềm MISA; cẩn thận, có khả năng kiểm soát chứng từ và thời hạn.',
    benefits: commonBenefits,
    employmentType: EmploymentType.FULL_TIME,
    experienceLevel: ExperienceLevel.MIDDLE,
    workingModel: WorkingModel.ON_SITE,
    location: 'TP. Hồ Chí Minh',
    minSalary: 14000000,
    maxSalary: 20000000,
    experienceYears: 2,
    skills: [
      'general-accounting',
      'financial-reporting',
      'vas',
      'misa-accounting',
      'advanced-excel',
    ],
  },
  {
    code: 'CRK-202608-012',
    title: 'Kế toán Công nợ Phải thu',
    category: 'accounting-finance',
    description:
      'Theo dõi hóa đơn và công nợ khách hàng, đối chiếu thanh toán, lập báo cáo tuổi nợ và phối hợp thu hồi các khoản đến hạn.',
    requirements:
      'Từ 2 năm kế toán công nợ; thành thạo Excel, đối chiếu dữ liệu và lập báo cáo; giao tiếp rõ ràng với bộ phận kinh doanh và khách hàng.',
    benefits: commonBenefits,
    employmentType: EmploymentType.FULL_TIME,
    experienceLevel: ExperienceLevel.MIDDLE,
    workingModel: WorkingModel.ON_SITE,
    location: 'Bình Dương',
    minSalary: 13000000,
    maxSalary: 18000000,
    experienceYears: 2,
    skills: [
      'accounts-receivable',
      'bookkeeping',
      'bank-reconciliation',
      'microsoft-excel',
      'attention-to-detail',
    ],
  },
  {
    code: 'CRK-202608-013',
    title: 'Chuyên viên Tuyển dụng',
    category: 'hr-admin',
    description:
      'Tiếp nhận nhu cầu, tìm nguồn ứng viên, sàng lọc CV, điều phối phỏng vấn và theo dõi dữ liệu tuyển dụng từ đầu đến khi nhận việc.',
    requirements:
      'Từ 2 năm tuyển dụng; có kỹ năng sourcing, sàng lọc và phỏng vấn; quản lý pipeline tốt, giao tiếp chuyên nghiệp và có tư duy dữ liệu.',
    benefits: commonBenefits,
    employmentType: EmploymentType.FULL_TIME,
    experienceLevel: ExperienceLevel.MIDDLE,
    workingModel: WorkingModel.HYBRID,
    location: 'Hà Nội',
    minSalary: 14000000,
    maxSalary: 22000000,
    experienceYears: 2,
    skills: [
      'talent-acquisition',
      'recruitment',
      'cv-screening',
      'candidate-interviewing',
      'communication',
    ],
  },
  {
    code: 'CRK-202608-014',
    title: 'Chuyên viên C&B',
    category: 'hr-admin',
    description:
      'Thực hiện chấm công, tính lương, quản lý phúc lợi và bảo hiểm; cập nhật dữ liệu nhân sự và bảo đảm tuân thủ quy định lao động.',
    requirements:
      'Từ 2 năm C&B; hiểu payroll, BHXH, thuế TNCN và luật lao động Việt Nam; Excel tốt, bảo mật và chính xác với dữ liệu.',
    benefits: commonBenefits,
    employmentType: EmploymentType.FULL_TIME,
    experienceLevel: ExperienceLevel.MIDDLE,
    workingModel: WorkingModel.ON_SITE,
    location: 'TP. Hồ Chí Minh',
    minSalary: 15000000,
    maxSalary: 23000000,
    experienceYears: 2,
    skills: [
      'compensation-benefits',
      'payroll-processing',
      'social-insurance',
      'vietnam-labor-law',
      'advanced-excel',
    ],
  },
  {
    code: 'CRK-202608-015',
    title: 'Digital Marketing Specialist',
    category: 'marketing-pr',
    description:
      'Lập kế hoạch và vận hành chiến dịch digital, quản lý nội dung và quảng cáo, đo lường hiệu quả theo phễu và đề xuất tối ưu ngân sách.',
    requirements:
      'Từ 2 năm digital marketing; có kinh nghiệm Google/Meta Ads, GA4, content và báo cáo hiệu quả; tư duy thử nghiệm và bám sát mục tiêu.',
    benefits: commonBenefits,
    employmentType: EmploymentType.FULL_TIME,
    experienceLevel: ExperienceLevel.MIDDLE,
    workingModel: WorkingModel.HYBRID,
    location: 'Hà Nội',
    minSalary: 15000000,
    maxSalary: 25000000,
    experienceYears: 2,
    skills: [
      'digital-marketing',
      'google-ads',
      'facebook-ads',
      'google-analytics-4',
      'content-marketing',
    ],
    requiresProofOfWork: true,
  },
  {
    code: 'CRK-202608-016',
    title: 'B2B Sales Executive',
    category: 'sales-business',
    description:
      'Tìm kiếm khách hàng doanh nghiệp, tư vấn giải pháp, quản lý pipeline, thương lượng và phối hợp triển khai để đạt mục tiêu doanh thu.',
    requirements:
      'Từ 2 năm bán hàng B2B; có kỹ năng prospecting, tư vấn, đàm phán và chốt hợp đồng; sử dụng CRM và quản lý chỉ tiêu tốt.',
    benefits:
      'Lương cơ bản cạnh tranh; hoa hồng không giới hạn; thưởng theo kết quả; đầy đủ bảo hiểm; ngân sách đào tạo và lộ trình lên quản lý.',
    employmentType: EmploymentType.FULL_TIME,
    experienceLevel: ExperienceLevel.MIDDLE,
    workingModel: WorkingModel.HYBRID,
    location: 'TP. Hồ Chí Minh',
    minSalary: 12000000,
    maxSalary: 25000000,
    experienceYears: 2,
    skills: [
      'b2b-sales',
      'sales-prospecting',
      'consultative-selling',
      'sales-closing',
      'crm-management',
    ],
  },
  {
    code: 'CRK-202608-017',
    title: 'Customer Success Specialist',
    category: 'sales-business',
    description:
      'Đồng hành cùng khách hàng sau bán, hướng dẫn sử dụng, theo dõi mức độ ứng dụng, xử lý vướng mắc và nhận diện cơ hội gia hạn, mở rộng.',
    requirements:
      'Từ 1 năm customer success hoặc CSKH; giao tiếp và xử lý vấn đề tốt; biết quản lý tài khoản, CRM và phối hợp nhiều phòng ban.',
    benefits: commonBenefits,
    employmentType: EmploymentType.FULL_TIME,
    experienceLevel: ExperienceLevel.JUNIOR,
    workingModel: WorkingModel.HYBRID,
    location: 'Hà Nội',
    minSalary: 12000000,
    maxSalary: 20000000,
    experienceYears: 1,
    skills: [
      'customer-success',
      'customer-service',
      'account-management',
      'crm-management',
      'customer-orientation',
    ],
  },
  {
    code: 'CRK-202608-018',
    title: 'Chuyên viên Hành chính Văn phòng',
    category: 'hr-admin',
    description:
      'Quản lý văn phòng, tài liệu, lịch họp và nhà cung cấp; hỗ trợ tổ chức sự kiện nội bộ, công tác và các hoạt động hành chính hằng ngày.',
    requirements:
      'Từ 1 năm hành chính; sử dụng tốt Microsoft Office; kỹ năng tổ chức, quản lý lịch và hồ sơ; chủ động, cẩn thận và giao tiếp tốt.',
    benefits: commonBenefits,
    employmentType: EmploymentType.FULL_TIME,
    experienceLevel: ExperienceLevel.JUNIOR,
    workingModel: WorkingModel.ON_SITE,
    location: 'Đà Nẵng',
    minSalary: 10000000,
    maxSalary: 15000000,
    experienceYears: 1,
    skills: [
      'office-administration',
      'document-management',
      'calendar-management',
      'microsoft-office',
      'organization-skills',
    ],
  },
  {
    code: 'CRK-202608-019',
    title: 'Chuyên viên Mua hàng',
    category: 'logistics-supplychain',
    description:
      'Tìm kiếm và đánh giá nhà cung cấp, lấy báo giá, thương lượng điều khoản, quản lý đơn mua hàng và theo dõi tiến độ giao hàng.',
    requirements:
      'Từ 2 năm mua hàng; có kỹ năng sourcing, đàm phán, quản lý nhà cung cấp và PO; Excel tốt, hiểu quy trình kiểm soát chi phí.',
    benefits: commonBenefits,
    employmentType: EmploymentType.FULL_TIME,
    experienceLevel: ExperienceLevel.MIDDLE,
    workingModel: WorkingModel.ON_SITE,
    location: 'Bình Dương',
    minSalary: 14000000,
    maxSalary: 22000000,
    experienceYears: 2,
    skills: [
      'procurement',
      'strategic-sourcing',
      'purchase-order-management',
      'supplier-management',
      'negotiation',
    ],
  },
  {
    code: 'CRK-202608-020',
    title: 'UI/UX Designer',
    category: 'design-media',
    description:
      'Nghiên cứu nhu cầu người dùng, thiết kế luồng, wireframe và prototype; phát triển giao diện nhất quán và phối hợp với kỹ sư trong quá trình triển khai.',
    requirements:
      'Từ 2 năm UI/UX; thành thạo Figma, wireframe, prototype và design system; có portfolio thể hiện quy trình giải quyết vấn đề thiết kế.',
    benefits: commonBenefits,
    employmentType: EmploymentType.FULL_TIME,
    experienceLevel: ExperienceLevel.MIDDLE,
    workingModel: WorkingModel.HYBRID,
    location: 'TP. Hồ Chí Minh',
    minSalary: 18000000,
    maxSalary: 30000000,
    experienceYears: 2,
    skills: ['figma', 'ui-design', 'ux-design', 'wireframing', 'prototyping'],
    requiresProofOfWork: true,
  },
];

async function main() {
  const recruiterUser = await prisma.user.findUnique({
    where: { email: RECRUITER_EMAIL },
    include: {
      recruiterProfile: true,
      userRoles: { include: { role: true } },
    },
  });

  if (!recruiterUser?.recruiterProfile) {
    throw new Error(`Không tìm thấy recruiter profile cho ${RECRUITER_EMAIL}.`);
  }
  if (recruiterUser.status !== 'ACTIVE') {
    throw new Error(`${RECRUITER_EMAIL} không ở trạng thái ACTIVE.`);
  }
  if (!recruiterUser.userRoles.some(({ role }) => role.code === 'RECRUITER')) {
    throw new Error(`${RECRUITER_EMAIL} không có role RECRUITER.`);
  }

  const categorySlugs = [...new Set(jobs.map((job) => job.category))];
  const categories = await prisma.jobCategory.findMany({
    where: { slug: { in: categorySlugs } },
  });
  const categoryBySlug = new Map(categories.map((item) => [item.slug, item]));
  const missingCategories = categorySlugs.filter(
    (slug) => !categoryBySlug.has(slug),
  );
  if (missingCategories.length) {
    throw new Error(`Thiếu job category: ${missingCategories.join(', ')}.`);
  }

  const normalizedNames = [...new Set(jobs.flatMap((job) => job.skills))];
  const skills = await prisma.skill.findMany({
    where: { normalizedName: { in: normalizedNames }, status: 'ACTIVE' },
  });
  const skillByName = new Map(
    skills.map((skill) => [skill.normalizedName, skill]),
  );
  const missingSkills = normalizedNames.filter(
    (name) => !skillByName.has(name),
  );
  if (missingSkills.length) {
    throw new Error(
      `Thiếu canonical skill đang hoạt động: ${missingSkills.join(', ')}.`,
    );
  }

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 60);
  let created = 0;
  let updated = 0;

  for (const job of jobs) {
    const existing = await prisma.jobPosting.findUnique({
      where: { jobCode: job.code },
    });
    if (
      existing &&
      existing.recruiterId !== recruiterUser.recruiterProfile.id
    ) {
      throw new Error(`Job code ${job.code} đang thuộc recruiter khác.`);
    }

    const categoryId = categoryBySlug.get(job.category)!.id;
    const data = {
      title: job.title,
      recruiterId: recruiterUser.recruiterProfile.id,
      departmentId: null,
      categoryId,
      description: job.description,
      requirements: job.requirements,
      benefits: job.benefits,
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
      workingModel: job.workingModel,
      minSalary: job.minSalary,
      maxSalary: job.maxSalary,
      currency: 'VND',
      location: job.location,
      requiredExperienceYears: job.experienceYears,
      autoShortlistThreshold: 70,
      autoRejectThreshold: 35,
      rejectOnMissingMandatory: true,
      skillWeight: 45,
      experienceWeight: 30,
      educationWeight: 10,
      otherWeight: 15,
      expiryDate,
      requiresProofOfWork: job.requiresProofOfWork ?? false,
    };

    const saved = existing
      ? await prisma.jobPosting.update({ where: { id: existing.id }, data })
      : await prisma.jobPosting.create({
          data: { ...data, jobCode: job.code, status: JobStatus.DRAFT },
        });

    await prisma.$transaction([
      prisma.jobSkill.deleteMany({ where: { jobId: saved.id } }),
      prisma.jobSkill.createMany({
        data: job.skills.map((normalizedName, index) => ({
          jobId: saved.id,
          skillId: skillByName.get(normalizedName)!.id,
          requirementType:
            index < 3
              ? SkillRequirementType.MANDATORY
              : SkillRequirementType.NICE_TO_HAVE,
          minimumProficiency:
            index < 3
              ? ProficiencyLevel.INTERMEDIATE
              : ProficiencyLevel.BEGINNER,
          weight: index < 3 ? 1.5 : 0.75,
          minYearsExperience:
            index < 3 ? Math.min(job.experienceYears, 2) : null,
        })),
      }),
    ]);

    if (existing) updated += 1;
    else created += 1;
  }

  const seeded = await prisma.jobPosting.findMany({
    where: {
      recruiterId: recruiterUser.recruiterProfile.id,
      jobCode: { in: jobs.map((job) => job.code) },
    },
    select: {
      jobCode: true,
      title: true,
      status: true,
      _count: { select: { jobSkills: true } },
    },
    orderBy: { jobCode: 'asc' },
  });
  if (
    seeded.length !== jobs.length ||
    seeded.some((job) => job._count.jobSkills !== 5)
  ) {
    throw new Error('Kiểm tra sau seed thất bại: thiếu job hoặc job skill.');
  }

  console.log(
    `Recruiter jobs ready for ${RECRUITER_EMAIL}: ${created} created, ${updated} updated.`,
  );
  for (const job of seeded) {
    console.log(
      `${job.jobCode} | ${job.status} | ${job.title} | ${job._count.jobSkills} skills`,
    );
  }
}

main()
  .catch((error) => {
    console.error('Error seeding recruiter jobs:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
