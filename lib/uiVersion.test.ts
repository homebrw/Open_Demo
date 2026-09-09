import { describe, expect, it } from 'vitest';
import { DEFAULT_UI_VERSION, parseUiVersion } from './uiVersion';

describe('parseUiVersion', () => {
  it('returns "legacy" for the legacy cookie value', () => {
    expect(parseUiVersion('legacy')).toBe('legacy');
  });

  it('falls back to the default for an unknown value', () => {
    expect(parseUiVersion('v2')).toBe(DEFAULT_UI_VERSION);
    expect(parseUiVersion('bogus')).toBe(DEFAULT_UI_VERSION);
  });

  it('falls back to the default when no cookie is set', () => {
    expect(parseUiVersion(undefined)).toBe(DEFAULT_UI_VERSION);
  });

  it('the default is v2', () => {
    expect(DEFAULT_UI_VERSION).toBe('v2');
  });
});
