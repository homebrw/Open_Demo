import type { TreeNode } from '@/lib/types';

/**
 * Phrase → its immediate candidates, as returned by a `{phrase, depth: 1}`
 * call to `/api/analyze`. Each candidate's own `children` stays `[]` until
 * *that* candidate's phrase is itself looked up — the cache is flat, not a
 * nested tree; depth comes from chaining lookups by phrase.
 */
export type TreeCache = Map<string, TreeNode[]>;

/** The candidates visible at `level`, following `path` from `initialPhrase`. */
export function siblingsAt(
  cache: TreeCache,
  initialPhrase: string,
  path: number[],
  level: number,
): TreeNode[] {
  let phrase = initialPhrase;
  for (let i = 0; i < level; i++) {
    const node = cache.get(phrase)?.[path[i]];
    if (!node) return [];
    phrase = node.phrase;
  }
  return cache.get(phrase) ?? [];
}

/** The selected node at the end of `path`, or null if any step is uncached. */
export function nodeAtPath(cache: TreeCache, initialPhrase: string, path: number[]): TreeNode | null {
  let phrase = initialPhrase;
  let node: TreeNode | null = null;
  for (const index of path) {
    node = cache.get(phrase)?.[index] ?? null;
    if (!node) return null;
    phrase = node.phrase;
  }
  return node;
}

/** The phrase reached at the end of `path` (falls back to `initialPhrase`). */
export function phraseAtPath(cache: TreeCache, initialPhrase: string, path: number[]): string {
  return nodeAtPath(cache, initialPhrase, path)?.phrase ?? initialPhrase;
}

/**
 * The TRUE cumulative probability along `path`, computed by multiplying each
 * level's own `prob`.
 *
 * Each cache entry comes from an INDEPENDENT `{phrase, depth: 1}` request —
 * the server has no memory of earlier levels, so a node's own `.cumulative`
 * field is only correct relative to ITS OWN parent phrase, not to
 * `initialPhrase`. Reading `.cumulative` directly on anything but a level-0
 * node gives a plausible-looking but wrong number. This is the one place
 * that composes the real value; every other read of "cumulative probability"
 * in the v2 UI should go through this function instead of `node.cumulative`.
 */
export function cumulativeAt(cache: TreeCache, initialPhrase: string, path: number[]): number {
  let phrase = initialPhrase;
  let cumulative = 1;
  for (const index of path) {
    const node = cache.get(phrase)?.[index];
    if (!node) break;
    cumulative *= node.prob;
    phrase = node.phrase;
  }
  return cumulative;
}
