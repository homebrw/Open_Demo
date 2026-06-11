'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { displayToken, formatPercentage } from '@/lib/utils';

interface TokenInfo {
  token: string;
  prob: number;
  logprob: number;
}

interface TokenChartsProps {
  tokens: TokenInfo[];
}

const PRIMARY = '#378ADD';
const SECONDARY = '#B4B2A9';

export default function TokenCharts({ tokens }: TokenChartsProps) {
  const barData = tokens.slice(0, 10).map((t) => ({
    name: displayToken(t.token),
    prob: parseFloat((t.prob * 100).toFixed(2)),
  }));

  const pieData = tokens.slice(0, 5).map((t) => ({
    name: displayToken(t.token),
    value: parseFloat((t.prob * 100).toFixed(2)),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
          Top 10 — Distribution (%)
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={barData}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
          >
            <XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fontFamily: 'monospace' }} width={70} />
            <Tooltip formatter={(v) => [`${v}%`, 'Probabilité']} />
            <Bar dataKey="prob" radius={[0, 4, 4, 0]}>
              {barData.map((_, i) => (
                <Cell key={i} fill={i === 0 ? PRIMARY : SECONDARY} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
          Top 5 — Répartition
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              outerRadius={90}
              label={({ name, value }) => `${name}: ${value}%`}
              labelLine={false}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={i === 0 ? PRIMARY : SECONDARY} />
              ))}
            </Pie>
            <Legend formatter={(v) => <span style={{ fontSize: 12, fontFamily: 'monospace' }}>{v}</span>} />
            <Tooltip formatter={(v) => [`${v}%`, 'Probabilité']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
