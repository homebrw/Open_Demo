export const UI_VERSION_COOKIE = 'ui-version';

export type UiVersion = 'v2' | 'legacy';

/** The redesigned interface is the default; the cookie only ever opts out of it. */
export const DEFAULT_UI_VERSION: UiVersion = 'v2';

export function parseUiVersion(value?: string): UiVersion {
  return value === 'legacy' ? 'legacy' : DEFAULT_UI_VERSION;
}
