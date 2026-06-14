"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_io_client_1 = require("socket.io-client");
const express_1 = __importDefault(require("express"));
const websocket_1 = require("./websocket");
const jobQueue_1 = require("./services/jobQueue");
let httpServer;
let io;
let clientSocket;
beforeAll((done) => {
    const app = (0, express_1.default)();
    httpServer = (0, http_1.createServer)(app);
    io = (0, websocket_1.initWebSocket)(httpServer);
    httpServer.listen(() => {
        const port = httpServer.address().port;
        clientSocket = (0, socket_io_client_1.io)(`http://localhost:${port}`, {
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
    jobQueue_1.jobQueue.cleanup(0);
});
describe('WebSocket Events', () => {
    describe('subscribe:forecast', () => {
        it('should emit current job status on subscribe', (done) => {
            const jobId = jobQueue_1.jobQueue.createJob();
            jobQueue_1.jobQueue.updateProgress(jobId, 50, 'processing');
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
            const jobId = jobQueue_1.jobQueue.createJob();
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
            const jobId = jobQueue_1.jobQueue.createJob();
            clientSocket.emit('subscribe:forecast', jobId);
            setTimeout(() => {
                jobQueue_1.jobQueue.updateProgress(jobId, 30, 'processing');
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
            const jobId = jobQueue_1.jobQueue.createJob();
            const result = { forecast: [1, 2, 3] };
            clientSocket.emit('subscribe:forecast', jobId);
            setTimeout(() => {
                jobQueue_1.jobQueue.completeJob(jobId, result);
            }, 100);
            clientSocket.on(`forecast:${jobId}:complete`, (data) => {
                expect(data.result).toEqual(result);
                done();
            });
        });
    });
    describe('job failure', () => {
        it('should notify clients when job fails', (done) => {
            const jobId = jobQueue_1.jobQueue.createJob();
            const errorMsg = 'Something went wrong';
            clientSocket.emit('subscribe:forecast', jobId);
            setTimeout(() => {
                jobQueue_1.jobQueue.failJob(jobId, errorMsg);
            }, 100);
            clientSocket.on(`forecast:${jobId}:failed`, (data) => {
                expect(data.error).toBe(errorMsg);
                done();
            });
        });
    });
});
//# sourceMappingURL=websocket.test.js.map