import { Router } from 'express';
import express from 'express';
import { planGoal } from '../features/planner/controllers/goal-planner.controller';
import { simulatePromotion } from '../features/planner/controllers/promotion.controller';
import { runStressTest } from '../features/planner/controllers/stress-test.controller';
import { detectCreativeFatigue } from '../features/analytics/controllers/creative-fatigue.controller';
import { simulateMarketShock } from '../features/planner/controllers/market-shock.controller';
import { generateAlerts, getAlerts, acknowledgeAlert, acknowledgeAllAlerts, getUnreadCount } from '../features/alerts/controllers/alerts.controller';
import { recalculate, getPresets, findOptimalAllocation } from '../features/budget/controllers/time-machine.controller';
import { generateReport, getTemplates } from '../features/reports/controllers/reports.controller';

const router = Router();
const jsonParser = express.json();

// Goal Planner
router.post('/planner/goal', jsonParser, planGoal);

// Promotion Simulator
router.post('/planner/promo', jsonParser, simulatePromotion);

// Stress Test
router.post('/planner/stress', jsonParser, runStressTest);

// Creative Fatigue
router.post('/creative-fatigue/detect', jsonParser, detectCreativeFatigue);

// Market Shock
router.post('/planner/market-shock', jsonParser, simulateMarketShock);

// Alerts
router.post('/alerts/generate', jsonParser, generateAlerts);
router.get('/alerts', getAlerts);
router.post('/alerts/acknowledge/:id', acknowledgeAlert);
router.post('/alerts/acknowledge-all', acknowledgeAllAlerts);
router.get('/alerts/unread-count', getUnreadCount);

// Time Machine
router.post('/time-machine/recalculate', jsonParser, recalculate);
router.get('/time-machine/presets', getPresets);
router.post('/time-machine/optimal', jsonParser, findOptimalAllocation);

// Executive Summary
router.post('/reports/generate', jsonParser, generateReport);
router.get('/reports/templates', getTemplates);

export default router;
