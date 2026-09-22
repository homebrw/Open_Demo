'use client';

import { useCallback, useRef, useState } from 'react';
import type { GenerationResult, HistoryEntry, Params } from '@/lib/types';
import ResultCardV2 from './ResultCardV2';
import SliderFieldV2 from './SliderFieldV2';
import {
  Card,
  ErrorBanner,
  Eyebrow,
  GhostButton,
  Kbd,
  PageHeader,
  PrimaryButton,
  Spinner,
} from './primitives';
import { useT } from '../../locale/useT';
import { useLocale } from '../../locale/LocaleProvider';

const MODEL = 'gpt-4.1-mini';
const MAX_PROMPT_LENGTH = 4000;

const DEFAULT_PARAMS: Params = {
  temperature: 0.7,
  top_p: 1.0,
  max_output_tokens: 300,
  count: 1,
};

function gridFor(count: number) {
  if (count === 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
  if (count === 3) return 'grid-cols-1 sm:grid-cols-3';
  return 'grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4';
}

export default function PlaygroundV2() {
  const t = useT();
  const locale = useLocale();
  const QUICK_PROMPTS = t.playgroundV2.quickPrompts;
  const [prompt, setPrompt] = useState('');
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const nextId = useRef(0);

  const setParam = useCallback(<K extends keyof Params>(key: K, value: Params[K]) => {
    setParams((p) => ({ ...p, [key]: value }));
  }, []);

  async function runGenerate(runPrompt: string, runParams: Params) {
    if (!runPrompt.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const calls = Array.from({ length: runParams.count }, () =>
        fetch('/api/playground', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: runPrompt.trim(),
            temperature: runParams.temperature,
            top_p: runParams.top_p,
            max_output_tokens: runParams.max_output_tokens,
            locale,
          }),
        }).then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            return {
              text: '',
              usage: null,
              latency: 0,
              cost: null,
              error: data.error ?? t.common.unknownError,
            } satisfies GenerationResult;
          }
          return data as GenerationResult;
        }),
      );

      const results = await Promise.all(calls);
      setHistory((h) => [
        { id: nextId.current++, prompt: runPrompt.trim(), params: { ...runParams }, results },
        ...h,
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.unknownError);
    } finally {
      setLoading(false);
    }
  }

  const totalCost = history.reduce(
    (sum, entry) => sum + entry.results.reduce((s, r) => s + (r.cost ?? 0), 0),
    0,
  );
  const totalRuns = history.reduce((sum, entry) => sum + entry.results.length, 0);

  return (
    <main className="mx-auto w-full max-w-[1120px] px-6 py-10 sm:px-8 sm:py-11">
      <PageHeader
        eyebrow={t.playgroundV2.eyebrow}
        title={
          <>
            {t.playgroundV2.titleLine1}
            <br />
            {t.playgroundV2.titleLine2}
          </>
        }
        lede={t.playgroundV2.lede}
        model={MODEL}
      />

      <div className="grid items-start gap-7 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* ── Controls ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5 lg:sticky lg:top-24">
          <Card className="!px-5 !py-5">
            <label htmlFor="prompt" className="mb-3 block text-[13px] font-semibold text-ink">
              {t.playgroundV2.promptLabel}
            </label>
            <textarea
              id="prompt"
              rows={5}
              maxLength={MAX_PROMPT_LENGTH}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) runGenerate(prompt, params);
              }}
              placeholder={t.playgroundV2.promptPlaceholder}
              className="w-full resize-none rounded-field border border-line bg-surface px-3.5 py-3 text-sm leading-relaxed text-ink transition-shadow placeholder:text-ink-faint focus:border-accent-line focus:outline-none focus:ring-[3px] focus:ring-accent/10"
            />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((quick) => {
                const active = prompt === quick.text;
                return (
                  <button
                    key={quick.label}
                    type="button"
                    onClick={() => setPrompt(quick.text)}
                    className={`rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      active
                        ? 'border-accent-line bg-accent-soft font-medium text-accent'
                        : 'border-line bg-surface text-ink-muted hover:border-accent-line hover:text-accent'
                    }`}
                  >
                    {quick.label}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="!px-5 !py-5">
            <Eyebrow className="mb-5">{t.playgroundV2.parametersTitle}</Eyebrow>

            <div className="space-y-6">
              <SliderFieldV2
                label={t.playgroundV2.temperature}
                value={params.temperature}
                min={0}
                max={2}
                step={0.1}
                decimals={1}
                lowLabel={t.playgroundV2.temperatureLow}
                highLabel={t.playgroundV2.temperatureHigh}
                onChange={(v) => setParam('temperature', v)}
              />
              <SliderFieldV2
                label={t.playgroundV2.topP}
                value={params.top_p}
                min={0}
                max={1}
                step={0.05}
                decimals={2}
                lowLabel={t.playgroundV2.topPLow}
                highLabel={t.playgroundV2.topPHigh}
                onChange={(v) => setParam('top_p', v)}
              />

              <div>
                <div className="mb-2.5 flex items-baseline justify-between">
                  <label htmlFor="max-tokens" className="text-[13.5px] font-semibold text-ink">
                    {t.playgroundV2.maxLengthLabel}
                  </label>
                  <span className="text-[11px] text-ink-subtle">{t.playgroundV2.maxLengthRange}</span>
                </div>
                <input
                  id="max-tokens"
                  type="number"
                  min={1}
                  max={4096}
                  value={params.max_output_tokens}
                  onChange={(e) =>
                    setParam(
                      'max_output_tokens',
                      Math.min(4096, Math.max(1, parseInt(e.target.value) || 1)),
                    )
                  }
                  className="w-full rounded-field border border-line bg-surface px-3.5 py-2.5 text-center font-mono text-[14.5px] font-semibold tabular-nums text-ink focus:border-accent-line focus:outline-none focus:ring-[3px] focus:ring-accent/10"
                />
              </div>

              <div>
                <div className="mb-2.5 text-[13.5px] font-semibold text-ink">
                  {t.playgroundV2.parallelGenerationsLabel}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((n) => {
                    const active = params.count === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setParam('count', n)}
                        className={`rounded-[9px] border py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                          active
                            ? 'border-[1.5px] border-accent bg-accent-soft text-accent'
                            : 'border-line bg-surface text-ink-muted hover:border-line-strong'
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>

              <PrimaryButton
                onClick={() => runGenerate(prompt, params)}
                disabled={loading || !prompt.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    {t.playgroundV2.generating}
                  </>
                ) : (
                  <>
                    {t.playgroundV2.generate}
                    <span className="hidden sm:flex sm:items-center sm:gap-1">
                      <Kbd>⌘</Kbd>
                      <Kbd>↵</Kbd>
                    </span>
                  </>
                )}
              </PrimaryButton>
            </div>
          </Card>

          <Card className="!px-5 !py-4">
            <button
              type="button"
              onClick={() => setGuideOpen((o) => !o)}
              aria-expanded={guideOpen}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="text-[13.5px] font-semibold text-ink">{t.playgroundV2.guideTitle}</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className={`text-ink-subtle transition-transform ${guideOpen ? 'rotate-180' : ''}`}
              >
                <path d="M4 6.5l4 4 4-4" />
              </svg>
            </button>

            {guideOpen ? (
              <dl className="mt-4 space-y-3.5 text-[13px] text-ink-muted">
                <div>
                  <dt className="mb-0.5 font-semibold text-ink">{t.playgroundV2.guideTemperatureTitle}</dt>
                  <dd className="leading-relaxed text-pretty">
                    {t.playgroundV2.guideTemperatureBody}
                  </dd>
                </div>
                <div>
                  <dt className="mb-0.5 font-semibold text-ink">{t.playgroundV2.guideTopPTitle}</dt>
                  <dd className="leading-relaxed text-pretty">
                    {t.playgroundV2.guideTopPBody}
                  </dd>
                </div>
                <div>
                  <dt className="mb-0.5 font-semibold text-ink">{t.playgroundV2.guideMaxLengthTitle}</dt>
                  <dd className="leading-relaxed text-pretty">
                    {t.playgroundV2.guideMaxLengthBody}
                  </dd>
                </div>
                <div>
                  <dt className="mb-0.5 font-semibold text-ink">{t.playgroundV2.guideReproducibilityTitle}</dt>
                  <dd className="leading-relaxed text-pretty">
                    {t.playgroundV2.guideReproducibilityBody}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-3 text-[13px] leading-relaxed text-ink-muted text-pretty">
                {t.playgroundV2.guideCollapsedHint}
              </p>
            )}
          </Card>
        </div>

        {/* ── History ────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          {error && <ErrorBanner message={error} />}

          {history.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <Eyebrow>{t.playgroundV2.historyTitle}</Eyebrow>
              <span className="text-[12.5px] text-ink-muted">
                {t.playgroundV2.generationsCount(totalRuns)} ·{' '}
                <span className="font-mono tabular-nums text-ink">${totalCost.toFixed(6)}</span>
              </span>
            </div>
          )}

          {loading && (
            <Card className="flex items-center gap-3 !py-5" aria-live="polite">
              <Spinner className="h-4 w-4 shrink-0 text-accent" />
              <span className="text-sm text-ink-muted">
                {params.count > 1
                  ? t.playgroundV2.generatingCount(params.count)
                  : t.playgroundV2.generating}
              </span>
            </Card>
          )}

          {history.map((entry) => (
            <Card key={entry.id} padded={false} className="overflow-hidden">
              <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line-soft px-6 pb-4 pt-4.5 sm:px-7">
                <div className="min-w-0 flex-1">
                  <p className="mb-2.5 text-sm leading-snug text-ink">{entry.prompt}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        ['temp', entry.params.temperature.toFixed(1)],
                        ['top_p', entry.params.top_p.toFixed(2)],
                        ['max', String(entry.params.max_output_tokens)],
                      ] as const
                    ).map(([key, value]) => (
                      <span
                        key={key}
                        className="rounded-md bg-accent-soft px-2.5 py-0.5 font-mono text-[11.5px] tabular-nums text-accent"
                      >
                        {key} {value}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <GhostButton onClick={() => runGenerate(entry.prompt, entry.params)} disabled={loading}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M13 8a5 5 0 1 1-1.6-3.7" />
                      <path d="M13 2.5V5h-2.5" />
                    </svg>
                    {t.playgroundV2.rerun}
                  </GhostButton>
                  <GhostButton
                    onClick={() => {
                      setPrompt(entry.prompt);
                      setParams({ ...entry.params });
                    }}
                    title={t.playgroundV2.resumeSettingsTitle}
                  >
                    {t.playgroundV2.resumeSettings}
                  </GhostButton>
                </div>
              </header>

              <div className={`grid gap-px bg-line-soft ${gridFor(entry.results.length)}`}>
                {entry.results.map((result, i) => (
                  <ResultCardV2 key={i} index={i} result={result} />
                ))}
              </div>
            </Card>
          ))}

          {history.length === 0 && !loading && (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-card border border-dashed border-line-strong bg-surface-sunken px-8 py-14 text-center">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="mb-6 text-accent-line" aria-hidden>
                <rect x="6" y="10" width="44" height="15" rx="4" />
                <rect x="6" y="31" width="28" height="15" rx="4" />
                <path d="M40 34.5h10M45 39.5V29.5" className="text-accent" stroke="currentColor" />
              </svg>
              <h3 className="mb-2.5 font-display text-[28px] font-normal text-ink">
                {t.playgroundV2.emptyStateTitle}
              </h3>
              <p className="mb-7 max-w-[46ch] text-[14.5px] leading-relaxed text-ink-muted text-pretty">
                {t.playgroundV2.emptyStateBody}
              </p>
              <div className="flex max-w-[560px] flex-wrap justify-center gap-2.5">
                {QUICK_PROMPTS.slice(0, 3).map((quick) => (
                  <button
                    key={quick.label}
                    type="button"
                    onClick={() => setPrompt(quick.text)}
                    className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-left text-[13.5px] text-ink transition-colors hover:border-accent-line hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="shrink-0 text-accent" aria-hidden>
                      <path d="M3 8h10M9 4l4 4-4 4" />
                    </svg>
                    {quick.text}
                  </button>
                ))}
              </div>
              <p className="mt-8 text-[12.5px] text-ink-subtle">
                {t.playgroundV2.emptyStateTipPrefix}{' '}
                <strong className="font-semibold text-ink-muted">{t.playgroundV2.emptyStateTipStrong}</strong>{' '}
                {t.playgroundV2.emptyStateTipSuffix}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
