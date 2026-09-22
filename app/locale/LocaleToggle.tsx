'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { LOCALE_COOKIE } from '@/lib/i18n';
import { useLocale } from './LocaleProvider';

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Same mechanics as `VersionToggle`: cookie + server refresh, no flash. */
export default function LocaleToggle({ variant }: { variant: 'v2' | 'legacy' }) {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const isEn = locale === 'en';

  function flip() {
    const next = isEn ? 'fr' : 'en';
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    startTransition(() => router.refresh());
  }

  if (variant === 'legacy') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isEn}
        aria-label="Français / English"
        onClick={flip}
        disabled={pending}
        className="flex items-center gap-2 disabled:opacity-60"
      >
        <span className="text-[13px] text-gray-500">{isEn ? 'English' : 'Français'}</span>
        <span
          className="relative block h-6 w-[42px] rounded-full transition-colors"
          style={{ backgroundColor: isEn ? '#378ADD' : '#d1d5db' }}
        >
          <span
            className="absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition-all"
            style={{ left: isEn ? 21 : 3 }}
          />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isEn}
      aria-label="Français / English"
      onClick={flip}
      disabled={pending}
      className="flex cursor-pointer items-center gap-2.5 rounded-full px-1 py-1 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-60"
    >
      <span className="text-[13px] text-ink-muted">{isEn ? 'English' : 'Français'}</span>
      <span
        className="relative block h-6 w-[42px] rounded-full transition-colors"
        style={{ backgroundColor: isEn ? 'var(--color-accent)' : 'var(--color-line-strong)' }}
      >
        <span
          className="absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(26,25,23,.28)] transition-all duration-200"
          style={{ left: pending ? 12 : isEn ? 21 : 3 }}
        />
      </span>
    </button>
  );
}
