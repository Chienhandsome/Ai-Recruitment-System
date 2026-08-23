import Link from "next/link"
import { BrainCircuit } from "lucide-react"
import { CandidateNav } from "@/components/candidate/candidate-nav"
import { UserMenu } from "@/components/candidate/user-menu"
import { NotificationBell } from "@/components/candidate/NotificationBell"

interface CandidateHeaderProps {
  fullName: string
  avatarUrl: string | null
}

export function CandidateHeader({ fullName, avatarUrl }: CandidateHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/60 font-sans">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/candidate" className="flex items-center gap-2">
            <BrainCircuit className="h-7 w-7 text-primary" />
            <span className="text-lg font-bold tracking-tight text-primary hidden sm:inline-block">
              SmartRecruit AI
            </span>
          </Link>

          <CandidateNav />

          <div className="flex items-center gap-3">
            <NotificationBell />
            <UserMenu fullName={fullName} avatarUrl={avatarUrl} />
          </div>
        </div>
      </div>
    </header>
  )
}
