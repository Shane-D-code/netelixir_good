"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHolidays = getHolidays;
exports.getUpcomingHolidays = getUpcomingHolidays;
exports.checkHoliday = checkHoliday;
const holidayService_1 = require("../services/holidayService");
const errorHandler_1 = require("../middleware/errorHandler");
const holidayService = new holidayService_1.HolidayService();
async function getHolidays(req, res, next) {
    try {
        const year = req.query.year ? parseInt(req.query.year) : undefined;
        const holidays = holidayService.getHolidays(year);
        res.json({ success: true, holidays });
    }
    catch (err) {
        next(err);
    }
}
async function getUpcomingHolidays(req, res, next) {
    try {
        const days = req.query.days ? parseInt(req.query.days) : 30;
        const holidays = holidayService.getUpcomingHolidays(days);
        res.json({ success: true, holidays });
    }
    catch (err) {
        next(err);
    }
}
async function checkHoliday(req, res, next) {
    try {
        const { date } = req.params;
        if (!date)
            throw new errorHandler_1.ValidationError('Date parameter is required (YYYY-MM-DD)');
        const result = holidayService.isHoliday(date);
        res.json({ success: true, ...result });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=holidayController.js.map