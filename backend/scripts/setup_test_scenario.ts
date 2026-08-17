import 'dotenv/config';
import { PrismaClient, JobStatus, EmploymentType, ExperienceLevel, SkillRequirementType, ProficiencyLevel, MatchLevel, ApplicationStage, ApplicationProcessingStatus } from '@prisma/client';
import { createSupabaseAdminClient } from '../src/infrastructure/supabase/supabase-admin-client';

const prisma = new PrismaClient();

async function main() {
  console.log('================================================================================');
  console.log('  🔥 KHỞI TẠO KỊCH BẢN THỬ THÁCH CỰC ĐẠI (STRESS TEST CẢNH GIỚI VÙNG XÁM CỦA AI)');
  console.log('================================================================================\n');

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY?.trim() ?? process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required.');
  }

  const supabase = createSupabaseAdminClient(supabaseUrl, supabaseSecretKey);

  // --------------------------------------------------------------------------------
  // 1. Lấy hoặc Tạo HR
  // --------------------------------------------------------------------------------
  const hrEmail = 'hr_english@recruitment.com';
  const hrPassword = 'Password123@';
  
  const { data: hrUserList } = await supabase.auth.admin.listUsers();
  let hrAuthId = hrUserList?.users?.find((u) => u.email === hrEmail)?.id;

  if (!hrAuthId) {
    const { data: newHr } = await supabase.auth.admin.createUser({
      email: hrEmail,
      password: hrPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Hội đồng Tuyển dụng Quốc tế' },
    });
    hrAuthId = newHr.user!.id;
  }

  const recruiterProfile = await prisma.recruiterProfile.findFirst({
    where: { user: { email: hrEmail } },
  });

  if (!recruiterProfile) throw new Error('RecruiterProfile not found');

  // --------------------------------------------------------------------------------
  // 2. TẠO JD KHẮT KHE: VỊ TRÍ SENIOR / HEAD OF ACADEMIC (YÊU CẦU 4 NĂM KINH NGHIỆM)
  // --------------------------------------------------------------------------------
  console.log('📄 1. Đang đăng JD cấp cao: Trưởng Ban Đào tạo & Phát triển Chương trình Song ngữ...');

  const skillCategory = await prisma.skillCategory.upsert({
    where: { name: 'Giáo dục & Sư phạm' },
    update: {},
    create: { name: 'Giáo dục & Sư phạm' },
  });

  const skillsData = [
    { name: 'Quản lý Đội ngũ Giáo viên & Giám sát Chuyên môn (Academic Leadership)', norm: 'academic leadership teacher training' },
    { name: 'Phát triển Chương trình Song ngữ Quốc tế (K-12 Bilingual Curriculum Development)', norm: 'bilingual curriculum development' },
    { name: 'Khảo thí & Đánh giá Chuẩn Cambridge / IB Diploma (Cambridge & IB Assessment)', norm: 'cambridge and ib assessment' },
    { name: 'Ứng dụng Hệ thống Quản trị Học tập EdTech LMS (Canvas/Moodle)', norm: 'edtech lms canvas moodle' },
    { name: 'Tư vấn Lộ trình Du học & Học bổng Quốc tế (College Counseling)', norm: 'college counseling' },
  ];

  const createdSkills = [];
  for (const s of skillsData) {
    const sk = await prisma.skill.upsert({
      where: { normalizedName: s.norm },
      update: {},
      create: { name: s.name, normalizedName: s.norm, categoryId: skillCategory.id },
    });
    createdSkills.push(sk);
  }

  const jobPosting = await prisma.jobPosting.upsert({
    where: { jobCode: 'JOB-HEAD-ACADEMIC-2026' },
    update: {
      status: JobStatus.PUBLISHED,
      title: 'Trưởng Ban Đào tạo & Phát triển Chương trình Song ngữ (Head of ESL & Bilingual Academic)',
      requiredExperienceYears: 4,
      experienceLevel: ExperienceLevel.SENIOR,
    },
    create: {
      jobCode: 'JOB-HEAD-ACADEMIC-2026',
      title: 'Trưởng Ban Đào tạo & Phát triển Chương trình Song ngữ (Head of ESL & Bilingual Academic)',
      recruiterId: recruiterProfile.id,
      departmentId: recruiterProfile.departmentId,
      status: JobStatus.PUBLISHED,
      employmentType: EmploymentType.FULL_TIME,
      experienceLevel: ExperienceLevel.SENIOR,
      requiredExperienceYears: 4, // YÊU CẦU 4 NĂM
      minSalary: 45000000,
      maxSalary: 70000000,
      currency: 'VND',
      location: 'Hà Nội (Khu Đô thị Ngoại Giao Đoàn)',
      description: 'Chịu trách nhiệm lãnh đạo toàn diện khối học thuật tiếng Anh, quản lý đội ngũ 15 giáo viên bản ngữ và Việt Nam, thẩm định giáo trình song ngữ K-12, bảo đảm chất lượng đầu ra theo chuẩn Cambridge Checkpoint, IGCSE và IB Diploma.',
      requirements: 'Tối thiểu 4 năm kinh nghiệm quản lý học vụ trường quốc tế, sở hữu bằng Thạc sĩ Giáo dục (Master of Education/TESOL), nắm vững tiêu chuẩn kiểm định quốc tế Cambridge và IB Diploma, có kinh nghiệm triển khai LMS Canvas.',
      benefits: 'Lương 45 - 70 triệu, thưởng hiệu suất hàng năm, miễn 100% học phí cho con em tại trường quốc tế.',
    },
  });

  await prisma.jobSkill.deleteMany({ where: { jobId: jobPosting.id } });
  await prisma.jobSkill.createMany({
    data: [
      { jobId: jobPosting.id, skillId: createdSkills[0].id, requirementType: SkillRequirementType.MANDATORY, minimumProficiency: ProficiencyLevel.EXPERT },
      { jobId: jobPosting.id, skillId: createdSkills[1].id, requirementType: SkillRequirementType.MANDATORY, minimumProficiency: ProficiencyLevel.ADVANCED },
      { jobId: jobPosting.id, skillId: createdSkills[2].id, requirementType: SkillRequirementType.MANDATORY, minimumProficiency: ProficiencyLevel.ADVANCED },
      { jobId: jobPosting.id, skillId: createdSkills[3].id, requirementType: SkillRequirementType.PREFERRED, minimumProficiency: ProficiencyLevel.INTERMEDIATE },
      { jobId: jobPosting.id, skillId: createdSkills[4].id, requirementType: SkillRequirementType.PREFERRED, minimumProficiency: ProficiencyLevel.BEGINNER },
    ],
  });

  console.log(`  + Đã tạo JD Senior thử thách cao: '${jobPosting.title}' (ID: ${jobPosting.id})`);

  // --------------------------------------------------------------------------------
  // 3. TẠO ỨNG VIÊN "ĐA CHIỀU / VÙNG XÁM": CÓ NĂNG LỰC NHƯNG THIẾU KINH NGHIỆM & THIẾU IB DIPLOMA
  // --------------------------------------------------------------------------------
  console.log('\n🎓 2. Đang tạo hồ sơ ứng viên "Vùng xám" (Thiếu 1 năm kinh nghiệm, khuyết kỹ năng IB)...');

  const candEmail = 'candidate_difficult@recruitment.com';
  const candPassword = 'Password123@';
  
  let candAuthId = hrUserList?.users?.find((u) => u.email === candEmail)?.id;

  const candidateProfile = await prisma.candidateProfile.upsert({
    where: { userId: candAuthId },
    update: {
      fullName: 'Trần Hoàng Nam (M.Ed Melbourne / DELTA)',
      desiredTitle: 'Bilingual Academic Coordinator & Curriculum Specialist',
      professionalSummary: 'Thạc sĩ Lý luận & Phương pháp Giảng dạy Tiếng Anh (Master of TESOL - University of Melbourne). 3.0 năm kinh nghiệm điều phối học thuật tại trường song ngữ, quản lý dự án biên soạn giáo trình Cambridge Lower Secondary, ứng dụng Moodle LMS.',
    },
    create: {
      userId: candAuthId,
      email: candEmail,
      fullName: 'Trần Hoàng Nam (M.Ed Melbourne / DELTA)',
      desiredTitle: 'Bilingual Academic Coordinator & Curriculum Specialist',
      phone: '0987654321',
      professionalSummary: 'Thạc sĩ Lý luận & Phương pháp Giảng dạy Tiếng Anh (Master of TESOL - University of Melbourne). 3.0 năm kinh nghiệm điều phối học thuật tại trường song ngữ, quản lý dự án biên soạn giáo trình Cambridge Lower Secondary, ứng dụng Moodle LMS.',
    },
  });

  // Kỹ năng ứng viên:
  // - Có: Teacher Mentoring (tương đương Academic Leadership)
  // - Có: Cambridge Lower Secondary Syllabus (khớp 1 phần với Cambridge & IB, nhưng KHÔNG CÓ IB Diploma)
  // - Có: Moodle LMS
  // - Hoàn toàn KHÔNG CÓ: College Counseling (Tư vấn du học)
  const candSkillsData = [
    { name: 'Teacher Mentoring & Lesson Observation', norm: 'teacher mentoring lesson observation' },
    { name: 'Cambridge Secondary Syllabus Design', norm: 'cambridge secondary syllabus design' },
    { name: 'Moodle LMS Platform', norm: 'moodle lms platform' },
  ];

  await prisma.candidateSkill.deleteMany({ where: { candidateId: candidateProfile.id } });
  for (const cs of candSkillsData) {
    const sk = await prisma.skill.upsert({
      where: { normalizedName: cs.norm },
      update: {},
      create: { name: cs.name, normalizedName: cs.norm, categoryId: skillCategory.id },
    });
    await prisma.candidateSkill.create({
      data: {
        candidateId: candidateProfile.id,
        skillId: sk.id,
        proficiencyLevel: ProficiencyLevel.ADVANCED,
      },
    });
  }

  // Học vấn: Cực khủng (Thạc sĩ TESOL Đại học Melbourne Úc)
  await prisma.education.deleteMany({ where: { candidateProfileId: candidateProfile.id } });
  await prisma.education.create({
    data: {
      candidateProfileId: candidateProfile.id,
      schoolName: 'The University of Melbourne, Australia',
      major: 'Master of TESOL (Teaching English to Speakers of Other Languages)',
      degree: 'Thạc sĩ Xuất sắc (Master Degree with High Distinction)',
      startDate: new Date('2020-02-01'),
      endDate: new Date('2022-01-30'),
    },
  });

  // Kinh nghiệm: 3.0 năm (2022-03-01 đến 2025-03-01) -> THIẾU 1 NĂM SO VỚI YÊU CẦU 4 NĂM
  await prisma.workExperience.deleteMany({ where: { candidateProfileId: candidateProfile.id } });
  await prisma.workExperience.create({
    data: {
      candidateProfileId: candidateProfile.id,
      companyName: 'Trường Phổ thông Song ngữ Quốc tế Gateway',
      positionTitle: 'Academic Coordinator & Lead ESL Instructor',
      startDate: new Date('2022-03-01'),
      endDate: new Date('2025-03-01'),
      description: 'Điều phối chuyên môn cho tổ hợp 8 giáo viên, thực hiện dự giờ đánh giá năng lực sư phạm, biên soạn đề cương giáo trình Cambridge Checkpoint. Tuyệt đối chưa phụ trách chương trình Tú tài Quốc tế IB Diploma và không tham gia mảng tư vấn du học.',
      achievements: 'Nâng tỷ lệ học viên đạt điểm A* môn Tiếng Anh Cambridge lên 35%.',
    },
  });

  // --------------------------------------------------------------------------------
  // 4. Tạo Resume & Nộp Hồ Sơ
  // --------------------------------------------------------------------------------
  const resume = await prisma.resume.create({
    data: {
      candidateId: candidateProfile.id,
      originalFileName: 'Tran_Hoang_Nam_Master_TESOL_CV.pdf',
      objectPath: `resumes/${candAuthId}/Tran_Hoang_Nam_CV.pdf`,
      mimeType: 'application/pdf',
      fileSizeBytes: 1024 * 500,
      parsingStatus: 'PARSED',
    },
  });

  const application = await prisma.application.upsert({
    where: { jobId_candidateId: { jobId: jobPosting.id, candidateId: candidateProfile.id } },
    update: {
      resumeId: resume.id,
      processingStatus: ApplicationProcessingStatus.COMPLETED,
      currentStage: ApplicationStage.SCREENING,
    },
    create: {
      jobId: jobPosting.id,
      candidateId: candidateProfile.id,
      resumeId: resume.id,
      processingStatus: ApplicationProcessingStatus.COMPLETED,
      currentStage: ApplicationStage.SCREENING,
    },
  });

  // --------------------------------------------------------------------------------
  // 5. Gửi sang AI Matching Engine (FastAPI) để Thực Hiện Chẩn Đoán Thắt Cổ Chai
  // --------------------------------------------------------------------------------
  console.log('\n🤖 3. Gửi sang AI Matching Engine (FastAPI) thực hiện chẩn đoán đa chiều...');

  const evalPayload = {
    application_id: application.id,
    candidate_profile: {
      profile: {
        desired_title: candidateProfile.desiredTitle,
        summary: candidateProfile.professionalSummary,
      },
      educations: [
        {
          school_name: 'The University of Melbourne, Australia',
          major: 'Master of TESOL (Teaching English to Speakers of Other Languages)',
          degree: 'Thạc sĩ Xuất sắc',
        },
      ],
      work_experiences: [
        {
          company_name: 'Trường Phổ thông Song ngữ Quốc tế Gateway',
          position_title: 'Academic Coordinator & Lead ESL Instructor',
          description: 'Điều phối chuyên môn cho tổ hợp 8 giáo viên, thực hiện dự giờ đánh giá năng lực sư phạm, biên soạn đề cương giáo trình Cambridge Checkpoint. Tuyệt đối chưa phụ trách chương trình Tú tài Quốc tế IB Diploma và không tham gia mảng tư vấn du học.',
          achievements: 'Nâng tỷ lệ học viên đạt điểm A* môn Tiếng Anh Cambridge lên 35%.',
          start_date: '2022-03-01',
          end_date: '2025-03-01',
        },
      ],
      projects: [],
      skills: [
        { skill_name: 'Teacher Mentoring & Lesson Observation', proficiency_level: 'ADVANCED' },
        { skill_name: 'Cambridge Secondary Syllabus Design', proficiency_level: 'ADVANCED' },
        { skill_name: 'Moodle LMS Platform', proficiency_level: 'ADVANCED' },
      ],
      certificates: [
        { certificate_name: 'Master of TESOL (Melbourne)' },
      ],
    },
    job: {
      title: jobPosting.title,
      experience_level: 'SENIOR', // Khắt khe: Ngưỡng 0.82
      employment_type: 'FULL_TIME',
      description: jobPosting.description,
      requirements: jobPosting.requirements,
      required_experience_years: 4.0, // Yêu cầu 4.0 năm
      required_skills: [
        { skill_name: 'Quản lý Đội ngũ Giáo viên & Giám sát Chuyên môn (Academic Leadership)', is_mandatory: true, minimum_level: 'EXPERT' },
        { skill_name: 'Phát triển Chương trình Song ngữ Quốc tế (K-12 Bilingual Curriculum Development)', is_mandatory: true, minimum_level: 'ADVANCED' },
        { skill_name: 'Khảo thí & Đánh giá Chuẩn Cambridge / IB Diploma (Cambridge & IB Assessment)', is_mandatory: true, minimum_level: 'ADVANCED' },
        { skill_name: 'Ứng dụng Hệ thống Quản trị Học tập EdTech LMS (Canvas/Moodle)', is_mandatory: false, minimum_level: 'INTERMEDIATE' },
        { skill_name: 'Tư vấn Lộ trình Du học & Học bổng Quốc tế (College Counseling)', is_mandatory: false, minimum_level: 'BEGINNER' },
      ],
      required_certificates: [],
    },
  };

  const aiResponse = await fetch('http://127.0.0.1:8000/api/v1/matching/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(evalPayload),
  });

  if (!aiResponse.ok) {
    throw new Error(`AI Service error: ${aiResponse.status} ${await aiResponse.text()}`);
  }

  const result: any = await aiResponse.json();

  console.log('\n================================================================================');
  console.log('             📊 KẾT QUẢ CHẨN ĐOÁN THẮT CỔ CHAI CỦA AI MODEL V3');
  console.log('================================================================================');
  console.log(`  • Overall Compatibility Score : ${result.overall_score.toFixed(2)} / 100 (${result.match_level})`);
  console.log(`  • Skills Score (Trọng số 40%) : ${result.skills_score.toFixed(2)} / 100`);
  console.log(`  • Exp Score    (Trọng số 30%) : ${result.experience_score.toFixed(2)} / 100 (Bị phạt do 3.0 năm < 4.0 năm)`);
  console.log(`  • Edu Score    (Trọng số 15%) : ${result.education_score.toFixed(2)} / 100 (Master TESOL Melbourne)`);
  console.log(`  • Other Score  (Trọng số 15%) : ${result.other_score.toFixed(2)} / 100`);

  console.log('\n  • Matched Skills (Kỹ năng đạt):');
  result.matched_skills.forEach((m: any) => console.log(`     [✓] ${m.name} (Bắt buộc: ${m.isMandatory})`));

  if (result.missing_skills && result.missing_skills.length > 0) {
    console.log('\n  • Missing Skills (Kỹ năng thiếu hụt):');
    result.missing_skills.forEach((m: any) => console.log(`     [✗] ${m.name} (Bắt buộc: ${m.isMandatory})`));
  }

  console.log('\n  • Điểm mạnh (Strengths):');
  result.strengths.forEach((s: string) => console.log(`     ⭐ ${s}`));

  if (result.gaps && result.gaps.length > 0) {
    console.log('\n  • Điểm thiếu sót (Gaps):');
    result.gaps.forEach((g: string) => console.log(`     ⚠️ ${g}`));
  }

  console.log(`\n  • Tóm tắt đánh giá: \n     ${result.summary}`);
  console.log('================================================================================\n');

  // Lưu vào DB
  await prisma.aiMatchingResult.upsert({
    where: { applicationId_version: { applicationId: application.id, version: 1 } },
    update: {
      overallScore: result.overall_score,
      matchLevel: result.match_level as MatchLevel,
      skillScore: result.skills_score,
      experienceScore: result.experience_score,
      educationScore: result.education_score,
      projectScore: result.other_score,
      matchedSkills: result.matched_skills,
      missingSkills: result.missing_skills,
      missingRequiredSkills: result.missing_required_skills,
      strengths: result.strengths,
      gaps: result.gaps,
      reasoningSummary: result.summary,
    },
    create: {
      applicationId: application.id,
      version: 1,
      overallScore: result.overall_score,
      matchLevel: result.match_level as MatchLevel,
      skillScore: result.skills_score,
      experienceScore: result.experience_score,
      educationScore: result.education_score,
      projectScore: result.other_score,
      matchedSkills: result.matched_skills,
      missingSkills: result.missing_skills,
      missingRequiredSkills: result.missing_required_skills,
      strengths: result.strengths,
      gaps: result.gaps,
      reasoningSummary: result.summary,
    },
  });

  console.log('✅ Đã cập nhật kết quả chẩn đoán vào cơ sở dữ liệu!');
}

main()
  .catch((e) => {
    console.error('Error running test scenario:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
