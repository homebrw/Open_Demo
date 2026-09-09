import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkRateLimit } from './rateLimit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests under the limit', () => {
    const key = `test:${Math.random()}`;
    expect(checkRateLimit(key, 3, 1000)).toBe(true);
    expect(checkRateLimit(key, 3, 1000)).toBe(true);
    expect(checkRateLimit(key, 3, 1000)).toBe(true);
  });

  it('rejects once the limit is reached', () => {
    const key = `test:${Math.random()}`;
    checkRateLimit(key, 2, 1000);
    checkRateLimit(key, 2, 1000);
    expect(checkRateLimit(key, 2, 1000)).toBe(false);
  });

  it('resets after the window elapses', () => {
    const key = `test:${Math.random()}`;
    checkRateLimit(key, 1, 1000);
    expect(checkRateLimit(key, 1, 1000)).toBe(false);

    vi.advanceTimersByTime(1001);

    expect(checkRateLimit(key, 1, 1000)).toBe(true);
  });

  it('keeps separate counters per key', () => {
    const a = `test:a:${Math.random()}`;
    const b = `test:b:${Math.random()}`;
    checkRateLimit(a, 1, 1000);
    expect(checkRateLimit(a, 1, 1000)).toBe(false);
    expect(checkRateLimit(b, 1, 1000)).toBe(true);
  });
});
