import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

interface ChannelBreakdownChartProps {
  data: Record<string, number>;
  className?: string;
}

const CHANNEL_COLORS: Record<string, string> = {
  'Google Ads': '#141414',
  'Meta Ads': '#565650',
  'Microsoft Ads': '#8A8782',
};

export default function ChannelBreakdownChart({
  data,
  className,
}: ChannelBreakdownChartProps) {
  const chartData = Object.entries(data).map(([channel, value]) => ({
    channel,
    revenue: value,
    fill: CHANNEL_COLORS[channel] || '#8A8782',
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="rounded-lg border border-dark-650/50 bg-white/95 p-3 shadow-[0_6px_20px_rgba(0,0,0,0.08)] backdrop-blur-xl">
        <p className="mb-1 text-sm text-dark-300">{label}</p>
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-dark-300">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
          <XAxis
            dataKey="channel"
            tick={{ fill: '#565650', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(0,0,0,0.06)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#565650', fontSize: 11 }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
            axisLine={{ stroke: 'rgba(0,0,0,0.06)' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#565650' }} />
          <Bar dataKey="revenue" name="Forecast Revenue" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <rect key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
