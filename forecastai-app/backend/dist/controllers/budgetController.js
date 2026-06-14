"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateBudget = simulateBudget;
exports.optimizeBudget = optimizeBudget;
exports.getElasticityCurve = getElasticityCurve;
const budgetOptimizerService_1 = require("../services/budgetOptimizerService");
const errorHandler_1 = require("../middleware/errorHandler");
async function simulateBudget(req, res, next) {
    try {
        const { channel, percentage_change, current_budgets, base_revenue } = req.body;
        if (!channel || percentage_change === undefined || !current_budgets || !base_revenue) {
            throw new errorHandler_1.ValidationError('channel, percentage_change, current_budgets, and base_revenue are required');
        }
        const result = budgetOptimizerService_1.budgetOptimizerService.simulateBudgetChange(current_budgets, channel, percentage_change, base_revenue);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
}
async function optimizeBudget(req, res, next) {
    try {
        const { current_budgets, total_budget, historical_roas } = req.body;
        if (!current_budgets || !total_budget || !historical_roas) {
            throw new errorHandler_1.ValidationError('current_budgets, total_budget, and historical_roas are required');
        }
        const result = budgetOptimizerService_1.budgetOptimizerService.optimizeAllocation(current_budgets, total_budget, historical_roas);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
}
async function getElasticityCurve(req, res, next) {
    try {
        const { channel } = req.params;
        const { current_budgets, base_revenue } = req.query;
        if (!channel || !current_budgets || !base_revenue) {
            throw new errorHandler_1.ValidationError('channel, current_budgets, and base_revenue are required');
        }
        const result = budgetOptimizerService_1.budgetOptimizerService.getRevenueCurve(JSON.parse(current_budgets), parseFloat(base_revenue), channel);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=budgetController.js.map