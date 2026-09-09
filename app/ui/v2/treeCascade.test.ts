import { describe, expect, it } from 'vitest';
import type { TreeNode } from '@/lib/types';
import { cumulativeAt, nodeAtPath, phraseAtPath, siblingsAt, type TreeCache } from './treeCascade';

const INITIAL = 'La vie est';

function node(token: string, prob: number, phrase: string): TreeNode {
  // `cumulative` deliberately mirrors what the real server sends for a node
  // that is NOT at level 0: relative to ITS OWN parent phrase, not to
  // `INITIAL`. A naive `.cumulative` read on this node would be wrong for
  // anything but a level-0 node — that's exactly the bug cumulativeAt exists
  // to avoid, so the tests below assert against the multiplied value, never
  // this field.
  return { token, prob, cumulative: prob, phrase, children: [] };
}

function makeCache(): TreeCache {
  const cache: TreeCache = new Map();
  cache.set(INITIAL, [
    node('·une', 0.3, 'La vie est une'),
    node('·un', 0.2, 'La vie est un'),
  ]);
  // "La vie est un" (root candidate index 1) is deliberately left unfetched —
  // it's a real, common state: the greedy prefetch only ever opens index 0.
  cache.set('La vie est une', [
    node('·belle', 0.5, 'La vie est une belle'),
    node('·chose', 0.3, 'La vie est une chose'),
  ]);
  return cache;
}

describe('siblingsAt', () => {
  it('returns the root candidates at level 0', () => {
    const cache = makeCache();
    expect(siblingsAt(cache, INITIAL, [], 0).map((n) => n.token)).toEqual(['·une', '·un']);
  });

  it('follows an already-cached path to a deeper level', () => {
    const cache = makeCache();
    expect(siblingsAt(cache, INITIAL, [0], 1).map((n) => n.token)).toEqual(['·belle', '·chose']);
  });

  it('returns an empty list when the path leads to an uncached phrase', () => {
    const cache = makeCache();
    // index 1 ("La vie est un") was never fetched.
    expect(siblingsAt(cache, INITIAL, [1], 1)).toEqual([]);
  });

  it('returns an empty list beyond the deepest cached level', () => {
    const cache = makeCache();
    expect(siblingsAt(cache, INITIAL, [0, 1], 2)).toEqual([]);
  });
});

describe('nodeAtPath', () => {
  it('returns null for an empty path', () => {
    expect(nodeAtPath(makeCache(), INITIAL, [])).toBeNull();
  });

  it('resolves a cached path', () => {
    const result = nodeAtPath(makeCache(), INITIAL, [0, 1]);
    expect(result?.phrase).toBe('La vie est une chose');
  });

  it('returns null once the path runs past what is cached', () => {
    expect(nodeAtPath(makeCache(), INITIAL, [1, 0])).toBeNull();
  });
});

describe('phraseAtPath', () => {
  it('falls back to the initial phrase for an empty or uncached path', () => {
    expect(phraseAtPath(makeCache(), INITIAL, [])).toBe(INITIAL);
    expect(phraseAtPath(makeCache(), INITIAL, [1, 0])).toBe(INITIAL);
  });

  it('returns the phrase at the end of a cached path', () => {
    expect(phraseAtPath(makeCache(), INITIAL, [0, 1])).toBe('La vie est une chose');
  });
});

describe('cumulativeAt', () => {
  it('multiplies per-level prob along the path, not the (per-request-relative) .cumulative field', () => {
    const cache = makeCache();
    // 0.3 (root) * 0.3 ("·chose") = 0.09 — the node's own `.cumulative`
    // field is 0.3 (see `node()`), which would be the wrong answer here.
    expect(cumulativeAt(cache, INITIAL, [0, 1])).toBeCloseTo(0.09, 10);
  });

  it('is 1 for an empty path', () => {
    expect(cumulativeAt(makeCache(), INITIAL, [])).toBe(1);
  });

  it('stops multiplying once the path runs past what is cached', () => {
    const cache = makeCache();
    // Only the root step (0.2) is resolvable; index 0 beyond it is uncached.
    expect(cumulativeAt(cache, INITIAL, [1, 0])).toBeCloseTo(0.2, 10);
  });
});
