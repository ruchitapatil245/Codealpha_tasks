import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../api';

let socket: Socket | null = null;

export function useSocket(token: string | null, onConnect?: (s: Socket) => void) {
  const callbackRef = useRef(onConnect);
  callbackRef.current = onConnect;

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      return;
    }

    if (!socket) {
      socket = io(getSocketUrl(), {
        auth: { token },
        transports: ['websocket', 'polling'],
      });
    }

    const s = socket;
    const handleConnect = () => callbackRef.current?.(s);
    s.on('connect', handleConnect);
    if (s.connected) handleConnect();

    return () => {
      s.off('connect', handleConnect);
    };
  }, [token]);

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function joinProject(projectId: string) {
  socket?.emit('join:project', projectId);
}

export function leaveProject(projectId: string) {
  socket?.emit('leave:project', projectId);
}
