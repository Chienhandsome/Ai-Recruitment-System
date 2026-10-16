import type { ReactNode } from "react"
import { CandidateHeader } from "@/components/candidate/candidate-header"
import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth-api"
import { getMyEntitlement } from "@/lib/billing-api"
import type { AuthProfile } from "@/types/auth"

export default async function CandidateLayout({
  children,
}: {
  children: ReactNode
}) {
  let profile: AuthProfile | null = null
  let packageCode: string | null = null

  try {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.access_token) {
      profile = await getCurrentProfile(session.access_token)
      try {
        const entitlement = await getMyEntitlement(
          session.access_token,
          "CANDIDATE",
        )
        packageCode = entitlement.packageCode ?? null
      } catch {
        packageCode = null
      }
    }
  } catch {
    profile = null
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F8FAFC] font-[family-name:var(--font-geist-sans)]">
      <CandidateHeader
        fullName={profile?.fullName ?? null}
        avatarUrl={profile?.avatarUrl ?? null}
        isAuthenticated={!!profile}
        packageCode={packageCode}
      />
      <main className="flex-1">{children}</main>
    </div>
  )
}
