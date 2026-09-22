'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import VersionToggle from '../../version/VersionToggle';
import LocaleToggle from '../../locale/LocaleToggle';
import { useT } from '../../locale/useT';

function Mark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden>
      <circle cx="3.5" cy="10" r="1.8" />
      <circle cx="16.5" cy="4" r="1.8" />
      <circle cx="16.5" cy="10" r="1.8" />
      <circle cx="16.5" cy="16" r="1.8" />
      <path d="M5.3 10h3.2M8.5 10c3 0 3-6 6-6M8.5 10h6M8.5 10c3 0 3 6 6 6" />
    </svg>
  );
}

export default function NavV2() {
  const pathname = usePathname();
  const t = useT();

  const LINKS = [
    { href: '/', label: t.navV2.explorer },
    { href: '/playground', label: t.navV2.playground },
  ];

  return (
    <nav className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-6 px-6 sm:px-8">
        <div className="flex min-w-0 items-center gap-6 sm:gap-10">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 text-accent">
            <Mark />
            <span className="font-display text-[21px] leading-none tracking-[0.01em] text-ink">
              Logits
            </span>
          </Link>
          <div className="flex items-center gap-1">
            {LINKS.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-accent-soft text-accent'
                      : 'text-ink-muted hover:bg-surface-alt hover:text-ink'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <LocaleToggle variant="v2" />
          <VersionToggle variant="v2" />
        </div>
      </div>
    </nav>
  );
}
