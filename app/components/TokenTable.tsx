'use client';

import { displayToken, formatPercentage } from '@/lib/utils';

interface TokenInfo {
  token: string;
  prob: number;
  logprob: number;
}

interface TokenTableProps {
  tokens: TokenInfo[];
}

export default function TokenTable({ tokens }: TokenTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-gray-600 uppercase text-xs tracking-wider">
            <th className="px-4 py-3 w-10">#</th>
            <th className="px-4 py-3">Token</th>
            <th className="px-4 py-3">Probabilité</th>
            <th className="px-4 py-3">Log-prob</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((t, i) => (
            <tr
              key={i}
              className={`border-t border-gray-100 ${i === 0 ? 'font-semibold' : ''}`}
            >
              <td className="px-4 py-2 text-gray-400">{i + 1}</td>
              <td className="px-4 py-2">
                <span
                  className="font-mono px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: i === 0 ? '#378ADD20' : '#f3f4f6',
                    color: i === 0 ? '#378ADD' : '#374151',
                  }}
                >
                  {displayToken(t.token)}
                </span>
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${t.prob * 100}%`,
                        backgroundColor: i === 0 ? '#378ADD' : '#B4B2A9',
                      }}
                    />
                  </div>
                  <span>{formatPercentage(t.prob)}</span>
                </div>
              </td>
              <td className="px-4 py-2 font-mono text-gray-500">
                {t.logprob.toFixed(4)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
