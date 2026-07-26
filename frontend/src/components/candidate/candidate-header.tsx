import Link from "next/link"
import { BrainCircuit } from "lucide-react"
import { UserMenu } from "@/components/candidate/user-menu"

interface CandidateHeaderProps {
  fullName: string
  avatarUrl: string | null
}

export function CandidateHeader({ fullName, avatarUrl }: CandidateHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side: Logo */}
          <Link href="/candidate/dashboard" className="flex items-center gap-2">
            <BrainCircuit className="h-7 w-7 text-primary" />
            <span className="text-lg font-bold tracking-tight text-primary hidden sm:inline-block">
              SmartRecruit AI
            </span>
          </Link>

          {/* Center: Navigation links */}
          <nav className="hidden sm:flex items-center gap-6">
            <Link
              href="/candidate/dashboard"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Trang chủ
            </Link>
            <Link
              href="/candidate/jobs"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Việc làm
            </Link>
          </nav>

          {/* Right side: User Menu */}
          <div className="flex items-center">
            <UserMenu fullName={fullName} avatarUrl={avatarUrl} />
          </div>
        </div>
      </div>
    </header>
  )
}
