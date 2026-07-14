import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { jobQueue } from '../services/job-queue.service';
import logger from '../../../core/logging/logger';

let io: SocketServer;

export function initWebSocket(server: HttpServer) {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`WebSocket connected: ${socket.id}`);

    socket.on('subscribe:forecast', (jobId: string) => {
      socket.join(`forecast:${jobId}`);
      const job = jobQueue.getJob(jobId);
      if (job) {
        socket.emit(`forecast:${jobId}:status`, {
          status: job.status,
          progress: job.progress,
        });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`WebSocket disconnected: ${socket.id}`);
    });
  });

  jobQueue.on('progress', ({ id, progress, status }) => {
    io.to(`forecast:${id}`).emit(`forecast:${id}:status`, { status, progress });
  });

  jobQueue.on('complete', ({ id, result }) => {
    io.to(`forecast:${id}`).emit(`forecast:${id}:complete`, { result });
  });

  jobQueue.on('failed', ({ id, error }) => {
    io.to(`forecast:${id}`).emit(`forecast:${id}:failed`, { error });
  });

  return io;
}

export { io };
