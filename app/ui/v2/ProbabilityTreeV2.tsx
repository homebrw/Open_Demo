'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TreeNode } from '@/lib/types';
import { displayToken, formatPercentage } from '@/lib/utils';
import { Eyebrow, GhostButton } from './primitives';

const NODE_W = 168;
const NODE_H = 46;
const ROW_PITCH = 60;
const COL_PITCH = 216;
const ROOT_W = 156;
const TOP = 34;
const MIN_SCALE = 0.45;
const MAX_SCALE = 1.2;

const colX = (level: number) => 204 + level * COL_PITCH;
const rowY = (row: number) => TOP + row * ROW_PITCH;

/** Siblings available at `level`, following the currently selected path. */
function listAt(roots: TreeNode[], path: number[], level: number): TreeNode[] {
  let list = roots;
  for (let i = 0; i < level; i++) {
    const node = list[path[i]];
    if (!node) return [];
    list = node.children;
  }
  return list;
}

function nodeAt(roots: TreeNode[], path: number[]): TreeNode | null {
  let node: TreeNode | null = null;
  let list = roots;
  for (const index of path) {
    node = list[index] ?? null;
    if (!node) return null;
    list = node.children;
  }
  return node;
}

/** The chain of most-probable tokens — index 0 at every level. */
function greedyPath(roots: TreeNode[]): number[] {
  const path: number[] = [];
  let list = roots;
  while (list.length > 0) {
    path.push(0);
    list = list[0].children;
  }
  return path;
}

