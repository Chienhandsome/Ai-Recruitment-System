import { requireProfile } from "@/lib/server-profile"
import { ProfilePageClient } from "@/components/candidate/profile-page-client"
import { getCandidateSkills } from "@/lib/candidate-api"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function CandidateProfilePage() {
  const profile = await requireProfile("CANDIDATE")

  // Fetch candidate skills server-side
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  let initialSkills: Awaited<ReturnType<typeof getCandidateSkills>> = []
  if (session?.access_token) {
    try {
      initialSkills = await getCandidateSkills(session.access_token)
    } catch {
      // Skills will be empty on first load
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Hồ sơ cá nhân
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Thông tin chi tiết về trình độ, kỹ năng, kinh nghiệm và học vấn của bạn
          </p>
        </div>

        <div>
          <ProfilePageClient
            fullName={profile.fullName}
            email={profile.email}
            phone={profile.phone}
            avatarUrl={profile.avatarUrl}
            address={profile.candidateProfile?.address ?? null}
            desiredTitle={profile.candidateProfile?.desiredTitle ?? null}
            professionalSummary={profile.candidateProfile?.professionalSummary ?? null}
            githubUrl={profile.candidateProfile?.githubUrl ?? null}
            linkedinUrl={profile.candidateProfile?.linkedinUrl ?? null}
            portfolioUrl={profile.candidateProfile?.portfolioUrl ?? null}
            workExperiences={profile.candidateProfile?.workExperiences ?? []}
            educations={profile.candidateProfile?.educations ?? []}
            projects={profile.candidateProfile?.projects ?? []}
            certificates={profile.candidateProfile?.certificates ?? []}
            initialSkills={initialSkills}
          />
        </div>
      </div>
    </div>
  )
}
