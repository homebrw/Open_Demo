'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { UI_VERSION_COOKIE } from '@/lib/uiVersion';
import { useUiVersion } from './UiVersionProvider';

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Writes the preference as a cookie and asks the server to re-render. The cookie
 * is what `app/layout.tsx` reads, so the swapped UI arrives already rendered —
 * no flash, no hydration mismatch.
 */
export default function VersionToggle({ variant }: { variant: 'v2' | 'legacy' }) {
  const version = useUiVersion();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const isNew = version === 'v2';

  function flip() {
    const next = isNew ? 'legacy' : 'v2';
    document.cookie = `${UI_VERSION_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    startTransition(() => router.refresh());
  }

  if (variant === 'legacy') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isNew}
        onClick={flip}
        disabled={pending}
        className="ml-auto flex items-center gap-2 disabled:opacity-60"
      >
        <span className="text-[13px] text-gray-500">Nouvelle version</span>
        <span
          className="relative block h-6 w-[42px] rounded-full transition-colors"
          style={{ backgroundColor: isNew ? '#378ADD' : '#d1d5db' }}
        >
          <span
            className="absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition-all"
            style={{ left: isNew ? 21 : 3 }}
          />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isNew}
      onClick={flip}
      disabled={pending}
      className="flex cursor-pointer items-center gap-2.5 rounded-full px-1 py-1 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-60"
    >
      <span className="text-[13px] text-ink-muted">Nouvelle version</span>
      <span
        className="relative block h-6 w-[42px] rounded-full transition-colors"
        style={{ backgroundColor: isNew ? 'var(--color-accent)' : 'var(--color-line-strong)' }}
      >
        <span
          className="absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(26,25,23,.28)] transition-all duration-200"
          style={{ left: pending ? 12 : isNew ? 21 : 3 }}
        />
      </span>
    </button>
  );
}
