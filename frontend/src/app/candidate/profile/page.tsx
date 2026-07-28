import { requireProfile } from "@/lib/server-profile"
import { ProfileForm } from "@/components/candidate/profile-form"
import { SkillsEditor } from "@/components/candidate/skills-editor"
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
      // Skills will be empty on first load — that's fine
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Hồ sơ cá nhân
        </h1>
        <p className="mt-2 text-muted-foreground">
          Cập nhật thông tin cá nhân để nhà tuyển dụng hiểu rõ hơn về bạn
        </p>

        <div className="mt-8 space-y-6">
          <ProfileForm
            fullName={profile.fullName}
            email={profile.email}
            phone={profile.phone}
            avatarUrl={profile.avatarUrl}
            address={profile.candidateProfile?.address ?? null}
            githubUrl={profile.candidateProfile?.githubUrl ?? null}
            linkedinUrl={profile.candidateProfile?.linkedinUrl ?? null}
          />

          <SkillsEditor initialSkills={initialSkills} />
        </div>
      </div>
    </div>
  )
}
