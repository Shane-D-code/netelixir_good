import { ForecastRequest, RawDataRow } from '../models/ForecastRequest';
import { ForecastResult } from '../models/ForecastResult';
export declare function parseCSVData(csvContent: string): RawDataRow[];
export declare function normalizeChannel(name: string): string;
export declare function validateData(data: RawDataRow[]): string[];
export declare class ForecastService {
    generateForecast(csvContent: string, params: ForecastRequest): Promise<ForecastResult>;
}
export declare const forecastService: ForecastService;
//# sourceMappingURL=forecastService.d.ts.map