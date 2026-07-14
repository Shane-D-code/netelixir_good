import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../../../core/logging/logger';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });

export interface LLMInsights {
  forecastExplanation: string;
  anomalyInterpretations: Array<{ date: string; explanation: string }>;
  operationalRisks: string[];
  causalSummary: string;
  budgetRecommendations: string[];
  confidence: 'High' | 'Medium' | 'Low';
}

export class LLMService {
  private useGroq: boolean;

  constructor() {
    this.useGroq = !!process.env.GROQ_API_KEY;
  }

  async generateForecastInsights(
    forecastData: any,
    anomalies: any[],
    causalDrivers: any[],
    budgetData: any
  ): Promise<LLMInsights> {
    const prompt = this.buildInsightPrompt(forecastData, anomalies, causalDrivers, budgetData);
    try {
      const response = await this.callLLM(prompt);
      return this.parseInsightsResponse(response, forecastData, anomalies);
    } catch (error) {
      logger.error('LLM insight generation failed', { error });
      return this.getFallbackInsights(forecastData, anomalies);
    }
  }

  async explainForecast(forecastData: any): Promise<string> {
    const channelBreakdown = Object.entries(forecastData.channel_forecasts || {})
      .map(([ch, data]: [string, any]) => {
        const roas = data.p50_revenue / (data.budget || 1);
        return `- ${ch}: $${(data.p50_revenue || 0).toLocaleString()} (ROAS: ${roas.toFixed(2)}x)`;
      })
      .join('\n');

    const prompt = `
You are an expert e-commerce analyst. Explain this revenue forecast in simple terms.

FORECAST DATA:
- Expected Revenue: $${(forecastData.p50_revenue || 0).toLocaleString()}
- Range (80% confidence): $${(forecastData.p10_revenue || 0).toLocaleString()} - $${(forecastData.p90_revenue || 0).toLocaleString()}
- Expected ROAS: ${(forecastData.roas || 0).toFixed(2)}x
- Forecast Period: ${forecastData.forecast_days || 60} days

CHANNEL BREAKDOWN:
${channelBreakdown}

Please explain:
1. What does this forecast tell the marketing team?
2. Which channel is performing best and why?
3. What is the level of uncertainty and what does it mean?

Keep response under 200 words. Be conversational but professional.
`;

    return await this.callLLM(prompt);
  }

  async interpretAnomaly(anomaly: any, contextData: any): Promise<string> {
    const deviation = (((anomaly.revenue - anomaly.expected_revenue) / anomaly.expected_revenue) * 100).toFixed(1);

    const prompt = `
You are an expert analyst. Interpret this revenue anomaly.

ANOMALY DETAILS:
- Date: ${anomaly.date}
- Actual Revenue: $${(anomaly.revenue || 0).toLocaleString()}
- Expected Revenue: $${(anomaly.expected_revenue || 0).toLocaleString()}
- Deviation: ${deviation}%
- Severity: ${anomaly.severity || 'medium'}

HISTORICAL CONTEXT:
- Day of week: ${anomaly.day_of_week || 'Unknown'}
- Is holiday period: ${anomaly.is_holiday ? 'Yes' : 'No'}
- Previous 7-day trend: ${anomaly.trend_7d || 'Unknown'}

Provide:
1. Likely cause of this anomaly
2. Whether this is concerning or normal
3. Recommended action for the marketing team

Keep response under 150 words.
`;

    return await this.callLLM(prompt);
  }

  async identifyRisks(forecastData: any, anomalies: any[]): Promise<string[]> {
    const channelHealth = Object.entries(forecastData.channel_forecasts || {})
      .map(([ch, data]: [string, any]) => {
        const roas = data.p50_revenue / (data.budget || 1);
        const volatility = ((data.p90_revenue - data.p10_revenue) / data.p50_revenue * 100).toFixed(0);
        return `- ${ch}: ROAS ${roas.toFixed(2)}x, Volatility ${volatility}%`;
      })
      .join('\n');

    const prompt = `
Based on this e-commerce forecast, identify the TOP 3 operational risks.

FORECAST METRICS:
- Revenue Range: $${(forecastData.p10_revenue || 0).toLocaleString()} - $${(forecastData.p90_revenue || 0).toLocaleString()}
- Uncertainty Width: $${((forecastData.p90_revenue || 0) - (forecastData.p10_revenue || 0)).toLocaleString()}
- Expected ROAS: ${(forecastData.roas || 0).toFixed(2)}x
- Confidence Score: ${((1 - ((forecastData.p90_revenue - forecastData.p10_revenue) / forecastData.p50_revenue)) * 100).toFixed(0)}%

ANOMALIES DETECTED: ${anomalies.length} anomalies in last 30 days

CHANNEL HEALTH:
${channelHealth}

Return ONLY 3 bullet points. Each bullet should be a specific, actionable risk.
Example: "- Meta Ads shows 25% volatility - consider reducing spend by 10%"
`;

    const response = await this.callLLM(prompt);
    return response.split('\n').filter((line: string) => line.trim().startsWith('-') || line.trim().startsWith('•'));
  }

  async generateCausalSummary(causalDrivers: any[]): Promise<string> {
    const prompt = `
Summarize these causal drivers of revenue performance:

${causalDrivers.map((d: any) => `- ${d.name}: ${d.impact}% impact (${d.direction})`).join('\n')}

Write a 2-3 sentence executive summary explaining what's driving revenue.
Focus on actionable insights for the marketing team.
`;

    return await this.callLLM(prompt);
  }