export default function ProbabilityTreeV2({
  roots,
  initialPhrase,
}: {
  roots: TreeNode[];
  initialPhrase: string;
}) {
  const [path, setPath] = useState<number[]>(() => greedyPath(roots));
  const [scale, setScale] = useState(1);
  const [autoFit, setAutoFit] = useState(true);
  const [renderedRoots, setRenderedRoots] = useState(roots);
  const viewportRef = useRef<HTMLDivElement>(null);

  // A new analysis replaces the tree: reset the open path during render rather
  // than in an effect, so we never paint a path that belongs to the old tree.
  if (renderedRoots !== roots) {
    setRenderedRoots(roots);
    setPath(greedyPath(roots));
    setAutoFit(true);
  }

  const { columns, links, rootTop, width, height } = useMemo(() => {
    const columns: { level: number; nodes: TreeNode[]; selected: number }[] = [];

    for (let level = 0; level <= path.length; level++) {
      const nodes = listAt(roots, path, level);
      if (nodes.length === 0) break;
      columns.push({ level, nodes, selected: path[level] ?? -1 });
    }

    const links: { d: string; onPath: boolean; width: number }[] = [];

    // The root pill sits centred on the first column, whatever its height.
    const firstRows = columns[0]?.nodes.length ?? 1;
    const rootTop = rowY(0) + ((firstRows - 1) * ROW_PITCH) / 2;

    for (const { level, nodes, selected } of columns) {
      const x = colX(level);
      // Parent anchor: the root pill at level 0, otherwise the selected node
      // one column to the left.
      const x1 = level === 0 ? ROOT_W : colX(level - 1) + NODE_W;
      const y1 = level === 0 ? rootTop + NODE_H / 2 : rowY(path[level - 1]) + NODE_H / 2;
      const dx = (x - x1) / 2;

      nodes.forEach((node, row) => {
        const y2 = rowY(row) + NODE_H / 2;
        const onPath = row === selected;
        links.push({
          d: `M${x1} ${y1} C${x1 + dx} ${y1}, ${x - dx} ${y2}, ${x} ${y2}`,
          onPath,
          width: onPath ? Math.max(1.6, 1 + node.prob * 5) : 1.2,
        });
      });
    }

    const lastLevel = columns.length - 1;
    const maxRows = columns.reduce((max, c) => Math.max(max, c.nodes.length), 1);

    return {
      columns,
      links,
      rootTop,
      width: lastLevel >= 0 ? colX(lastLevel) + NODE_W : ROOT_W,
      height: Math.max(rowY(maxRows - 1) + NODE_H, rootTop + NODE_H) + 12,
    };
  }, [roots, path]);

  // Fit the tree to the card on mount, on resize, and whenever it grows.
  useEffect(() => {
    if (!autoFit) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    const fit = () => {
      const available = viewport.clientWidth;
      setScale(available > 0 ? Math.min(1, Math.max(MIN_SCALE, available / width)) : 1);
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [autoFit, width]);

  const zoom = useCallback((delta: number) => {
    setAutoFit(false);
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, +(s + delta).toFixed(2))));
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const depth = path.length;
      if (event.key === 'ArrowLeft') {
        if (depth <= 1) return;
        event.preventDefault();
        setPath(path.slice(0, -1));
      } else if (event.key === 'ArrowRight') {
        const children = listAt(roots, path, depth);
        if (children.length === 0) return;
        event.preventDefault();
        setPath([...path, 0]);
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        if (depth === 0) return;
        const siblings = listAt(roots, path, depth - 1);
        const current = path[depth - 1];
        const next = event.key === 'ArrowUp' ? current - 1 : current + 1;
        if (next < 0 || next >= siblings.length) return;
        event.preventDefault();
        setPath([...path.slice(0, -1), next]);
      }
    },
    [path, roots],
  );

  const selected = nodeAt(roots, path);
  const suffix = selected ? selected.phrase.slice(initialPhrase.length) : '';

  if (roots.length === 0) return null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4 px-6 pt-6 sm:px-7">
        <div>
          <h2 className="mb-1 text-base font-semibold text-ink">Arbre de probabilités</h2>
          <p className="text-[12.5px] text-ink-subtle">
            Cliquez un token pour dérouler sa suite. L&apos;épaisseur du trait suit la probabilité.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GhostButton onClick={() => zoom(-0.1)} title="Dézoomer">
            <span aria-hidden>−</span>
            <span className="sr-only">Dézoomer</span>
          </GhostButton>
          <span className="w-11 text-center font-mono text-[11.5px] tabular-nums text-ink-subtle">
            {Math.round(scale * 100)} %
          </span>
          <GhostButton onClick={() => zoom(0.1)} title="Zoomer">
            <span aria-hidden>+</span>
            <span className="sr-only">Zoomer</span>
          </GhostButton>
          <GhostButton onClick={() => setAutoFit(true)}>Ajuster</GhostButton>
          <GhostButton onClick={() => setPath(greedyPath(roots))}>Chemin glouton</GhostButton>
        </div>
      </div>

      <div ref={viewportRef} className="overflow-x-auto px-6 pb-6 sm:px-7">
        <div
          role="group"
          aria-label="Arbre de probabilités des tokens — flèches pour naviguer"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="relative rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          style={{
            width,
            height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            marginBottom: (scale - 1) * height,
          }}
        >
          <svg width={width} height={height} className="pointer-events-none absolute left-0 top-0">
            {links.map((link, i) => (
              <path
                key={i}
                d={link.d}
                fill="none"
                strokeLinecap="round"
                stroke={link.onPath ? 'var(--color-accent)' : 'var(--color-line-strong)'}
                strokeWidth={link.width}
                opacity={link.onPath ? 1 : 0.75}
              />
            ))}
          </svg>

          <div
            className="absolute overflow-hidden rounded-field bg-ink px-3 py-1.5"
            style={{ left: 0, top: rootTop, width: ROOT_W, height: NODE_H }}
          >
            <div className="truncate font-mono text-[13px] text-canvas">{initialPhrase}</div>
            <div className="mt-0.5 text-[10.5px] text-canvas/60">phrase de départ</div>
          </div>

          {columns.map(({ level, nodes, selected: selectedRow }) => (
            <div key={level}>
              <div
                className="absolute text-[10.5px] font-semibold uppercase tracking-[0.09em] text-ink-subtle"
                style={{ left: colX(level), top: 0, width: NODE_W }}
              >
                Niveau {level + 1}
              </div>
              {nodes.map((node, row) => {
                const onPath = row === selectedRow;
                return (
                  <button
                    key={row}
                    type="button"
                    onClick={() => setPath([...path.slice(0, level), row])}
                    aria-current={onPath ? 'true' : undefined}
                    className={`absolute overflow-hidden rounded-field px-2.5 pb-1.5 pt-1 text-left transition-shadow ${
                      onPath
                        ? 'border-[1.5px] border-accent bg-accent-soft shadow-node'
                        : 'border border-line bg-surface hover:border-accent-line'
                    } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
                    style={{ left: colX(level), top: rowY(row), width: NODE_W, height: NODE_H }}
                  >
                    <div
                      className={`truncate font-mono text-[13px] ${
                        onPath ? 'font-semibold text-accent' : 'font-medium text-ink'
                      }`}
                    >
                      {displayToken(node.token)}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div
                        className={`h-1 flex-1 overflow-hidden rounded-full ${
                          onPath ? 'bg-accent-line' : 'bg-line-soft'
                        }`}
                      >
                        <div
                          className={`h-full rounded-full ${onPath ? 'bg-accent' : 'bg-accent-pale'}`}
                          style={{ width: `${Math.min(100, node.prob * 100)}%` }}
                        />
                      </div>
                      <span
                        className={`font-mono text-[10.5px] tabular-nums ${
                          onPath ? 'text-accent' : 'text-ink-subtle'
                        }`}
                      >
                        {formatPercentage(node.prob)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="border-t border-line bg-surface-sunken px-6 py-5 sm:px-7">
          <div className="mb-3.5 flex flex-wrap items-center gap-2">
            <Eyebrow>Nœud sélectionné</Eyebrow>
            <span className="rounded-md border border-line bg-surface-alt px-2 py-0.5 font-mono text-[11.5px] text-ink-muted">
              niveau {path.length}
            </span>
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-center">
            <p className="rounded-field border border-line bg-surface px-4 py-3.5 font-mono text-[14.5px] leading-relaxed break-words">
              <span className="text-ink-subtle">{initialPhrase}</span>
              <span className="font-semibold text-accent">{suffix}</span>
            </p>
            <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
              <div>
                <dt className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-ink-subtle">
                  Token
                </dt>
                <dd className="font-mono text-[15px] font-semibold tabular-nums">
                  {formatPercentage(selected.prob)}
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-ink-subtle">
                  Cumulé
                </dt>
                <dd className="font-mono text-[15px] font-semibold tabular-nums">
                  {formatPercentage(selected.cumulative)}
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-ink-subtle">
                  Log-prob
                </dt>
                <dd className="font-mono text-[15px] tabular-nums text-ink-muted">
                  {Math.log(selected.prob).toFixed(4)}
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-ink-subtle">
                  Candidats
                </dt>
                <dd className="font-mono text-[15px] tabular-nums text-ink-muted">
                  {selected.children.length}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
