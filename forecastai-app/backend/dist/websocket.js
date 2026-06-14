"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
exports.initWebSocket = initWebSocket;
const socket_io_1 = require("socket.io");
const jobQueue_1 = require("./services/jobQueue");
let io;
function initWebSocket(server) {
    exports.io = io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
            credentials: true,
        },
    });
    io.on('connection', (socket) => {
        console.log(`WebSocket connected: ${socket.id}`);
        socket.on('subscribe:forecast', (jobId) => {
            socket.join(`forecast:${jobId}`);
            const job = jobQueue_1.jobQueue.getJob(jobId);
            if (job) {
                socket.emit(`forecast:${jobId}:status`, {
                    status: job.status,
                    progress: job.progress,
                });
            }
        });
        socket.on('disconnect', () => {
            console.log(`WebSocket disconnected: ${socket.id}`);
        });
    });
    jobQueue_1.jobQueue.on('progress', ({ id, progress, status }) => {
        io.to(`forecast:${id}`).emit(`forecast:${id}:status`, { status, progress });
    });
    jobQueue_1.jobQueue.on('complete', ({ id, result }) => {
        io.to(`forecast:${id}`).emit(`forecast:${id}:complete`, { result });
    });
    jobQueue_1.jobQueue.on('failed', ({ id, error }) => {
        io.to(`forecast:${id}`).emit(`forecast:${id}:failed`, { error });
    });
    return io;
}
//# sourceMappingURL=websocket.js.map