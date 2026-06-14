export interface Holiday {
    name: string;
    date: string;
    type: string;
    region: string;
    multiplier: number;
}
export declare class HolidayService {
    getHolidays(year?: number): Holiday[];
    getUpcomingHolidays(days?: number): Holiday[];
    isHoliday(dateStr: string): {
        isHoliday: boolean;
        holiday?: Holiday;
    };
    getHolidayMultiplier(holidayName: string): number;
}
//# sourceMappingURL=holidayService.d.ts.map