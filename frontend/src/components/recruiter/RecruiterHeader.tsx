/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  BrainCircuit,
  Calendar,
  ChevronDown,
  CreditCard,
  LogOut,
  Mail,
  User,
  Users,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { RecruiterProfileData } from '@/lib/recruiter-api';
import { RecruiterNotificationBell } from './RecruiterNotificationBell';

export type RecruiterSection = 'dashboard' | 'jobs' | 'interviews' | 'talent-pool';

const sections = [
  { id: 'dashboard', label: 'Dashboard', href: '/recruiter/dashboard' },
  { id: 'jobs', label: 'Quản lý Bài đăng', href: '/recruiter/jobs' },
  {
    id: 'interviews',
    label: 'Lịch phỏng vấn',
    href: '/recruiter/dashboard?tab=interviews',
    icon: Calendar,
  },
  { id: 'talent-pool', label: 'Kho ứng viên', href: '/recruiter/talent-pool', icon: Users },
] as const;

export function RecruiterHeader({
  token,
  profile,
  activeSection,
  onNavigate,
  onOpenProfile,
  onNavigateToApplication,
}: {
  token: string;
  profile: RecruiterProfileData | null;
  activeSection: RecruiterSection;
  onNavigate?: (section: RecruiterSection) => void;
  onOpenProfile: () => void;
  onNavigateToApplication?: (applicationId: string, jobId?: string) => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const activeLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeLink.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [activeSection]);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  const goToInterviews = () =>
    onNavigate ? onNavigate('interviews') : router.push('/recruiter/dashboard?tab=interviews');

  return (
    <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-4 px-4 sm:px-6">
        <Link
          href="/recruiter/dashboard"
          className="flex h-16 shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#2563EB] to-indigo-500 text-white shadow-md shadow-blue-500/20">
            <BrainCircuit className="size-6" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-[#0F172A]">
            SmartRecruit
            <span className="ml-1.5 rounded bg-blue-50 px-1.5 py-0.5 font-mono text-xs font-bold text-[#2563EB]">
              AI HR
            </span>
          </span>
        </Link>
        <nav
          aria-label="Không gian tuyển dụng"
          className="order-3 -mx-1 mb-3 flex w-full items-center gap-1 overflow-x-auto rounded-xl border border-blue-100 bg-[#EFF6FF] p-1 lg:order-none lg:mx-0 lg:mb-0 lg:w-auto"
        >
          {sections.map((section) => {
            const Icon = 'icon' in section ? section.icon : null;
            return (
              <Link
                key={section.id}
                ref={activeSection === section.id ? activeLink : undefined}
                href={section.href}
                aria-current={activeSection === section.id ? 'page' : undefined}
                onClick={(event) => {
                  if (
                    onNavigate &&
                    section.id !== 'talent-pool' &&
                    !event.metaKey &&
                    !event.ctrlKey &&
                    !event.shiftKey &&
                    !event.altKey
                  ) {
                    event.preventDefault();
                    onNavigate(section.id);
                  }
                }}
                className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ${activeSection === section.id ? 'bg-[#2563EB] text-white shadow-sm' : 'text-[#1F2937] hover:bg-white/80 hover:text-[#2563EB]'}`}
              >
                {Icon && <Icon className="size-3.5" />}
                {section.label}
              </Link>
            );
          })}
          <Link
            href="/recruiter/billing"
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold text-[#1F2937] hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <CreditCard className="size-3.5" />
            Gói dịch vụ
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {token && (
            <RecruiterNotificationBell
              token={token}
              onNavigateToInterviews={goToInterviews}
              onNavigateToApplication={
                onNavigateToApplication ??
                ((id) =>
                  router.push(`/recruiter/dashboard?applicationId=${encodeURIComponent(id)}`))
              }
            />
          )}
          <div ref={menu} className="relative border-l border-slate-200 pl-3">
            <button
              ref={trigger}
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-label="Tài khoản tuyển dụng"
              className="flex items-center gap-2 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <span className="flex size-9 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-slate-100 font-bold text-slate-600">
                {profile?.user?.avatarUrl ? (
                  <img src={profile.user.avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  profile?.user?.fullName?.charAt(0) || 'R'
                )}
              </span>
              <span className="hidden max-w-32 xl:block">
                <span className="block truncate text-xs font-bold text-slate-900">
                  {profile?.user?.fullName || 'Recruiter'}
                </span>
                <span className="block truncate text-[10px] text-slate-500">
                  {profile?.title || 'Hiring Team'}
                </span>
              </span>
              <ChevronDown className="size-3.5 text-slate-500" />
            </button>
            {menuOpen && (
              <div
                onBlur={(event) => {
                  if (!menu.current?.contains(event.relatedTarget)) setMenuOpen(false);
                }}
                className="absolute right-0 top-full z-50 mt-3 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
              >
                <div className="mb-1 border-b border-slate-100 px-3 py-2">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {profile?.user?.fullName || 'Recruiter'}
                  </p>
                  <p className="truncate text-xs text-slate-500">{profile?.user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenProfile();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <User className="size-4" />
                  Hồ sơ cá nhân
                </button>
                <Link
                  href="/recruiter/billing"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <CreditCard className="size-4" />
                  Gói dịch vụ & Hạn mức
                </Link>
                <Link
                  href="/recruiter/talent-pool"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Users className="size-4" />
                  Ứng viên đang tìm việc
                </Link>
                <Link
                  href="/recruiter/talent-invitations"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Mail className="size-4" />
                  Lời mời đã gửi
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    await createClient().auth.signOut();
                    window.location.href = '/login';
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="size-4" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
