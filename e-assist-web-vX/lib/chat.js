// [CHANGED] real-mode section now matches the backend in /e-assist-api (rooms per task, ack on join). Demo section unchanged.
import { io } from 'socket.io-client';
import { SOCKET_URL, USE_MOCK } from './config';
import { mockApi } from './mockApi';

const CANNED = [
  'Got it, thanks!',
  "On my way now. I'll update you shortly.",
  'Noted. Quick question: is there a landmark nearby?',
  'Almost there, should be done soon.',
  'Sure, no problem.',
];

export function createChatClient({ taskId, token, me, counterpart, onMessage, onStatus }) {
  if (USE_MOCK) {
    let n = 0;
    let closed = false;
    setTimeout(() => !closed && onStatus('connected'), 200);
    return {
      send(text) {
        const mine = mockApi.addMessage(taskId, me.id, text);
        onMessage(mine);
        setTimeout(() => {
          if (closed) return;
          onMessage(mockApi.addMessage(taskId, counterpart.id, CANNED[n++ % CANNED.length]));
        }, 1400);
      },
      close() {
        closed = true;
      },
    };
  }

  // [CHANGED] Matches e-assist-api/src/sockets/index.js:
  //   auth: JWT in the handshake · events: task:join (with ack) · message:send · message:new
  //   Isolation is one Socket.io ROOM per task (`task:<id>`) on the default namespace.
  const socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true, // automatic reconnect with backoff
    reconnectionDelayMax: 5000,
  });
  const join = () =>
    socket.emit('task:join', { taskId }, (res) => {
      if (res?.ok) onStatus('connected');
      else onStatus('offline');
    });
  socket.on('connect', join); // also re-joins the room after every reconnect
  socket.on('disconnect', () => onStatus('reconnecting'));
  socket.io.on('reconnect_attempt', () => onStatus('reconnecting'));
  socket.on('connect_error', () => onStatus('offline'));
  socket.on('message:new', (m) => m.taskId === taskId && onMessage(m));
  return {
    send: (text) => socket.emit('message:send', { taskId, text }),
    close: () => socket.disconnect(),
  };
}
