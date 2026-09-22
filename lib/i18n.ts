export const LOCALE_COOKIE = 'locale';

export type Locale = 'fr' | 'en';

/** French is the historical default; the cookie only ever opts into English. */
export const DEFAULT_LOCALE: Locale = 'fr';

export function parseLocale(value?: string): Locale {
  return value === 'en' ? 'en' : DEFAULT_LOCALE;
}

/** Shared server-side error strings, used by the API routes. */
export const serverErrors = {
  fr: {
    tooManyRequests: 'Trop de requêtes. Réessayez dans quelques minutes.',
    phraseRequired: 'Le champ "phrase" est requis.',
    phraseTooLong: (max: number) => `Le champ "phrase" ne peut pas dépasser ${max} caractères.`,
    promptRequired: 'Le champ "prompt" est requis.',
    promptTooLong: (max: number) => `Le champ "prompt" ne peut pas dépasser ${max} caractères.`,
    unknownError: 'Erreur inconnue',
  },
  en: {
    tooManyRequests: 'Too many requests. Please try again in a few minutes.',
    phraseRequired: 'The "phrase" field is required.',
    phraseTooLong: (max: number) => `The "phrase" field cannot exceed ${max} characters.`,
    promptRequired: 'The "prompt" field is required.',
    promptTooLong: (max: number) => `The "prompt" field cannot exceed ${max} characters.`,
    unknownError: 'Unknown error',
  },
} as const;

export function parseLocaleFromBody(value: unknown): Locale {
  return value === 'en' ? 'en' : 'fr';
}
