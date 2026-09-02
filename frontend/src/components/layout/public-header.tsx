"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, X, BrainCircuit, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function PublicHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [hasSession, setHasSession] = React.useState(false)

  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setHasSession(!!session?.access_token)
      } catch {
        setHasSession(false)
      }
    }
    checkSession()
  }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/60 font-sans">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <BrainCircuit className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold tracking-tight text-primary">
                SmartRecruit AI
              </span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <Link href="/candidate" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Việc làm
            </Link>
            <Link href="/#categories" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Ngành nghề
            </Link>
            <Link href="/register/recruiter" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Dành cho Nhà tuyển dụng
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {hasSession ? (
              <Button asChild className="rounded-xl font-bold">
                <Link href="/candidate" className="flex items-center gap-1.5">
                  Vào khu vực tìm việc
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="rounded-xl font-semibold">
                  <Link href="/login">Đăng nhập</Link>
                </Button>
                <Button asChild className="rounded-xl font-bold">
                  <Link href="/register/candidate">Đăng ký</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMobileMenu} aria-label="Toggle menu">
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-surface">
          <div className="space-y-1 px-4 pb-3 pt-2">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-base font-medium text-foreground hover:bg-muted hover:text-primary"
            >
              Trang chủ
            </Link>
            <Link
              href="/candidate"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-base font-medium text-muted-foreground hover:bg-muted hover:text-primary"
            >
              Việc làm
            </Link>
            <Link
              href="/#categories"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-base font-medium text-muted-foreground hover:bg-muted hover:text-primary"
            >
              Ngành nghề
            </Link>
            <Link
              href="/register/recruiter"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-base font-medium text-muted-foreground hover:bg-muted hover:text-primary"
            >
              Dành cho Nhà tuyển dụng
            </Link>
          </div>
          <div className="border-t border-muted pb-4 pt-4 px-4 space-y-2">
            {hasSession ? (
              <Button className="w-full justify-center rounded-xl font-bold" asChild>
                <Link href="/candidate" onClick={() => setIsMobileMenuOpen(false)}>
                  Vào khu vực tìm việc
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" className="w-full justify-center rounded-xl font-semibold" asChild>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    Đăng nhập
                  </Link>
                </Button>
                <Button className="w-full justify-center rounded-xl font-bold" asChild>
                  <Link href="/register/candidate" onClick={() => setIsMobileMenuOpen(false)}>
                    Đăng ký ứng viên
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
