import EventEmitter from 'events';
interface ForecastJob {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    result?: any;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare class JobQueue extends EventEmitter {
    private jobs;
    createJob(): string;
    getJob(id: string): ForecastJob | null;
    updateProgress(id: string, progress: number, status?: ForecastJob['status']): void;
    completeJob(id: string, result: any): void;
    failJob(id: string, error: string): void;
    getActiveCount(): number;
    cleanup(olderThanMinutes?: number): void;
}
export declare const jobQueue: JobQueue;
export {};
//# sourceMappingURL=jobQueue.d.ts.map