import type { ReactNode } from "react"
import { CandidateHeader } from "@/components/candidate/candidate-header"
import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth-api"
import type { AuthProfile } from "@/types/auth"

export default async function CandidateLayout({
  children,
}: {
  children: ReactNode
}) {
  let profile: AuthProfile | null = null

  try {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.access_token) {
      profile = await getCurrentProfile(session.access_token)
    }
  } catch {
    profile = null
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <CandidateHeader
        fullName={profile?.fullName ?? null}
        avatarUrl={profile?.avatarUrl ?? null}
        isAuthenticated={!!profile}
      />
      <main className="flex-1">{children}</main>
    </div>
  )
}
