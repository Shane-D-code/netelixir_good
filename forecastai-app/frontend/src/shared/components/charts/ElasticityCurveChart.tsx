import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { ElasticityData } from '../../types';

interface ElasticityCurveChartProps {
  data: ElasticityData;
  className?: string;
}

const CHANNEL_COLORS: Record<string, string> = {
  'Google Ads': '#AEBBA0',
  'Meta Ads': '#141414',
  'Microsoft Ads': '#8A8782',
};

export default function ElasticityCurveChart({
  data,
  className,
}: ElasticityCurveChartProps) {
  const chartData = data.budgets.map((budget, i) => ({
    budget: Math.round(budget),
    revenue: Math.round(data.revenues[i]),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="rounded-lg border border-dark-650/50 bg-white/95 p-3 shadow-[0_6px_20px_rgba(0,0,0,0.08)] backdrop-blur-xl">
        <p className="mb-1 text-xs text-dark-400">Budget: {formatCurrency(parseFloat(label))}</p>
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-medium text-dark-300">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
          <XAxis
            dataKey="budget"
            tick={{ fill: '#565650', fontSize: 11 }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
            axisLine={{ stroke: 'rgba(0,0,0,0.06)' }}
            tickLine={false}
            label={{ value: 'Budget ($)', position: 'bottom', fill: '#565650', fontSize: 11 }}
          />
          <YAxis
            tick={{ fill: '#565650', fontSize: 11 }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
            axisLine={{ stroke: 'rgba(0,0,0,0.06)' }}
            tickLine={false}
            label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft', fill: '#565650', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#565650' }} />
          <Line
            type="monotone"
            dataKey="revenue"
            name={data.channel}
            stroke={CHANNEL_COLORS[data.channel] || '#141414'}
            strokeWidth={2}
            dot={{ fill: CHANNEL_COLORS[data.channel] || '#141414', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
