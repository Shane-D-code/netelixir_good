import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import express from 'express';
import { AddressInfo } from 'net';
import { initWebSocket } from './websocket';
import { jobQueue } from './services/jobQueue';

let httpServer: ReturnType<typeof createServer>;
let io: SocketServer;
let clientSocket: ClientSocket;

beforeAll((done) => {
  const app = express();
  httpServer = createServer(app);
  io = initWebSocket(httpServer);
  httpServer.listen(() => {
    const port = (httpServer.address() as AddressInfo).port;
    clientSocket = Client(`http://localhost:${port}`, {
      transports: ['websocket'],
      forceNew: true,
    });
    clientSocket.on('connect', done);
  });
});

afterAll(() => {
  clientSocket.close();
  io.close();
  httpServer.close();
});

afterEach(() => {
  jobQueue.cleanup(0);
});

describe('WebSocket Events', () => {
  describe('subscribe:forecast', () => {
    it('should emit current job status on subscribe', (done) => {
      const jobId = jobQueue.createJob();
      jobQueue.updateProgress(jobId, 50, 'processing');

      clientSocket.emit('subscribe:forecast', jobId);
      clientSocket.on(`forecast:${jobId}:status`, (data) => {
        expect(data).toMatchObject({
          status: 'processing',
          progress: 50,
        });
        done();
      });
    });

    it('should return pending status for newly created job', (done) => {
      const jobId = jobQueue.createJob();

      clientSocket.emit('subscribe:forecast', jobId);
      clientSocket.on(`forecast:${jobId}:status`, (data) => {
        expect(data).toMatchObject({
          status: 'pending',
          progress: 0,
        });
        done();
      });
    });
  });

  describe('job progress events', () => {
    it('should notify clients when job progress updates', (done) => {
      const jobId = jobQueue.createJob();
      clientSocket.emit('subscribe:forecast', jobId);

      setTimeout(() => {
        jobQueue.updateProgress(jobId, 30, 'processing');
      }, 100);

      clientSocket.on(`forecast:${jobId}:status`, (data) => {
        if (data.progress === 30) {
          expect(data).toMatchObject({
            status: 'processing',
            progress: 30,
          });
          done();
        }
      });
    });
  });

  describe('job completion', () => {
    it('should notify clients when job completes', (done) => {
      const jobId = jobQueue.createJob();
      const result = { forecast: [1, 2, 3] };
      clientSocket.emit('subscribe:forecast', jobId);

      setTimeout(() => {
        jobQueue.completeJob(jobId, result);
      }, 100);

      clientSocket.on(`forecast:${jobId}:complete`, (data) => {
        expect(data.result).toEqual(result);
        done();
      });
    });
  });

  describe('job failure', () => {
    it('should notify clients when job fails', (done) => {
      const jobId = jobQueue.createJob();
      const errorMsg = 'Something went wrong';
      clientSocket.emit('subscribe:forecast', jobId);

      setTimeout(() => {
        jobQueue.failJob(jobId, errorMsg);
      }, 100);

      clientSocket.on(`forecast:${jobId}:failed`, (data) => {
        expect(data.error).toBe(errorMsg);
        done();
      });
    });
  });
});
