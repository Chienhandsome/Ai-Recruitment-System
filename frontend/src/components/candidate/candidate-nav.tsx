'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  { href: '/candidate', label: 'Việc làm' },
  { href: '/candidate/profile', label: 'Hồ sơ' },
];

export function CandidateNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Điều hướng ứng viên" className="hidden items-center gap-1 sm:flex">
      {navigation.map((item) => {
        const active =
          item.href === '/candidate'
            ? pathname === '/candidate' || pathname.startsWith('/candidate/jobs/')
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-semibold transition-colors outline-none hover:bg-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-ring active:translate-y-px',
              active ? 'bg-secondary text-primary' : 'text-muted-foreground',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
