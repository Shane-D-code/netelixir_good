import { Database as DatabaseType } from 'better-sqlite3';
declare const db: DatabaseType;
export declare function saveForecast(id: string, params: any, result?: any, error?: string): void;
export declare function getForecast(id: string): any;
export declare function getUserForecasts(userId: string): any[];
export declare function createUser(email: string, name?: string): any;
export declare function getUserByEmail(email: string): any;
export default db;
//# sourceMappingURL=database.d.ts.map