import 'dotenv/config';

import { PrismaClient, Prisma, MatchLevel } from '@prisma/client';
import { ApplicationsConsumer } from '../src/modules/applications/applications.consumer';
import {
  APPLICATION_SNAPSHOT_VERSION,
  type ApplicationProfileSnapshot,
  toPrismaJson,
} from '../src/modules/applications/application-evaluation.snapshot';

const prisma = new PrismaClient();

function toStringArray(value: Prisma.JsonValue | null): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function parseWeight(val: unknown, fallback: number): number {
  if (val !== null && val !== undefined && !Number.isNaN(Number(val))) {
    const num = Number(val);
    if (num >= 0 && num <= 100) return num;
  }
  return fallback;
}

function buildSnapshot(
  app: any,
  capturedAt = new Date(),
): ApplicationProfileSnapshot {
  const profile = app.candidate;
  const resume = app.resume;
  const job = app.job;

  const weights = {
    skills: parseWeight(job.skillWeight, 40),
    experience: parseWeight(job.experienceWeight, 30),
    education: parseWeight(job.educationWeight, 15),
    other: parseWeight(job.otherWeight, 15),
  };

  const parsedData = resume?.parsedData as Record<string, any> | null;
  const languageData = Array.isArray(parsedData?.languageData)
    ? (parsedData!.languageData as Array<{ language?: string; proficiency?: string }>)
    : [];

  return {
    schemaVersion: APPLICATION_SNAPSHOT_VERSION,
    capturedAt: capturedAt.toISOString(),
    candidateIdentity: {
      id: profile.id,
      userId: profile.userId ?? null,
      fullName: profile.fullName ?? '',
      email: profile.email ?? '',
      phone: profile.phone ?? null,
    },
    resume: {
      id: resume.id,
      source: resume.source,
      originalFileName: resume.originalFileName,
      mimeType: resume.mimeType,
      fileSizeBytes: resume.fileSizeBytes,
      parsingStatus: resume.parsingStatus,
      createdAt: resume.createdAt instanceof Date ? resume.createdAt.toISOString() : new Date(resume.createdAt).toISOString(),
    },
    evaluationInput: {
      candidate_profile: {
        profile: {
          id: profile.id,
          candidate_user_id: profile.userId ?? null,
          desired_title: profile.desiredTitle ?? null,
          professional_summary: profile.professionalSummary ?? null,
          github_url: profile.githubUrl ?? null,
          linkedin_url: profile.linkedinUrl ?? null,
          portfolio_url: profile.portfolioUrl ?? null,
          address: profile.address ?? null,
          created_at: profile.createdAt instanceof Date ? profile.createdAt.toISOString() : new Date(profile.createdAt).toISOString(),
          updated_at: profile.updatedAt instanceof Date ? profile.updatedAt.toISOString() : new Date(profile.updatedAt).toISOString(),
        },
        work_experiences: (profile.workExperiences || []).map((exp: any) => ({
          id: exp.id,
          candidate_profile_id: profile.id,
          company_name: exp.companyName,
          position_title: exp.positionTitle,
          start_date: exp.startDate instanceof Date ? exp.startDate.toISOString() : new Date(exp.startDate).toISOString(),
          end_date: exp.endDate ? (exp.endDate instanceof Date ? exp.endDate.toISOString() : new Date(exp.endDate).toISOString()) : null,
          is_current: exp.isCurrent ?? false,
          description: exp.description ?? null,
          achievements: exp.achievements ?? null,
        })),
        educations: (profile.educations || []).map((edu: any) => ({
          id: edu.id,
          candidate_profile_id: profile.id,
          school_name: edu.schoolName,
          major: edu.major ?? null,
          degree: edu.degree ?? null,
          start_date: edu.startDate ? (edu.startDate instanceof Date ? edu.startDate.toISOString() : new Date(edu.startDate).toISOString()) : null,
          end_date: edu.endDate ? (edu.endDate instanceof Date ? edu.endDate.toISOString() : new Date(edu.endDate).toISOString()) : null,
          description: edu.description ?? null,
        })),
        projects: (profile.projects || []).map((proj: any) => ({
          id: proj.id,
          candidate_profile_id: profile.id,
          project_name: proj.projectName,
          project_role: proj.projectRole ?? null,
          description: proj.description ?? null,
          technologies: toStringArray(proj.technologies),
          project_url: proj.projectUrl ?? null,
          start_date: proj.startDate ? (proj.startDate instanceof Date ? proj.startDate.toISOString() : new Date(proj.startDate).toISOString()) : null,
          end_date: proj.endDate ? (proj.endDate instanceof Date ? proj.endDate.toISOString() : new Date(proj.endDate).toISOString()) : null,
        })),
        certificates: (profile.certificates || []).map((cert: any) => ({
          certificate_name: cert.certificateName,
          issuing_organization: cert.issuingOrganization ?? null,
          issue_date: cert.issueDate ? (cert.issueDate instanceof Date ? cert.issueDate.toISOString() : new Date(cert.issueDate).toISOString()) : null,
          expiry_date: cert.expiryDate ? (cert.expiryDate instanceof Date ? cert.expiryDate.toISOString() : new Date(cert.expiryDate).toISOString()) : null,
          credential_url: cert.credentialUrl ?? null,
        })),
        skills: (profile.candidateSkills || []).map((cs: any) => ({
          candidate_profile_id: profile.id,
          skill_id: cs.skillId,
          skill_name: cs.skill?.name ?? '',
          normalized_name: cs.skill?.normalizedName ?? '',
          proficiency_level: cs.proficiencyLevel ?? 'BEGINNER',
          is_primary: cs.isPrimary ?? false,
          source: cs.source ?? 'EXTRACTED',
        })),
        languages: languageData.map((l) => ({
          language: l.language ?? '',
          proficiency: l.proficiency ?? null,
        })),
      },
      job: {
        id: job.id,
        title: job.title,
        employment_type: job.employmentType,
        work_mode: job.workingModel,
        salary_min: job.minSalary === null ? null : Number(job.minSalary),
        salary_max: job.maxSalary === null ? null : Number(job.maxSalary),
        location: job.location ?? null,
        required_experience_years: job.requiredExperienceYears ?? 0,
        experience_level: job.experienceLevel,
        level_requirement_mode: job.levelRequirementMode,
        evaluation_date: capturedAt.toISOString(),
        description: job.description ?? '',
        requirements: job.requirements ?? '',
        benefits: job.benefits ?? null,
        status: job.status,
        published_at: job.publishedAt ? (job.publishedAt instanceof Date ? job.publishedAt.toISOString() : new Date(job.publishedAt).toISOString()) : null,
        created_at: job.createdAt instanceof Date ? job.createdAt.toISOString() : new Date(job.createdAt).toISOString(),
        updated_at: job.updatedAt instanceof Date ? job.updatedAt.toISOString() : new Date(job.updatedAt).toISOString(),
        closed_at: job.closedAt ? (job.closedAt instanceof Date ? job.closedAt.toISOString() : new Date(job.closedAt).toISOString()) : null,
        required_skills: (job.jobSkills || []).map((js: any) => ({
          job_id: job.id,
          skill_id: js.skillId,
          skill_name: js.skill?.name ?? '',
          normalized_name: js.skill?.normalizedName ?? '',
          is_mandatory: js.requirementType === 'MANDATORY',
          minimum_level: js.minimumProficiency ?? 'BEGINNER',
        })),
        required_certificates: (job.jobCertificates || []).map((jc: any) => ({
          certificate_name: jc.certificateName,
          is_mandatory: jc.requirementType === 'MANDATORY',
        })),
        ai_weights_config: weights,
      },
      weights,
    },
  };
}

