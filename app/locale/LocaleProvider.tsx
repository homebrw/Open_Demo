'use client';

import { createContext, useContext } from 'react';
import type { Locale } from '@/lib/i18n';
import { DEFAULT_LOCALE } from '@/lib/i18n';

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({
  value,
  children,
}: {
  value: Locale;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}
