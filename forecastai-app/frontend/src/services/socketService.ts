import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('WebSocket connection error:', err.message);
    });
  }
  return socket;
}

export function subscribeForecast(
  jobId: string,
  callbacks: {
    onStatus?: (status: string, progress: number) => void;
    onComplete?: (result: any) => void;
    onFailed?: (error: string) => void;
  }
): () => void {
  const s = getSocket();

  const statusHandler = (data: { status: string; progress: number }) => {
    callbacks.onStatus?.(data.status, data.progress);
  };

  const completeHandler = (data: { result: any }) => {
    callbacks.onComplete?.(data.result);
  };

  const failedHandler = (data: { error: string }) => {
    callbacks.onFailed?.(data.error);
  };

  s.on(`forecast:${jobId}:status`, statusHandler);
  s.on(`forecast:${jobId}:complete`, completeHandler);
  s.on(`forecast:${jobId}:failed`, failedHandler);

  s.emit('subscribe:forecast', jobId);

  return () => {
    s.off(`forecast:${jobId}:status`, statusHandler);
    s.off(`forecast:${jobId}:complete`, completeHandler);
    s.off(`forecast:${jobId}:failed`, failedHandler);
  };
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
