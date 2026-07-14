export interface Holiday {
  name: string;
  date: string;
  type: string;
  region: string;
  multiplier: number;
}

const HOLIDAY_TEMPLATES: Array<{ name: string; type: string; multiplier: number; getDate: (year: number) => string }> = [
  { name: "New Year's Day", type: 'public', multiplier: 1.5, getDate: (y) => `${y}-01-01` },
  { name: 'Martin Luther King Jr. Day', type: 'public', multiplier: 1.0, getDate: (y) => getNthWeekday(y, 0, 1, 3) },
  { name: "Valentine's Day", type: 'observance', multiplier: 1.4, getDate: (y) => `${y}-02-14` },
  { name: "Presidents' Day", type: 'public', multiplier: 1.0, getDate: (y) => getNthWeekday(y, 1, 1, 1) },
  { name: "St. Patrick's Day", type: 'observance', multiplier: 1.1, getDate: (y) => `${y}-03-17` },
  { name: 'Easter Sunday', type: 'public', multiplier: 1.2, getDate: (y) => getEasterDate(y) },
  { name: 'Earth Day', type: 'observance', multiplier: 1.0, getDate: (y) => `${y}-04-22` },
  { name: 'Cinco de Mayo', type: 'observance', multiplier: 1.1, getDate: (y) => `${y}-05-05` },
  { name: "Mother's Day", type: 'observance', multiplier: 1.3, getDate: (y) => getNthWeekday(y, 4, 2, 0) },
  { name: 'Memorial Day', type: 'public', multiplier: 1.2, getDate: (y) => getLastWeekday(y, 4, 1) },
  { name: "Father's Day", type: 'observance', multiplier: 1.2, getDate: (y) => getNthWeekday(y, 5, 3, 0) },
  { name: 'Independence Day', type: 'public', multiplier: 1.3, getDate: (y) => `${y}-07-04` },
  { name: 'Labor Day', type: 'public', multiplier: 1.2, getDate: (y) => getNthWeekday(y, 8, 1, 1) },
  { name: 'Halloween', type: 'observance', multiplier: 1.3, getDate: (y) => `${y}-10-31` },
  { name: 'Veterans Day', type: 'public', multiplier: 1.0, getDate: (y) => `${y}-11-11` },
  { name: 'Thanksgiving', type: 'public', multiplier: 1.6, getDate: (y) => getNthWeekday(y, 10, 4, 3) },
  { name: 'Black Friday', type: 'observance', multiplier: 2.5, getDate: (y) => {
    const tg = new Date(getNthWeekday(y, 10, 4, 3));
    tg.setDate(tg.getDate() + 1);
    return tg.toISOString().split('T')[0];
  }},
  { name: 'Cyber Monday', type: 'observance', multiplier: 2.3, getDate: (y) => {
    const tg = new Date(getNthWeekday(y, 10, 4, 3));
    tg.setDate(tg.getDate() + 4);
    return tg.toISOString().split('T')[0];
  }},
  { name: 'Christmas Eve', type: 'observance', multiplier: 1.8, getDate: (y) => `${y}-12-24` },
  { name: 'Christmas Day', type: 'public', multiplier: 2.0, getDate: (y) => `${y}-12-25` },
  { name: "New Year's Eve", type: 'observance', multiplier: 1.5, getDate: (y) => `${y}-12-31` },
];

function getNthWeekday(year: number, month: number, nth: number, weekday: number): string {
  const d = new Date(year, month, 1);
  while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
  d.setDate(d.getDate() + (nth - 1) * 7);
  return d.toISOString().split('T')[0];
}

function getLastWeekday(year: number, month: number, weekday: number): string {
  const d = new Date(year, month + 1, 0);
  while (d.getDay() !== weekday) d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function getEasterDate(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function generateHolidaysForYear(year: number): Holiday[] {
  return HOLIDAY_TEMPLATES.map(template => ({
    name: template.name,
    date: template.getDate(year),
    type: template.type,
    region: 'US',
    multiplier: template.multiplier,
  }));
}

export class HolidayService {
  getHolidays(year?: number): Holiday[] {
    if (year) return generateHolidaysForYear(year);

    const currentYear = new Date().getFullYear();
    const holidays: Holiday[] = [];
    for (let y = currentYear - 1; y <= currentYear + 2; y++) {
      holidays.push(...generateHolidaysForYear(y));
    }
    return holidays;
  }

  getUpcomingHolidays(days: number = 30): Holiday[] {
    const today = new Date();
    const future = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    const currentYear = today.getFullYear();
    const allHolidays = [
      ...generateHolidaysForYear(currentYear),
      ...generateHolidaysForYear(currentYear + 1),
    ];

    return allHolidays.filter(h => {
      const d = new Date(h.date);
      return d >= today && d <= future;
    });
  }

  isHoliday(dateStr: string): { isHoliday: boolean; holiday?: Holiday } {
    const d = new Date(dateStr);
    const yearHolidays = generateHolidaysForYear(d.getFullYear());
    const match = yearHolidays.find(h => h.date === dateStr);
    if (match) return { isHoliday: true, holiday: match };
    return { isHoliday: false };
  }

  getHolidayMultiplier(holidayName: string): number {
    const currentYear = new Date().getFullYear();
    const allHolidays = generateHolidaysForYear(currentYear);
    const match = allHolidays.find(h => h.name === holidayName);
    return match?.multiplier || 1.0;
  }
}
