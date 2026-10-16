"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Crown, LogOut, Sparkles, User } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"

interface UserMenuProps {
  fullName: string
  avatarUrl: string | null
  packageCode?: string | null
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function packageBadge(packageCode?: string | null) {
  if (packageCode === "CANDIDATE_PREMIUM") {
    return {
      label: "Premium",
      icon: Crown,
      className: "bg-amber-500 text-white ring-amber-200",
    }
  }
  if (packageCode === "CANDIDATE_PRO") {
    return {
      label: "Pro",
      icon: Sparkles,
      className: "bg-sky-500 text-white ring-sky-200",
    }
  }
  return null
}

export function UserMenu({ fullName, avatarUrl, packageCode }: UserMenuProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const badge = packageBadge(packageCode)
  const BadgeIcon = badge?.icon

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full p-1 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Menu người dùng"
        >
          <span className="relative inline-flex">
            <Avatar className="h-9 w-9">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={fullName} />
              ) : null}
              <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
            </Avatar>
            {badge && BadgeIcon && (
              <span
                className={`absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full ring-2 ring-white ${badge.className}`}
                title={`Gói ${badge.label}`}
                aria-hidden
              >
                <BadgeIcon className="size-2.5" strokeWidth={2.5} />
              </span>
            )}
          </span>
          <span className="text-sm font-medium text-foreground hidden sm:inline-block max-w-[150px] truncate">
            {fullName}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{fullName}</p>
            <p className="text-xs text-muted-foreground">
              {badge ? `Ứng viên · ${badge.label}` : "Ứng viên"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/candidate/profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Hồ sơ
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/candidate/billing" className="flex items-center gap-2">
            {BadgeIcon ? (
              <BadgeIcon className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Gói dịch vụ
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
