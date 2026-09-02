'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getUnreadNotificationCount } from '@/lib/notification-api';
import { createClient } from '@/lib/supabase/client';

const navigation = [
  { href: '/candidate', label: 'Việc làm' },
  { href: '/candidate/applications', label: 'Đơn ứng tuyển' },
  { href: '/candidate/profile', label: 'Hồ sơ' },
];

export function CandidateNav() {
  const pathname = usePathname();
  const [hasUnread, setHasUnread] = useState(false);

  const checkUnread = async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await getUnreadNotificationCount(session.access_token);
      setHasUnread(res.unreadCount > 0);
    } catch {
      // Ignore background check error
    }
  };

  useEffect(() => {
    checkUnread();
  }, [pathname]);

  return (
    <nav aria-label="Điều hướng ứng viên" className="hidden items-center gap-1 sm:flex font-sans">
      {navigation.map((item) => {
        const active =
          item.href === '/candidate'
            ? pathname === '/candidate' || pathname.startsWith('/candidate/jobs/')
            : pathname.startsWith(item.href);

        const isApplications = item.href === '/candidate/applications';

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative rounded-xl px-3.5 py-2 text-sm font-semibold transition-all outline-none hover:bg-[#EFF6FF] hover:text-[#2563EB] focus-visible:ring-2 focus-visible:ring-blue-200 active:translate-y-px',
              active ? 'bg-[#EFF6FF] text-[#2563EB] font-bold' : 'text-slate-600',
            )}
          >
            <span className="flex items-center gap-1.5">
              {item.label}
              {isApplications && hasUnread && (
                <span
                  title="Có cập nhật trạng thái mới"
                  className="size-2 rounded-full bg-rose-500 animate-pulse ring-2 ring-white shadow-xs"
                />
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
