import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

interface CampaignPieChartProps {
  data: Record<string, number>;
  className?: string;
}

const COLORS = ['#141414', '#565650', '#8A8782', '#B3B0A9', '#AEBBA0', '#ECECEA'];

export default function CampaignPieChart({
  data,
  className,
}: CampaignPieChartProps) {
  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload) return null;
    const item = payload[0];
    const pct = ((item.value / total) * 100).toFixed(1);
    return (
      <div className="rounded-lg border border-dark-650/50 bg-white/95 p-3 shadow-[0_6px_20px_rgba(0,0,0,0.08)] backdrop-blur-xl">
        <p className="text-sm font-medium text-dark-100">{item.name}</p>
        <p className="text-sm text-dark-300">{formatCurrency(item.value)} ({pct}%)</p>
      </div>
    );
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="rgba(255,255,255,0.6)"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#565650' }}
            formatter={(value: string) => (
              <span className="text-dark-300">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
