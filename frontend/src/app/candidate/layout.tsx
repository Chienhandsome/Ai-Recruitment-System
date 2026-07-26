import type { ReactNode } from "react"
import { CandidateHeader } from "@/components/candidate/candidate-header"
import { requireProfile } from "@/lib/server-profile"

export default async function CandidateLayout({
  children,
}: {
  children: ReactNode
}) {
  const profile = await requireProfile("CANDIDATE")

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CandidateHeader
        fullName={profile.fullName}
        avatarUrl={profile.avatarUrl}
      />
      <main className="flex-1">{children}</main>
    </div>
  )
}