  async generateBudgetRecommendations(
    currentBudgets: Record<string, number>,
    roasByChannel: Record<string, number>,
    marginalROI: Record<string, number>
  ): Promise<string[]> {
    const prompt = `
Based on channel performance, provide budget reallocation recommendations.

CURRENT BUDGETS:
${Object.entries(currentBudgets).map(([ch, budget]) => `- ${ch}: $${budget.toLocaleString()}`).join('\n')}

ROAS BY CHANNEL:
${Object.entries(roasByChannel).map(([ch, roas]) => `- ${ch}: ${roas.toFixed(2)}x`).join('\n')}

MARGINAL ROI:
${Object.entries(marginalROI).map(([ch, roi]) => `- ${ch}: ${(roi * 100).toFixed(1)}%`).join('\n')}

Provide 3 specific recommendations:
1. Which channel to increase and by how much (%)
2. Which channel to decrease and by how much (%)
3. Expected impact on overall ROAS

Be specific with percentages.
`;

    const response = await this.callLLM(prompt);
    return response.split('\n').filter((line: string) => line.trim().length > 0);
  }

  private async callLLM(prompt: string): Promise<string> {
    if (this.useGroq && process.env.GROQ_API_KEY) {
      try {
        return await this.callGroq(prompt);
      } catch (error) {
        logger.warn('Groq failed, falling back to Gemini', { error });
        if (process.env.GEMINI_API_KEY) return await this.callGemini(prompt);
        throw error;
      }
    }

    if (process.env.GEMINI_API_KEY) {
      return await this.callGemini(prompt);
    }

    return this.getFallbackResponse(prompt);
  }

  private async callGroq(prompt: string): Promise<string> {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert e-commerce marketing analyst. Provide concise, actionable insights. Use markdown for formatting but keep it clean.'
        },
        { role: 'user', content: prompt }
      ],
      model: 'mixtral-8x7b-32768',
      temperature: 0.3,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || '';
  }

  private async callGemini(prompt: string): Promise<string> {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  private buildInsightPrompt(
    forecastData: any,
    anomalies: any[],
    causalDrivers: any[],
    budgetData: any
  ): string {
    return `
You are an expert e-commerce analyst. Generate insights for this forecast.

FORECAST:
- Revenue: $${(forecastData.p50_revenue || 0).toLocaleString()} (range: $${(forecastData.p10_revenue || 0).toLocaleString()} - $${(forecastData.p90_revenue || 0).toLocaleString()})
- ROAS: ${(forecastData.roas || 0).toFixed(2)}x
- Confidence: ${((1 - ((forecastData.p90_revenue - forecastData.p10_revenue) / forecastData.p50_revenue)) * 100).toFixed(0)}%

ANOMALIES: ${anomalies.length} detected
${anomalies.slice(0, 3).map((a: any) => `- ${a.date}: ${(((a.revenue - a.expected_revenue) / a.expected_revenue) * 100).toFixed(0)}% deviation`).join('\n')}

CAUSAL DRIVERS:
${causalDrivers.slice(0, 3).map((d: any) => `- ${d.name}: ${d.impact}% impact`).join('\n')}

Return a JSON object with:
{
  "executive_summary": "2-3 sentence overview",
  "top_risks": ["risk1", "risk2", "risk3"],
  "budget_recommendations": ["rec1", "rec2"],
  "operational_insights": "practical advice for the marketing team"
}
`;
  }

  private parseInsightsResponse(response: string, forecastData: any, anomalies: any[]): LLMInsights {
    try {
      const parsed = JSON.parse(response);
      return {
        forecastExplanation: parsed.executive_summary || 'Forecast generated successfully.',
        anomalyInterpretations: [],
        operationalRisks: parsed.top_risks || [],
        causalSummary: '',
        budgetRecommendations: parsed.budget_recommendations || [],
        confidence: 'Medium'
      };
    } catch {
      return this.getFallbackInsights(forecastData, anomalies);
    }
  }

  private getFallbackInsights(forecastData: any, anomalies: any[]): LLMInsights {
    return {
      forecastExplanation: `Revenue forecast shows $${(forecastData.p50_revenue || 0).toLocaleString()} with ${(forecastData.roas || 0).toFixed(2)}x ROAS. Monitor performance weekly.`,
      anomalyInterpretations: (anomalies || []).map((a: any) => ({
        date: a.date,
        explanation: `Revenue ${(((a.revenue - a.expected_revenue) / a.expected_revenue) * 100).toFixed(0)}% from expected. Check for campaign changes or external factors.`
      })),
      operationalRisks: [
        'High forecast uncertainty - maintain flexible budgets',
        'Monitor channel performance for diminishing returns',
        'Review anomalies for pattern detection'
      ],
      causalSummary: 'Revenue is primarily driven by channel performance and seasonal patterns.',
      budgetRecommendations: [
        'Maintain current budget allocation',
        'Re-evaluate in 14 days based on performance'
      ],
      confidence: 'Medium'
    };
  }

  private getFallbackResponse(prompt: string): string {
    if (prompt.includes('risks')) {
      return "- Monitor channel performance volatility\n- Watch for diminishing returns\n- Maintain budget flexibility for opportunities";
    }
    if (prompt.includes('recommendations')) {
      return "1. Increase Meta Ads by 15% (highest ROAS)\n2. Maintain Google Ads current level\n3. Reduce Microsoft by 10% (lowest efficiency)";
    }
    return "Forecast indicates stable performance with normal seasonal variation. Continue current strategy and monitor weekly.";
  }
}

export const llmService = new LLMService();
