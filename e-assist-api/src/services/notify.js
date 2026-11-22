import { env } from '../config/env.js';
import { prisma } from '../config/db.js';
import { serializeNotification } from '../utils/serializers.js';
import { sendSms } from './sms.js';

let io = null;
export const setIo = (instance) => (io = instance);
export const getIo = () => io;

// Creates an in-app notification (+ live socket event, + optional SMS). Never throws.
export async function notify(userId, { title, body, taskId = null, sms = false }) {
  try {
    const n = await prisma.notification.create({ data: { userId, title, body, taskId } });
    io?.to(`user:${userId}`).emit('notification:new', serializeNotification(n));
    if (sms && env.SMS_NOTIFICATIONS) {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { phone: true } });
      if (u) await sendSms(u.phone, `E-Assist: ${title}. ${body}`).catch(() => {});
    }
  } catch (e) {
    console.error('notify failed', e.message);
  }
}
