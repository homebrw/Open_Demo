'use client';

import type { TokenInfo } from '@/lib/types';
import { displayToken, formatPercentage } from '@/lib/utils';
import { useT } from '../../locale/useT';

const ROW = 'grid grid-cols-[28px_minmax(0,148px)_minmax(0,1fr)_84px] items-center gap-x-4 sm:gap-x-5';

export default function TokenBarsV2({ tokens }: { tokens: TokenInfo[] }) {
  const t = useT();
  const headers = [t.tokenBarsV2.index, t.tokenBarsV2.token, t.tokenBarsV2.probability, t.tokenBarsV2.logprob];
  return (
    <div>
      <div className={`${ROW} border-b border-line pb-2.5 pt-3.5`}>
        {headers.map((label, i) => (
          <div
            key={label}
            className={`text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-subtle ${
              i === 3 ? 'text-right' : ''
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {tokens.map((token, i) => {
        const top = i === 0;
        return (
          <div key={i} className={`${ROW} border-b border-line-soft py-3 last:border-b-0`}>
            <div className={`font-mono text-[12.5px] tabular-nums ${top ? 'font-semibold text-accent' : 'text-ink-subtle'}`}>
              {i + 1}
            </div>
            <div className="min-w-0">
              <span
                className={`inline-block max-w-full truncate rounded-md border px-2.5 py-0.5 align-middle font-mono text-[13.5px] ${
                  top
                    ? 'border-accent-line bg-accent-soft font-semibold text-accent'
                    : 'border-line bg-surface-alt text-ink'
                }`}
              >
                {displayToken(token.token)}
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-line-soft">
                <div
                  className={`h-full rounded-full ${top ? 'bg-accent' : 'bg-accent-pale'}`}
                  style={{ width: `${Math.min(100, token.prob * 100)}%` }}
                />
              </div>
              <span
                className={`w-[58px] shrink-0 font-mono text-[13.5px] tabular-nums ${
                  top ? 'font-semibold text-ink' : 'text-ink-muted'
                }`}
              >
                {formatPercentage(token.prob)}
              </span>
            </div>
            <div className="text-right font-mono text-[12.5px] tabular-nums text-ink-subtle">
              {token.logprob.toFixed(4)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
