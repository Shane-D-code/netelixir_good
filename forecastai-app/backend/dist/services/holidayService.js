"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HolidayService = void 0;
const STATIC_HOLIDAYS = [
    { name: "New Year's Day", date: '2026-01-01', type: 'public', region: 'US', multiplier: 1.5 },
    { name: 'Martin Luther King Jr. Day', date: '2026-01-19', type: 'public', region: 'US', multiplier: 1.0 },
    { name: "Valentine's Day", date: '2026-02-14', type: 'observance', region: 'US', multiplier: 1.4 },
    { name: "Presidents' Day", date: '2026-02-16', type: 'public', region: 'US', multiplier: 1.0 },
    { name: "St. Patrick's Day", date: '2026-03-17', type: 'observance', region: 'US', multiplier: 1.1 },
    { name: 'Easter Sunday', date: '2026-04-05', type: 'public', region: 'US', multiplier: 1.2 },
    { name: 'Earth Day', date: '2026-04-22', type: 'observance', region: 'US', multiplier: 1.0 },
    { name: 'Cinco de Mayo', date: '2026-05-05', type: 'observance', region: 'US', multiplier: 1.1 },
    { name: "Mother's Day", date: '2026-05-10', type: 'observance', region: 'US', multiplier: 1.3 },
    { name: 'Memorial Day', date: '2026-05-25', type: 'public', region: 'US', multiplier: 1.2 },
    { name: "Father's Day", date: '2026-06-21', type: 'observance', region: 'US', multiplier: 1.2 },
    { name: 'Independence Day', date: '2026-07-04', type: 'public', region: 'US', multiplier: 1.3 },
    { name: 'Labor Day', date: '2026-09-07', type: 'public', region: 'US', multiplier: 1.2 },
    { name: 'Halloween', date: '2026-10-31', type: 'observance', region: 'US', multiplier: 1.3 },
    { name: 'Veterans Day', date: '2026-11-11', type: 'public', region: 'US', multiplier: 1.0 },
    { name: 'Black Friday', date: '2026-11-27', type: 'observance', region: 'US', multiplier: 2.5 },
    { name: 'Cyber Monday', date: '2026-11-30', type: 'observance', region: 'US', multiplier: 2.3 },
    { name: 'Christmas Eve', date: '2026-12-24', type: 'observance', region: 'US', multiplier: 1.8 },
    { name: 'Christmas Day', date: '2026-12-25', type: 'public', region: 'US', multiplier: 2.0 },
    { name: "New Year's Eve", date: '2026-12-31', type: 'observance', region: 'US', multiplier: 1.5 },
];
class HolidayService {
    getHolidays(year) {
        if (!year)
            return STATIC_HOLIDAYS;
        return STATIC_HOLIDAYS.filter(h => h.date.startsWith(String(year)));
    }
    getUpcomingHolidays(days = 30) {
        const today = new Date();
        const future = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
        return STATIC_HOLIDAYS.filter(h => {
            const d = new Date(h.date);
            return d >= today && d <= future;
        });
    }
    isHoliday(dateStr) {
        const match = STATIC_HOLIDAYS.find(h => h.date === dateStr);
        if (match)
            return { isHoliday: true, holiday: match };
        return { isHoliday: false };
    }
    getHolidayMultiplier(holidayName) {
        const match = STATIC_HOLIDAYS.find(h => h.name === holidayName);
        return match?.multiplier || 1.0;
    }
}
exports.HolidayService = HolidayService;
//# sourceMappingURL=holidayService.js.map