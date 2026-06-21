import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AuthUser } from '../middleware/auth.js';

let io: Server;

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
      socket.data.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as AuthUser;
    socket.join(`user:${user.id}`);

    socket.on('join:project', (projectId: string) => {
      socket.join(`project:${projectId}`);
    });

    socket.on('leave:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export function emitToProject(projectId: string, event: string, data: unknown) {
  getIO().to(`project:${projectId}`).emit(event, data);
}

export function emitToUser(userId: string, event: string, data: unknown) {
  getIO().to(`user:${userId}`).emit(event, data);
}

export async function createNotification(
  userId: string,
  type: string,
  message: string,
  link?: string
) {
  const { prisma } = await import('../lib/prisma.js');
  const notification = await prisma.notification.create({
    data: { userId, type, message, link },
  });
  emitToUser(userId, 'notification:new', notification);
  return notification;
}
