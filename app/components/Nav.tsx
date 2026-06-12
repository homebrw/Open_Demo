'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: '🧠 Explorateur de Logits' },
  { href: '/playground', label: '🎛️ Playground' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-[1200px] mx-auto px-4 flex items-center gap-1 h-12">
        {LINKS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: active ? '#EBF4FF' : 'transparent',
                color: active ? '#378ADD' : '#6b7280',
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
