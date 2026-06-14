export interface CampaignMetrics {
  name: string;
  channel: string;
  type: 'brand' | 'non_brand' | 'remarketing' | 'shopping' | 'display' | 'other';
  revenue: number;
  roas: number;
  conversionRate: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface CampaignForecast {
  campaignName: string;
  channel: string;
  campaignType: string;
  p10_revenue: number;
  p50_revenue: number;
  p90_revenue: number;
  p10_roas: number;
  p50_roas: number;
  p90_roas: number;
  confidence_score: number;
}

export class CampaignAnalyzer {
  private campaignTypes: Record<string, string[]> = {
    brand: ['brand', 'tm', 'trademark', 'exact', 'phrase'],
    non_brand: ['nonbrand', 'generic', 'category'],
    remarketing: ['remarket', 'retarget', 'remarketing', 'display'],
    shopping: ['shopping', 'pla', 'product', 'feed'],
    display: ['display', 'banner', 'prospecting', 'awareness'],
  };

  detectCampaignType(campaignName: string): string {
    const name = campaignName.toLowerCase();
    for (const [type, keywords] of Object.entries(this.campaignTypes)) {
      if (keywords.some(kw => name.includes(kw))) return type;
    }
    return 'other';
  }

  analyzeCampaigns(data: any[], channelBudgets: Record<string, number>) {
    const campaignMap = new Map<string, CampaignMetrics>();
    const channelCounts = new Map<string, number>();

    for (const row of data) {
      const campaignName = row.campaign_name || row.campaign || 'Unknown';
      const channel = row.channel;
      const revenue = row.revenue || 0;

      if (!campaignMap.has(campaignName)) {
        campaignMap.set(campaignName, {
          name: campaignName,
          channel,
          type: this.detectCampaignType(campaignName) as any,
          revenue: 0,
          roas: 0,
          conversionRate: 0,
          trend: 'stable',
        });
        channelCounts.set(channel, (channelCounts.get(channel) || 0) + 1);
      }
      campaignMap.get(campaignName)!.revenue += revenue;
    }

    const campaigns = Array.from(campaignMap.values());
    for (const c of campaigns) {
      const budget = channelBudgets[c.channel] || 0;
      const count = channelCounts.get(c.channel) || 1;
      c.roas = c.revenue / Math.max(1, budget / count);
      c.trend = c.revenue > 50000 ? 'increasing' : c.revenue < 10000 ? 'decreasing' : 'stable';
    }

    const sorted = [...campaigns].sort((a, b) => b.roas - a.roas);
    return {
      campaigns,
      topPerformers: sorted.slice(0, 5),
      underperformers: sorted.slice(-3),
      recommendations: this.generateRecommendations(sorted),
    };
  }

  private generateRecommendations(campaigns: CampaignMetrics[]): string[] {
    const recs: string[] = [];
    if (campaigns[0]) recs.push(`Increase budget for ${campaigns[0].name} by 15-20% (${campaigns[0].roas.toFixed(2)}x ROAS)`);
    const worst = campaigns[campaigns.length - 1];
    if (worst && worst.roas < 1.5) recs.push(`Pause or reduce ${worst.name} - below profitability threshold`);
    return recs;
  }

  forecastCampaigns(data: any[], channelForecasts: any, campaignBudgets: Record<string, number>): CampaignForecast[] {
    const campaigns = this.analyzeCampaigns(data, {}).campaigns;
    const results: CampaignForecast[] = [];

    for (const campaign of campaigns) {
      const chFc = channelForecasts?.[campaign.channel];
      if (!chFc) continue;

      const historicalTotal = chFc.historical?.reduce((a: number, b: number) => a + b, 0) || 1;
      const revenueShare = campaign.revenue / historicalTotal;
      const channelRevenue = chFc.p50_revenue || 0;
      const campaignBudget = campaignBudgets[campaign.name] || 1;

      results.push({
        campaignName: campaign.name,
        channel: campaign.channel,
        campaignType: campaign.type,
        p10_revenue: (chFc.p10_revenue || 0) * revenueShare,
        p50_revenue: channelRevenue * revenueShare,
        p90_revenue: (chFc.p90_revenue || 0) * revenueShare,
        p10_roas: ((chFc.p10_revenue || 0) * revenueShare) / campaignBudget,
        p50_roas: (channelRevenue * revenueShare) / campaignBudget,
        p90_roas: ((chFc.p90_revenue || 0) * revenueShare) / campaignBudget,
        confidence_score: 0.8,
      });
    }
    return results;
  }
}

export const campaignAnalyzer = new CampaignAnalyzer();
