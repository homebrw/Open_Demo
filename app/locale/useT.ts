'use client';

import { translations } from '@/lib/translations';
import { useLocale } from './LocaleProvider';

export function useT() {
  return translations[useLocale()];
}
