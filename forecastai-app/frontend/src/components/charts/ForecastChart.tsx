import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ChannelForecast } from '../../types';
import { formatCurrency, formatShortDate } from '../../utils/formatters';
import { classNames } from '../../utils/formatters';

interface ForecastChartProps {
  data: ChannelForecast | 'total';
  channelForecasts?: Record<string, ChannelForecast>;
  className?: string;
  height?: number;
}

interface ChartDataPoint {
  date: string;
  median: number;
  p10: number;
  p90: number;
  p25: number;
  p75: number;
  [key: string]: string | number;
}

export default function ForecastChart({
  data,
  channelForecasts,
  className,
  height = 400,
}: ForecastChartProps) {
  const [showHistorical, setShowHistorical] = useState(true);

  let chartData: ChartDataPoint[];
  let channelName: string;

  if (data === 'total' && channelForecasts) {
    const channels = Object.values(channelForecasts);
    if (channels.length === 0) {
      return <div className="flex h-[400px] items-center justify-center text-dark-300">No forecast data</div>;
    }
    const dates = channels[0].dates;
    const histDates = channels[0].historical_dates;

    const maxLen = Math.max(dates.length, histDates.length);
    chartData = Array.from({ length: maxLen }, (_, i) => {
      const point: ChartDataPoint = { date: '', median: 0, p10: 0, p90: 0, p25: 0, p75: 0 };
      if (i < histDates.length) {
        point.date = histDates[i];
        point['actual'] = channels.reduce((sum, ch) => sum + (ch.historical[i] || 0), 0);
      }
      if (i >= histDates.length && i - histDates.length < dates.length) {
        const di = i - histDates.length;
        point.date = dates[di];
        point.median = channels.reduce((sum, ch) => sum + (ch.median[di] || 0), 0);
        point.p10 = channels.reduce((sum, ch) => sum + (ch.p10[di] || 0), 0);
        point.p90 = channels.reduce((sum, ch) => sum + (ch.p90[di] || 0), 0);
        point.p25 = channels.reduce((sum, ch) => sum + (ch.p25[di] || 0), 0);
        point.p75 = channels.reduce((sum, ch) => sum + (ch.p75[di] || 0), 0);
      }
      return point;
    });
    channelName = 'Total';
  } else if (typeof data === 'object' && data !== null) {
    const fc = data as ChannelForecast;
    const maxLen = Math.max(fc.historical.length, fc.dates.length);
    chartData = Array.from({ length: maxLen }, (_, i) => {
      const point: ChartDataPoint = { date: '', median: 0, p10: 0, p90: 0, p25: 0, p75: 0 };
      if (i < fc.historical.length) {
        point.date = fc.historical_dates[i];
        point['actual'] = fc.historical[i];
      }
      if (i >= fc.historical.length) {
        const di = i - fc.historical.length;
        point.date = fc.dates[di];
        point.median = fc.median[di];
        point.p10 = fc.p10[di];
        point.p90 = fc.p90[di];
        point.p25 = fc.p25[di];
        point.p75 = fc.p75[di];
      }
      return point;
    });
    channelName = fc.channel;
  } else {
    return <div className="flex h-[400px] items-center justify-center text-dark-300">No data</div>;
  }

  const formatYAxis = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toFixed(0);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="rounded-lg border border-dark-650/50 bg-white/95 p-3 shadow-[0_6px_20px_rgba(0,0,0,0.08)] backdrop-blur-xl">
        <p className="mb-2 text-xs text-dark-400">{label}</p>
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
    <div className={classNames('space-y-4', className)}>
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold text-dark-100">{channelName} Forecast</h3>
        <button
          onClick={() => setShowHistorical(!showHistorical)}
          className={classNames(
            'rounded-lg px-3 py-1 text-xs font-medium transition-colors',
            showHistorical ? 'bg-accent/10 text-accent' : 'bg-dark-800/50 text-dark-300'
          )}
        >
          {showHistorical ? 'Hide Historical' : 'Show Historical'}
        </button>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="p90Fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#141414" stopOpacity={0.08} />
              <stop offset="95%" stopColor="#141414" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="p75Fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#141414" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#141414" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="medianFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#141414" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#141414" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#565650', fontSize: 11 }}
            tickFormatter={(val) => formatShortDate(val)}
            axisLine={{ stroke: 'rgba(0,0,0,0.06)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#565650', fontSize: 11 }}
            tickFormatter={formatYAxis}
            axisLine={{ stroke: 'rgba(0,0,0,0.06)' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#565650' }}
          />

          {showHistorical && (
            <Area
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="#565650"
              strokeWidth={1.5}
              fill="none"
              dot={false}
            />
          )}
          <Area
            type="monotone"
            dataKey="p90"
            name="P90 Range"
            stroke="none"
            fill="url(#p90Fill)"
          />
          <Area
            type="monotone"
            dataKey="p10"
            name="P10 Range"
            stroke="none"
            fill="none"
          />
          <Area
            type="monotone"
            dataKey="p75"
            name="P75 Range"
            stroke="none"
            fill="url(#p75Fill)"
          />
          <Area
            type="monotone"
            dataKey="p25"
            name="P25 Range"
            stroke="none"
            fill="none"
          />
          <Area
            type="monotone"
            dataKey="median"
            name="Median Forecast"
            stroke="#141414"
            strokeWidth={2}
            fill="url(#medianFill)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
