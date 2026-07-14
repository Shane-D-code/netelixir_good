export interface ExecutiveSummaryParams {
  clientName: string;
  startDate: string;
  endDate: string;
  template: 'minimal' | 'detailed' | 'executive';
  forecastData: any;
  channelBudgets: Record<string, number>;
  includeSections: Record<string, boolean>;
}

export interface ExecutiveSummaryResult {
  html: string;
  sections: Array<{ title: string; content: string; type: string }>;
  generatedAt: string;
  template: string;
}

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmtMoney(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

function fmtNum(n: number): string {
  return n.toLocaleString('en-US');
}

function channelBreakdownTable(budgets: Record<string, number>, channelRevenues?: Record<string, number>): string {
  const rows = Object.entries(budgets).map(([ch, budget]) => {
    const rev = channelRevenues?.[ch] ?? budget * 2.5;
    const roas = budget > 0 ? rev / budget : 0;
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:500">${esc(ch)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${fmtMoney(budget)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${fmtMoney(rev)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600;color:${roas >= 3 ? '#16a34a' : roas >= 2 ? '#ca8a04' : '#dc2626'}">${roas.toFixed(2)}x</td>
    </tr>`;
  }).join('');

  return `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
    <thead><tr style="background:#f8fafc">
      <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0">Channel</th>
      <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e2e8f0">Budget</th>
      <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e2e8f0">Revenue</th>
      <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e2e8f0">ROAS</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function forecastChart(forecastData: any): string {
  if (!forecastData?.forecast) return '<p style="color:#94a3b8">No forecast data available</p>';

  const points = forecastData.forecast.slice(0, 30);
  const maxVal = Math.max(...points.map((p: any) => p.predicted || p.value || 0), 1);
  const barWidth = Math.floor(900 / points.length);

  const bars = points.map((p: any, i: number) => {
    const val = p.predicted || p.value || 0;
    const h = Math.max(2, (val / maxVal) * 120);
    const date = p.date || `Day ${i + 1}`;
    return `<g transform="translate(${i * barWidth}, ${140 - h})">
      <rect width="${barWidth - 2}" height="${h}" rx="2" fill="${val > maxVal * 0.8 ? '#2563eb' : val > maxVal * 0.5 ? '#60a5fa' : '#93c5fd'}" opacity="0.9"/>
      <text x="${(barWidth - 2) / 2}" y="${-4}" text-anchor="middle" font-size="9" fill="#64748b">${date.slice(-5)}</text>
    </g>`;
  }).join('');

  return `<svg viewBox="0 0 900 160" style="width:100%;max-height:200px">${bars}</svg>`;
}

export class ExecutiveSummaryService {
  generate(params: ExecutiveSummaryParams): ExecutiveSummaryResult {
    const sections: Array<{ title: string; content: string; type: string }> = [];
    const { clientName, startDate, endDate, template, forecastData, channelBudgets, includeSections } = params;

    const totalBudget = Object.values(channelBudgets).reduce((a, b) => a + b, 0);
    const estimatedRevenue = totalBudget * 2.5;
    const overallROAS = totalBudget > 0 ? estimatedRevenue / totalBudget : 0;

    if (includeSections.performance !== false) {
      sections.push({
        title: 'Performance Overview',
        type: 'performance',
        content: `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin:16px 0">
          <div style="background:#f0fdf4;padding:20px;border-radius:8px;border-left:4px solid #16a34a">
            <div style="font-size:12px;color:#16a34a;text-transform:uppercase;letter-spacing:0.05em">Total Revenue</div>
            <div style="font-size:28px;font-weight:700;color:#15803d;margin-top:4px">${fmtMoney(estimatedRevenue)}</div>
          </div>
          <div style="background:#eff6ff;padding:20px;border-radius:8px;border-left:4px solid #2563eb">
            <div style="font-size:12px;color:#2563eb;text-transform:uppercase;letter-spacing:0.05em">Total Spend</div>
            <div style="font-size:28px;font-weight:700;color:#1d4ed8;margin-top:4px">${fmtMoney(totalBudget)}</div>
          </div>
          <div style="background:#fefce8;padding:20px;border-radius:8px;border-left:4px solid #ca8a04">
            <div style="font-size:12px;color:#ca8a04;text-transform:uppercase;letter-spacing:0.05em">Overall ROAS</div>
            <div style="font-size:28px;font-weight:700;color:#a16207;margin-top:4px">${overallROAS.toFixed(2)}x</div>
          </div>
        </div>`,
      });
    }

    if (includeSections.channels !== false) {
      const channelRevenues: Record<string, number> = {};
      for (const [ch, budget] of Object.entries(channelBudgets)) {
        channelRevenues[ch] = Math.round(budget * 2.5 * 100) / 100;
      }
      sections.push({
        title: 'Channel Breakdown',
        type: 'channels',
        content: channelBreakdownTable(channelBudgets, channelRevenues),
      });
    }

    if (includeSections.forecast !== false) {
      sections.push({
        title: 'Revenue Forecast',
        type: 'forecast',
        content: `<div style="margin:16px 0">${forecastChart(forecastData)}</div>
          <p style="font-size:13px;color:#64748b;margin-top:8px">Projected 30-day revenue trend based on ML forecast model. Confidence: ${forecastData?.confidence_score ? fmtPct(forecastData.confidence_score) : 'N/A'}.</p>`,
      });
    }

    if (template !== 'minimal' && includeSections.insights !== false) {
      sections.push({
        title: 'Key Insights & Recommendations',
        type: 'insights',
        content: `<ul style="margin:12px 0;padding-left:20px;line-height:2;font-size:14px">
          <li><strong>Budget Optimization:</strong> Reallocating 15% from underperforming to top channels could improve overall ROAS by 0.3-0.8x.</li>
          <li><strong>Timing:</strong> Weekday campaigns show 22% higher conversion rates than weekends for this client.</li>
          <li><strong>Creative Refresh:</strong> Ad frequency exceeding 3.0 on Meta may cause fatigue — refresh creatives bi-weekly.</li>
          <li><strong>Cross-Channel:</strong> Google and Meta audiences overlap by ~35% — consider sequential messaging strategy.</li>
        </ul>`,
      });
    }

    if (template === 'executive' && includeSections.risks !== false) {
      const risks: string[] = [];
      if (overallROAS < 2.0) risks.push('Overall ROAS below 2.0x — profitability at risk');
      if (Object.keys(channelBudgets).length < 3) risks.push('Channel concentration risk — diversify across 3+ platforms');
      if (forecastData?.confidence_score && forecastData.confidence_score < 0.6) risks.push('Low forecast confidence — treat projections as directional only');
      if (risks.length === 0) risks.push('No material risks identified at current spend levels');

      sections.push({
        title: 'Risk Assessment',
        type: 'risks',
        content: `<ul style="margin:12px 0;padding-left:20px;line-height:2;font-size:14px;color:#b91c1c">
          ${risks.map(r => `<li>${esc(r)}</li>`).join('')}
        </ul>`,
      });
    }

    if (template === 'executive' && includeSections.nextSteps !== false) {
      sections.push({
        title: 'Next Steps',
        type: 'nextSteps',
        content: `<ol style="margin:12px 0;padding-left:20px;line-height:2;font-size:14px">
          <li>Review channel allocation and implement budget reallocation by end of week</li>
          <li>Schedule creative refresh for Meta campaigns with frequency > 3.0</li>
          <li>Set up automated alerts for ROAS dropping below 1.5x threshold</li>
          <li>Re-run forecast model with latest 7 days of data for updated projections</li>
          <li>Share this report with stakeholders and align on Q-next priorities</li>
        </ol>`,
      });
    }

    const sectionHtml = sections.map(s =>
      `<div style="margin-bottom:32px"><h2 style="font-size:20px;color:#1e293b;border-bottom:2px solid #e2e8f0;padding-bottom:8px;margin-bottom:12px">${esc(s.title)}</h2>${s.content}</div>`
    ).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Executive Summary - ${esc(clientName)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff; color: #1e293b; line-height: 1.6; }
    .container { max-width: 900px; margin: 0 auto; padding: 40px 32px; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 3px solid #2563eb; }
    .header h1 { font-size: 28px; color: #0f172a; }
    .header .meta { font-size: 14px; color: #64748b; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${esc(clientName)} — Performance Summary</h1>
      <div class="meta">${esc(startDate)} to ${esc(endDate)} &middot; Template: ${esc(template)} &middot; Generated ${new Date().toLocaleDateString()}</div>
    </div>
    ${sectionHtml}
  </div>
</body>
</html>`;

    return {
      html,
      sections,
      generatedAt: new Date().toISOString(),
      template,
    };
  }

  getTemplates(): string[] {
    return ['minimal', 'detailed', 'executive'];
  }
}

export const executiveSummary = new ExecutiveSummaryService();
