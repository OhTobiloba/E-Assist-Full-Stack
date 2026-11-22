// Real-time chat. One Socket.io "room" per task (`task:<id>`) keeps conversations isolated;
// every connection is authenticated with the same JWT used by the REST API.
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { clientOrigins, env } from '../config/env.js';
import { prisma } from '../config/db.js';
import * as chat from '../modules/chat/chat.service.js';
import { setIo } from '../services/notify.js';

export function initSockets(httpServer) {
  const io = new Server(httpServer, { cors: { origin: clientOrigins } });
  setIo(io);

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
      const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, status: true } });
      if (!user || user.status !== 'ACTIVE') return next(new Error('unauthorized'));
      socket.data.userId = user.id;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`); // personal room for live notifications

    socket.on('task:join', async ({ taskId } = {}, ack) => {
      if (!(await chat.canAccess(userId, taskId))) return ack?.({ ok: false, error: 'Not allowed' });
      socket.join(`task:${taskId}`);
      ack?.({ ok: true });
    });

    socket.on('message:send', async ({ taskId, text } = {}, ack) => {
      try {
        const msg = await chat.saveMessage({ taskId, senderId: userId, text });
        io.to(`task:${taskId}`).emit('message:new', msg); // includes the sender, so it is the single source of truth
        ack?.({ ok: true });
      } catch (e) {
        ack?.({ ok: false, error: e.message });
      }
    });
  });
  return io;
}
