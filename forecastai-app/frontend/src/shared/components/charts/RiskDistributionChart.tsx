import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

interface RiskDistributionChartProps {
  allSimulations: number[][];
  var95: number;
  className?: string;
}

export default function RiskDistributionChart({
  allSimulations,
  var95,
  className,
}: RiskDistributionChartProps) {
  const totalRevenues = allSimulations.map(
    (path) => path.reduce((a, b) => a + b, 0)
  );

  if (totalRevenues.length === 0) {
    return (
      <div className={className}>
        <div className="flex h-[300px] items-center justify-center text-dark-300">
          No simulation data
        </div>
      </div>
    );
  }

  const min = Math.min(...totalRevenues);
  const max = Math.max(...totalRevenues);
  const binCount = 30;
  const binWidth = (max - min) / binCount || 1;

  const bins = Array.from({ length: binCount }, (_, i) => {
    const binStart = min + i * binWidth;
    const binEnd = binStart + binWidth;
    const count = totalRevenues.filter(
      (r) => r >= binStart && r < binEnd
    ).length;
    return {
      bin: `${formatCurrency(binStart)}`,
      binMid: binStart + binWidth / 2,
      count,
      fill: binStart + binWidth / 2 < var95 ? '#AEBBA0' : '#AEBBA033',
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="rounded-lg border border-dark-650/50 bg-white/95 p-3 shadow-[0_6px_20px_rgba(0,0,0,0.08)] backdrop-blur-xl">
        <p className="text-sm text-dark-300">Frequency: {payload[0]?.value}</p>
      </div>
    );
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={bins} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
          <XAxis
            dataKey="bin"
            tick={{ fill: '#565650', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(0,0,0,0.06)' }}
            tickLine={false}
            tickFormatter={() => ''}
          />
          <YAxis
            tick={{ fill: '#565650', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(0,0,0,0.06)' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            x={bins.findIndex((b) => b.binMid >= var95)}
            stroke="#AEBBA0"
            strokeWidth={2}
            strokeDasharray="5 5"
            label={{
              value: 'VaR 95%',
              fill: '#AEBBA0',
              fontSize: 11,
              position: 'top',
            }}
          />
          <Bar dataKey="count" name="Frequency" radius={[2, 2, 0, 0]}>
            {bins.map((entry, index) => (
              <rect key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
