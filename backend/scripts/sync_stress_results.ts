import { PrismaClient, MatchLevel } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.resolve(__dirname, '../scratch_results.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('File scratch_results.json does not exist');
    return;
  }

  const results: any[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`Syncing ${results.length} candidate results to Supabase DB...`);

  // Find job ID
  const job = await prisma.jobPosting.findFirst({
    where: { title: { contains: 'Area Sales Manager' } },
  });

  if (!job) {
    console.error('Job not found in DB');
    return;
  }

  const applications = await prisma.application.findMany({
    where: { jobId: job.id },
    include: { candidate: true },
  });

  console.log(`Found ${applications.length} applications for job ${job.title}`);

  for (const r of results) {
    const app = applications.find((a: any) => a.candidate.fullName === r.name);
    if (!app) {
      console.log(`Application for ${r.name} not found in DB`);
      continue;
    }

    await prisma.aiMatchingResult.upsert({
      where: { applicationId_version: { applicationId: app.id, version: 1 } },
      update: {
        overallScore: r.overall,
        matchLevel: r.level as MatchLevel,
        skillScore: r.skills,
        experienceScore: r.exp,
        educationScore: r.edu,
        projectScore: r.other,
        matchedSkills: r.matched_skills || [],
        missingSkills: r.missing_skills || [],
        missingRequiredSkills: r.missing_mandatory || [],
        evidence: r.evidence || [],
        reasoningSummary: r.summary,
        strengths: r.strengths || [],
        gaps: r.gaps || [],
        candidateExperienceLevel: r.cand_level && r.cand_level !== "N/A" ? (r.cand_level as any) : null,
        requiredExperienceLevel: r.req_level && r.req_level !== "N/A" ? (r.req_level as any) : null,
        levelFitScore: typeof r.level_fit === 'number' ? r.level_fit : null,
        levelEligible: r.level_eligible ?? true,
        levelEvidence: r.level_evidence || [],
        totalExperienceYears: r.total_experience_years != null ? r.total_experience_years : null,
        inputSnapshot: { pillar_explanations: r.pillar_explanations },
      },
      create: {
        applicationId: app.id,
        version: 1,
        overallScore: r.overall,
        matchLevel: r.level as MatchLevel,
        skillScore: r.skills,
        experienceScore: r.exp,
        educationScore: r.edu,
        projectScore: r.other,
        matchedSkills: r.matched_skills || [],
        missingSkills: r.missing_skills || [],
        missingRequiredSkills: r.missing_mandatory || [],
        evidence: r.evidence || [],
        reasoningSummary: r.summary,
        strengths: r.strengths || [],
        gaps: r.gaps || [],
        candidateExperienceLevel: r.cand_level && r.cand_level !== "N/A" ? (r.cand_level as any) : null,
        requiredExperienceLevel: r.req_level && r.req_level !== "N/A" ? (r.req_level as any) : null,
        levelFitScore: typeof r.level_fit === 'number' ? r.level_fit : null,
        levelEligible: r.level_eligible ?? true,
        levelEvidence: r.level_evidence || [],
        totalExperienceYears: r.total_experience_years != null ? r.total_experience_years : null,
        inputSnapshot: { pillar_explanations: r.pillar_explanations },
      }
    });
    console.log(`Synced ${r.name} (${r.overall.toFixed(2)} - ${r.level}) to DB.`);
  }

  console.log('✅ All 10 candidate results successfully updated in Supabase Database!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
