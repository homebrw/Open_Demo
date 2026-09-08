'use client';

import { useRef, useState } from 'react';
import type { AnalysisResult, TreeNode } from '@/lib/types';
import { formatPercentage } from '@/lib/utils';
import ProbabilityTreeV2 from './ProbabilityTreeV2';
import TokenBarsV2 from './TokenBarsV2';
import {
  ArrowRight,
  Card,
  ErrorBanner,
  GhostButton,
  Kbd,
  PageHeader,
  PrimaryButton,
  Spinner,
} from './primitives';

const MODEL = 'gpt-3.5-turbo-instruct';
const MAX_CHARS = 400;
const DEPTH_OPTIONS = [2, 3, 4, 5] as const;

const STARTERS = [
  'La vie est',
  'Il était une fois',
  'La capitale de la France est',
  '2 + 2 =',
];

/** Same arithmetic the classic UI shows: 3^depth leaves, (3^depth-1)/2+1 calls. */
function costOf(depth: number) {
  const leaves = Math.pow(3, depth);
  return { leaves, calls: (leaves - 1) / 2 + 1 };
}

function greedyCompletion(roots: TreeNode[], phrase: string) {
  if (roots.length === 0) return null;
  let node = roots[0];
  while (node.children.length > 0) node = node.children[0];
  return { added: node.phrase.slice(phrase.length), cumulative: node.cumulative };
}

