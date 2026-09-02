'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  BrainCircuit,
  Menu,
  X,
  Briefcase,
  FileText,
  User,
  LogOut,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { CandidateNav } from '@/components/candidate/candidate-nav';
import { UserMenu } from '@/components/candidate/user-menu';
import { NotificationBell } from '@/components/candidate/NotificationBell';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface CandidateHeaderProps {
  fullName: string | null;
  avatarUrl: string | null;
  isAuthenticated?: boolean;
}

export function CandidateHeader({
  fullName,
  avatarUrl,
  isAuthenticated = false,
}: CandidateHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    router.replace('/login');
    router.refresh();
  };

  const navLinks = [
    { href: '/candidate', label: 'Việc làm', icon: Briefcase },
    ...(isAuthenticated
      ? [
          { href: '/candidate/applications', label: 'Đơn ứng tuyển', icon: FileText },
          { href: '/candidate/profile', label: 'Hồ sơ', icon: User },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/60 font-sans">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/candidate" className="flex items-center gap-2">
            <BrainCircuit className="h-7 w-7 text-primary" />
            <span className="text-lg font-bold tracking-tight text-primary">
              SmartRecruit AI
            </span>
          </Link>

          {isAuthenticated ? (
            <CandidateNav />
          ) : (
            <nav className="hidden sm:flex items-center gap-6">
              <Link
                href="/candidate"
                className={`text-sm font-semibold transition ${
                  pathname.startsWith('/candidate')
                    ? 'text-primary font-bold'
                    : 'text-slate-600 hover:text-primary'
                }`}
              >
                Việc làm
              </Link>
            </nav>
          )}

          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated && fullName ? (
              <>
                <NotificationBell />
                <UserMenu fullName={fullName} avatarUrl={avatarUrl} />
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" asChild className="rounded-xl font-semibold text-xs">
                  <Link href="/login">Đăng nhập</Link>
                </Button>
                <Button asChild className="rounded-xl font-bold text-xs">
                  <Link href="/register/candidate">Đăng ký</Link>
                </Button>
              </div>
            )}

            {/* Mobile Hamburger button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:hidden transition"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-t bg-surface px-4 py-4 sm:hidden animate-in slide-in-from-top-2 duration-200 shadow-xl">
          {isAuthenticated && fullName && (
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
              <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{fullName}</p>
                <p className="text-xs text-slate-500">Ứng viên</p>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === '/candidate'
                  ? pathname === '/candidate' || pathname.startsWith('/candidate/jobs/')
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                    active
                      ? 'bg-blue-50 text-[#2563EB] font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="size-4 shrink-0" />
                Đăng xuất
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="w-full justify-center rounded-xl" asChild>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <LogIn className="size-4 mr-2" />
                    Đăng nhập
                  </Link>
                </Button>
                <Button className="w-full justify-center rounded-xl font-bold" asChild>
                  <Link href="/register/candidate" onClick={() => setMobileMenuOpen(false)}>
                    <UserPlus className="size-4 mr-2" />
                    Đăng ký ứng viên
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