interface RescoreSummary {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  oldScore: number | null;
  newScore: number;
  oldMatchLevel: string | null;
  newMatchLevel: string;
  mandatoryStatus: string;
  durationMs: number;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
}

async function main(): Promise<void> {
  const aiServiceUrl = (
    process.env.REEVALUATION_AI_SERVICE_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/$/, '');

  console.log('================================================================');
  console.log('  🚀 BẮT ĐẦU CHẤM LẠI TOÀN BỘ ĐIỂM SỐ AI VỚI MÃ NGUỒN MỚI');
  console.log(`  AI Service Endpoint: ${aiServiceUrl}`);
  console.log('================================================================\n');

  // Verify AI service health
  try {
    const healthRes = await fetch(`${aiServiceUrl}/health`, { signal: AbortSignal.timeout(5000) });
    if (!healthRes.ok) {
      throw new Error(`AI Service health returned ${healthRes.status}`);
    }
    const healthData = await healthRes.json();
    console.log(`✅ AI Service is healthy:`, healthData);
  } catch (err) {
    console.error(`❌ Không thể kết nối tới AI Service tại ${aiServiceUrl}! Hãy đảm bảo AI Service đang chạy trên port 8000.`);
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  await prisma.$connect();

  const applications = await prisma.application.findMany({
    include: {
      candidate: {
        include: {
          workExperiences: true,
          educations: true,
          projects: true,
          certificates: true,
          candidateSkills: {
            include: { skill: true },
          },
        },
      },
      resume: {
        select: {
          id: true,
          source: true,
          originalFileName: true,
          mimeType: true,
          fileSizeBytes: true,
          parsingStatus: true,
          createdAt: true,
          parsedData: {
            select: {
              languageData: true,
            },
          },
        },
      },
      job: {
        include: {
          jobSkills: {
            include: { skill: true },
          },
          jobCertificates: true,
        },
      },
      aiMatchingResults: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          overallScore: true,
          matchLevel: true,
        },
      },
    },
    orderBy: { appliedAt: 'asc' },
  });

  console.log(`📋 Tổng cộng tìm thấy ${applications.length} đơn ứng tuyển cần chấm điểm lại.\n`);

  const consumer = new ApplicationsConsumer(
    prisma as any,
    { subscribe: () => Promise.resolve() } as never,
    { markForRetry: () => Promise.resolve() } as never,
  );

  const results: RescoreSummary[] = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < applications.length; i++) {
    const app = applications[i];
    const candidateName = app.candidate?.fullName || 'N/A';
    const jobTitle = app.job?.title || 'N/A';
    const oldResult = app.aiMatchingResults[0];
    const oldScore = oldResult ? Number(oldResult.overallScore) : null;
    const oldLevel = oldResult ? oldResult.matchLevel : null;

    console.log(`[${i + 1}/${applications.length}] Đang xử lý: ${candidateName} -> ${jobTitle} (App: ${app.id})...`);

    const tStart = Date.now();
    try {
      // 1. Build and save fresh profile snapshot
      const snapshot = buildSnapshot(app);
      await prisma.application.update({
        where: { id: app.id },
        data: {
          profileSnapshot: toPrismaJson(snapshot),
        },
      });

      // 2. Call AI Service
      const evaluationRequest = {
        applicationId: app.id,
        application_id: app.id,
        schema_version: snapshot.schemaVersion,
        evaluation_date: snapshot.capturedAt,
        candidate_profile: snapshot.evaluationInput.candidate_profile,
        job: snapshot.evaluationInput.job,
        weights: snapshot.evaluationInput.weights,
      };

      const evalRes = await fetch(`${aiServiceUrl}/api/v1/matching/evaluate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(evaluationRequest),
      });

      if (!evalRes.ok) {
        throw new Error(`AI service returned ${evalRes.status}: ${await evalRes.text()}`);
      }

      const evalJson: any = await evalRes.json();

      // 3. Persist via ApplicationsConsumer logic
      await consumer.handleMessage({
        applicationId: app.id,
        status: 'COMPLETED',
        result: evalJson,
      });

      const durationMs = Date.now() - tStart;
      const newScore = Number(evalJson.overall_score);
      const newMatchLevel = evalJson.match_level;
      const mandatoryStatus = evalJson.mandatory_status || 'PASS';

      const diffStr = oldScore !== null
        ? `${oldScore.toFixed(1)} -> ${newScore.toFixed(1)} (${newScore >= oldScore ? '+' : ''}${(newScore - oldScore).toFixed(1)})`
        : `Mới: ${newScore.toFixed(1)}`;

      console.log(`    ✨ Xong (${durationMs}ms): Điểm: ${diffStr} | Cấp độ: ${newMatchLevel} | Bắt buộc: ${mandatoryStatus}`);

      results.push({
        applicationId: app.id,
        candidateName,
        jobTitle,
        oldScore,
        newScore,
        oldMatchLevel: oldLevel,
        newMatchLevel,
        mandatoryStatus,
        durationMs,
        status: 'SUCCESS',
      });
      successCount++;
    } catch (err: any) {
      const durationMs = Date.now() - tStart;
      console.error(`    ❌ Lỗi: ${err.message}`);
      results.push({
        applicationId: app.id,
        candidateName,
        jobTitle,
        oldScore,
        newScore: 0,
        oldMatchLevel: oldLevel,
        newMatchLevel: 'LOW',
        mandatoryStatus: 'ERROR',
        durationMs,
        status: 'FAILED',
        error: err.message,
      });
      failCount++;
    }
  }

  console.log('\n================================================================');
  console.log('  📊 TỔNG KẾT KẾT QUẢ CHẤM LẠI ĐIỂM SỐ HỆ THỐNG');
  console.log('================================================================');
  console.log(`- Tổng hồ sơ đã xử lý: ${applications.length}`);
  console.log(`- Thành công: ${successCount}`);
  console.log(`- Thất bại: ${failCount}`);

  console.log('\nBẢNG CHI TIẾT ĐIỂM SỐ:');
  console.log('-------------------------------------------------------------------------------------------------------------');
  console.log('| Ứng viên                 | Vị trí ứng tuyển                    | Điểm cũ | Điểm mới | Mức độ | Bắt buộc |');
  console.log('-------------------------------------------------------------------------------------------------------------');
  for (const r of results) {
    if (r.status === 'SUCCESS') {
      const cand = r.candidateName.padEnd(24).substring(0, 24);
      const job = r.jobTitle.padEnd(35).substring(0, 35);
      const oldS = (r.oldScore !== null ? r.oldScore.toFixed(1) : 'N/A').padStart(7);
      const newS = r.newScore.toFixed(1).padStart(8);
      const lvl = r.newMatchLevel.padStart(6);
      const mand = r.mandatoryStatus.padStart(8);
      console.log(`| ${cand} | ${job} | ${oldS} | ${newS} | ${lvl} | ${mand} |`);
    }
  }
  console.log('-------------------------------------------------------------------------------------------------------------\n');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error in rescore script:', err);
  prisma.$disconnect().finally(() => process.exit(1));
});
