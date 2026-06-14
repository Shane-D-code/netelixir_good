import { v4 as uuidv4 } from 'uuid';
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

class JobQueue extends EventEmitter {
  private jobs: Map<string, ForecastJob> = new Map();

  createJob(): string {
    const id = uuidv4();
    this.jobs.set(id, {
      id,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return id;
  }

  getJob(id: string): ForecastJob | null {
    return this.jobs.get(id) || null;
  }

  updateProgress(id: string, progress: number, status?: ForecastJob['status']) {
    const job = this.jobs.get(id);
    if (job) {
      job.progress = progress;
      if (status) job.status = status;
      job.updatedAt = new Date();
      this.emit('progress', { id, progress, status: job.status });
      this.jobs.set(id, job);
    }
  }

  completeJob(id: string, result: any) {
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

  failJob(id: string, error: string) {
    const job = this.jobs.get(id);
    if (job) {
      job.status = 'failed';
      job.error = error;
      job.updatedAt = new Date();
      this.jobs.set(id, job);
      this.emit('failed', { id, error });
    }
  }

  getActiveCount(): number {
    let count = 0;
    for (const job of this.jobs.values()) {
      if (job.status === 'processing') count++;
    }
    return count;
  }

  cleanup(olderThanMinutes: number = 60) {
    const now = new Date();
    for (const [id, job] of this.jobs) {
      const age = (now.getTime() - job.createdAt.getTime()) / 1000 / 60;
      if (age > olderThanMinutes) this.jobs.delete(id);
    }
  }
}

export const jobQueue = new JobQueue();

setInterval(() => jobQueue.cleanup(), 60 * 60 * 1000);
