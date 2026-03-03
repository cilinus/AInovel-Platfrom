import type { Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3101';

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
  if (!socket) {
    const { io } = await import('socket.io-client');
    socket = io(`${SOCKET_URL}/ws`, {
      autoConnect: false,
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export async function connectSocket(): Promise<void> {
  const s = await getSocket();
  if (!s.connected) {
    s.connect();
  }
}

export async function disconnectSocket(): Promise<void> {
  if (socket?.connected) {
    socket.disconnect();
  }
}

export async function subscribeToJob(
  jobId: string,
  callbacks: {
    onProgress?: (data: { jobId: string; progress: number; state: string }) => void;
    onComplete?: (data: { jobId: string; result: any }) => void;
    onFailed?: (data: { jobId: string; reason: string }) => void;
  },
): Promise<() => void> {
  const s = await getSocket();
  s.emit('subscribe:job', { jobId });

  if (callbacks.onProgress) s.on('job:progress', callbacks.onProgress);
  if (callbacks.onComplete) s.on('job:complete', callbacks.onComplete);
  if (callbacks.onFailed) s.on('job:failed', callbacks.onFailed);

  return () => {
    if (callbacks.onProgress) s.off('job:progress', callbacks.onProgress);
    if (callbacks.onComplete) s.off('job:complete', callbacks.onComplete);
    if (callbacks.onFailed) s.off('job:failed', callbacks.onFailed);
  };
}
