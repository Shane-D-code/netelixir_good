"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobQueue = void 0;
const uuid_1 = require("uuid");
const events_1 = __importDefault(require("events"));
class JobQueue extends events_1.default {
    constructor() {
        super(...arguments);
        this.jobs = new Map();
    }
    createJob() {
        const id = (0, uuid_1.v4)();
        this.jobs.set(id, {
            id,
            status: 'pending',
            progress: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return id;
    }
    getJob(id) {
        return this.jobs.get(id) || null;
    }
    updateProgress(id, progress, status) {
        const job = this.jobs.get(id);
        if (job) {
            job.progress = progress;
            if (status)
                job.status = status;
            job.updatedAt = new Date();
            this.emit('progress', { id, progress, status: job.status });
            this.jobs.set(id, job);
        }
    }
    completeJob(id, result) {
        const job = this.jobs.get(id);
        if (job) {
            job.status = 'completed';
            job.progress = 100;
            job.result = result;
            job.updatedAt = new Date();
            this.jobs.set(id, job);
            this.emit('complete', { id, result });
        }
    }
    failJob(id, error) {
        const job = this.jobs.get(id);
        if (job) {
            job.status = 'failed';
            job.error = error;
            job.updatedAt = new Date();
            this.jobs.set(id, job);
            this.emit('failed', { id, error });
        }
    }
    getActiveCount() {
        let count = 0;
        for (const job of this.jobs.values()) {
            if (job.status === 'processing')
                count++;
        }
        return count;
    }
    cleanup(olderThanMinutes = 60) {
        const now = new Date();
        for (const [id, job] of this.jobs) {
            const age = (now.getTime() - job.createdAt.getTime()) / 1000 / 60;
            if (age > olderThanMinutes)
                this.jobs.delete(id);
        }
    }
}
exports.jobQueue = new JobQueue();
setInterval(() => exports.jobQueue.cleanup(), 60 * 60 * 1000);
//# sourceMappingURL=jobQueue.js.map