export default function ExplorerV2() {
  const [phrase, setPhrase] = useState('');
  const [depth, setDepth] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [usedPhrase, setUsedPhrase] = useState('');
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function handleAnalyze() {
    if (!phrase.trim()) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase: phrase.trim(), depth }),
        signal: controller.signal,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur serveur');
      setResult(data);
      setUsedPhrase(phrase.trim());
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!greedy) return;
    navigator.clipboard?.writeText(usedPhrase + greedy.added).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      },
      () => setCopied(false),
    );
  }

  const greedy = result ? greedyCompletion(result.tree, usedPhrase) : null;
  const cost = costOf(depth);

  return (
    <main className="mx-auto w-full max-w-[1120px] px-6 py-10 sm:px-8 sm:py-11">
      <PageHeader
        eyebrow="Explorateur"
        title={
          <>
            L&apos;arbre des possibles
            <br />
            derrière chaque mot
          </>
        }
        lede="Chaque token que le modèle produit est un choix parmi des milliers. Saisissez une phrase et remontez la distribution de probabilités, niveau par niveau."
        model={MODEL}
      />

      {/* ── Composer ─────────────────────────────────────────────────── */}
      <Card className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <label htmlFor="phrase" className="text-[13px] font-semibold text-ink">
            Phrase à compléter
          </label>
          <span className="font-mono text-[11px] tabular-nums text-ink-subtle">
            {phrase.length} / {MAX_CHARS}
          </span>
        </div>

        <textarea
          id="phrase"
          rows={3}
          maxLength={MAX_CHARS}
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAnalyze();
          }}
          placeholder="Ex : La vie est"
          className="w-full resize-none rounded-field border border-line bg-surface px-4 py-3.5 font-mono text-[15px] leading-relaxed text-ink transition-shadow placeholder:text-ink-faint focus:border-accent-line focus:outline-none focus:ring-[3px] focus:ring-accent/10"
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[12.5px] text-ink-subtle">Pour commencer</span>
          {STARTERS.map((starter) => (
            <button
              key={starter}
              type="button"
              onClick={() => setPhrase(starter)}
              className="rounded-full border border-line bg-surface px-3.5 py-1.5 font-mono text-[12.5px] text-ink-muted transition-colors hover:border-accent-line hover:bg-accent-soft hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {starter}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <fieldset>
            <legend className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-subtle">
              Profondeur d&apos;exploration
            </legend>
            <div className="flex flex-wrap gap-2">
              {DEPTH_OPTIONS.map((d) => {
                const active = depth === d;
                const { calls } = costOf(d);
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setDepth(d)}
                    className={`w-24 rounded-field border px-0 pb-2 pt-2.5 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      active
                        ? 'border-[1.5px] border-accent bg-accent-soft'
                        : 'border-line bg-surface hover:border-line-strong'
                    }`}
                  >
                    <span className={`block text-[15px] font-semibold ${active ? 'text-accent' : 'text-ink-muted'}`}>
                      {d}
                    </span>
                    <span
                      className={`mt-px block text-[10.5px] ${
                        active ? 'text-accent' : d === 5 ? 'text-warning' : 'text-ink-subtle'
                      }`}
                    >
                      {calls} appels
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex items-center gap-4">
            {loading ? (
              <GhostButton onClick={() => abortRef.current?.abort()}>Annuler</GhostButton>
            ) : (
              <span className="hidden items-center gap-1 sm:flex">
                <Kbd>⌘</Kbd>
                <Kbd>↵</Kbd>
              </span>
            )}
            <PrimaryButton onClick={handleAnalyze} disabled={loading || !phrase.trim()}>
              {loading ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Construction…
                </>
              ) : (
                <>
                  Analyser
                  <ArrowRight />
                </>
              )}
            </PrimaryButton>
          </div>
        </div>

        <p className="mt-4 border-t border-line-soft pt-3.5 text-[12.5px] text-ink-subtle">
          {`${cost.leaves} feuilles explorées · ${cost.calls} appels à l'API`}
          {depth === 5 && <span className="text-warning"> · peut approcher la limite de 60 s</span>}
        </p>
      </Card>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} />
        </div>
      )}

      {/* ── Loading skeleton ─────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-6" aria-live="polite">
          <Card>
            <div className="mb-4 h-4 w-52 rounded bg-line-soft" />
            <div className="h-16 rounded-field bg-surface-sunken" />
          </Card>
          <Card>
            <div className="mb-4 h-4 w-64 rounded bg-line-soft" />
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-7 rounded bg-line-soft" style={{ opacity: 1 - i * 0.15 }} />
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────────── */}
      {result && greedy && !loading && (
        <div className="space-y-6">
          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-ink">Chemin le plus probable</h2>
              <div className="flex items-center gap-3.5">
                <span className="text-[12.5px] text-ink-muted">
                  Probabilité cumulée{' '}
                  <span className="font-mono font-semibold tabular-nums text-ink">
                    {formatPercentage(greedy.cumulative)}
                  </span>
                </span>
                <GhostButton onClick={handleCopy}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
                    <path d="M10.5 3.5H3.5a1 1 0 0 0-1 1v7" />
                  </svg>
                  {copied ? 'Copié' : 'Copier'}
                </GhostButton>
              </div>
            </div>
            <p className="rounded-field border border-line border-l-[3px] border-l-accent bg-surface-sunken px-6 py-5 font-mono text-[19px] leading-relaxed break-words">
              <span className="text-ink-subtle">{usedPhrase}</span>
              <span className="font-semibold text-accent">{greedy.added}</span>
            </p>
          </Card>

          <Card className="pb-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold text-ink">Tokens candidats — premier niveau</h2>
              <p className="text-[12.5px] text-ink-subtle">
                Les tokens les plus probables juste après{' '}
                <span className="font-mono text-ink-muted">{usedPhrase}</span>
              </p>
            </div>
            <TokenBarsV2 tokens={result.topTokens} />
          </Card>

          <Card padded={false} className="overflow-hidden">
            <ProbabilityTreeV2 roots={result.tree} initialPhrase={usedPhrase} />
          </Card>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────── */}
      {!result && !loading && !error && (
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            {
              title: '1 · Le modèle découpe',
              body: (
                <>
                  Votre phrase devient une suite de tokens — des fragments de mots, souvent précédés
                  d&apos;une espace, notée <span className="font-mono text-ink">·</span>.
                </>
              ),
              icon: (
                <>
                  <path d="M3 10h5M12 10h5" />
                  <rect x="8" y="6.5" width="4" height="7" rx="1" />
                </>
              ),
            },
            {
              title: '2 · Il note chaque suite',
              body: 'Pour le token suivant, il attribue une probabilité à tout son vocabulaire. On affiche les premiers.',
              icon: <path d="M3.5 16V9M8.5 16V5M13.5 16v-4" />,
            },
            {
              title: '3 · On recommence',
              body: "Chaque candidat devient une nouvelle phrase à compléter. D'où l'arbre — et l'explosion du nombre d'appels.",
              icon: (
                <>
                  <circle cx="4" cy="10" r="1.6" />
                  <circle cx="16" cy="5" r="1.6" />
                  <circle cx="16" cy="15" r="1.6" />
                  <path d="M5.6 10c4 0 5-5 8.8-5M5.6 10c4 0 5 5 8.8 5" />
                </>
              ),
            },
          ].map((step) => (
            <div key={step.title} className="rounded-card border border-line bg-surface px-6 py-6">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent-soft text-accent">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {step.icon}
                </svg>
              </div>
              <h3 className="mb-1.5 text-[15px] font-semibold text-ink">{step.title}</h3>
              <p className="text-[13.5px] leading-relaxed text-ink-muted text-pretty">{step.body}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
