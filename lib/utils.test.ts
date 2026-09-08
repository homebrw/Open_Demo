import { describe, expect, it } from 'vitest';
import { displayToken, formatPercentage } from './utils';

describe('displayToken', () => {
  it('renders spaces as middle dots', () => {
    expect(displayToken(' bonjour')).toBe('·bonjour');
  });

  it('renders newlines and tabs as their glyphs', () => {
    expect(displayToken('a\nb')).toBe('a↵b');
    expect(displayToken('a\tb')).toBe('a→b');
  });

  it('truncates tokens longer than 15 characters with an ellipsis', () => {
    const long = 'a'.repeat(20);
    const result = displayToken(long);
    expect(result).toHaveLength(15);
    expect(result.endsWith('…')).toBe(true);
  });

  it('leaves short tokens untouched', () => {
    expect(displayToken('chat')).toBe('chat');
  });
});

describe('formatPercentage', () => {
  it('formats a probability as a percentage with 2 decimals', () => {
    expect(formatPercentage(0.3412)).toBe('34.12%');
  });

  it('handles 0 and 1', () => {
    expect(formatPercentage(0)).toBe('0.00%');
    expect(formatPercentage(1)).toBe('100.00%');
  });
});
