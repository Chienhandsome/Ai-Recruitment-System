'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompanyLogoProps {
  name: string;
  logoUrl?: string | null;
  className?: string;
}

export function CompanyLogo({ name, logoUrl, className }: CompanyLogoProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div
      className={cn(
        'flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white text-primary',
        className,
      )}
      aria-hidden={!logoUrl || imageFailed}
    >
      {logoUrl && !imageFailed ? (
        <Image
          src={logoUrl}
          alt={`Logo ${name}`}
          width={64}
          height={64}
          unoptimized
          loader={({ src }) => src}
          className="h-full w-full object-contain p-1.5"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Building2 className="size-5" strokeWidth={1.8} />
      )}
    </div>
  );
}
