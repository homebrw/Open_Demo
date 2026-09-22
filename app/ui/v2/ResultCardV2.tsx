'use client';

import type { GenerationResult } from '@/lib/types';
import { useT } from '../../locale/useT';

function formatCost(cost: number) {
  return '$' + cost.toFixed(6);
}

export default function ResultCardV2({
  index,
  result,
}: {
  index: number;
  result: GenerationResult;
}) {
  const t = useT();
  return (
    <article className="flex flex-col bg-surface px-6 pb-5 pt-4 sm:px-7">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-subtle">
          {t.resultCardV2.generation} {index + 1}
        </span>
        <div className="flex shrink-0 gap-3 font-mono text-[11px] tabular-nums text-ink-subtle">
          <span>{result.latency} ms</span>
          {result.usage && <span>{result.usage.total_tokens} tok</span>}
          {result.cost != null && <span>{formatCost(result.cost)}</span>}
        </div>
      </div>
      {result.error ? (
        <p className="text-sm text-danger">{result.error}</p>
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink text-pretty">
          {result.text}
        </p>
      )}
    </article>
  );
}
