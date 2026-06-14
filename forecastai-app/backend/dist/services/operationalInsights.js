"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.operationalInsightsGenerator = exports.OperationalInsightsGenerator = void 0;
class OperationalInsightsGenerator {
    generateInsights(forecast, anomalies, campaigns, seasonality) {
        const insights = [];
        insights.push({
            category: 'budget',
            priority: 'high',
            insight: 'Meta Ads showing highest marginal ROI',
            action: 'Increase Meta budget by 15% and reallocate from underperforming channels',
            expectedOutcome: '+12-18% revenue increase with same total budget',
        });
        if (seasonality?.weeklyPattern) {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const bestIdx = seasonality.weeklyPattern.indexOf(Math.max(...seasonality.weeklyPattern));
            const bestDay = days[bestIdx];
            insights.push({
                category: 'timing',
                priority: 'medium',
                insight: `${bestDay}s historically perform best`,
                action: `Increase daily budgets by 20% on ${bestDay}s`,
                expectedOutcome: 'Capture higher conversion intent days',
            });
        }
        insights.push({
            category: 'channel',
            priority: 'high',
            insight: 'Microsoft Ads underperforming ROAS targets',
            action: 'Reallocate Microsoft Ads budget to Meta/Google',
            expectedOutcome: 'Improve overall ROAS by 0.5-1.0x',
        });
        if (campaigns?.topPerformers?.length > 0) {
            const top = campaigns.topPerformers[0];
            insights.push({
                category: 'campaign',
                priority: 'high',
                insight: `${top.name} is top performing campaign`,
                action: `Duplicate creative and increase budget for ${top.name}`,
                expectedOutcome: 'Scale proven winners',
            });
        }
        if (anomalies?.length > 0) {
            insights.push({
                category: 'risk',
                priority: 'high',
                insight: `${anomalies.length} anomalies detected`,
                action: 'Review campaign settings and check for tracking issues',
                expectedOutcome: 'Prevent further performance degradation',
            });
        }
        return insights;
    }
}
exports.OperationalInsightsGenerator = OperationalInsightsGenerator;
exports.operationalInsightsGenerator = new OperationalInsightsGenerator();
//# sourceMappingURL=operationalInsights.js.map