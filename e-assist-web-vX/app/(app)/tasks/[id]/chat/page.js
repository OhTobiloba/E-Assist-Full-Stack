'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { createChatClient } from '@/lib/chat';
import { getToken } from '@/lib/session';
import { Avatar, ErrorNote, Spinner } from '@/components/ui';

export default function ChatPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('connecting');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const client = useRef(null);
  const bottom = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [t, history] = await Promise.all([api.getTask(id), api.chatHistory(id)]);
        if (!alive) return;
        setTask(t);
        setMessages(history);
        const counterpart = t.customer.id === user.id ? t.assistant : t.customer;
        if (!counterpart) return setError('Chat opens once an assistant accepts this task.');
        client.current = createChatClient({
          taskId: id,
          token: getToken(),
          me: user,
          counterpart,
          onStatus: (s) => alive && setStatus(s),
          // avoid duplicates if the server echoes a message we already have
          onMessage: (m) => alive && setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m])),
        });
      } catch (e) {
        if (alive) setError(e.message);
      }
    })();
    return () => {
      alive = false;
      client.current?.close();
    };
  }, [id, user]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function send(e) {
    e.preventDefault();
    const t = text.trim();
    if (!t || !client.current) return;
    client.current.send(t);
    setText('');
  }

  if (!task && !error) return <Spinner />;
  const other = task && (task.customer.id === user.id ? task.assistant : task.customer);

  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-line bg-white px-4 pb-3 pt-5">
        <button onClick={() => router.back()} className="flex h-7 w-7 items-center justify-center rounded-full bg-paper text-sm" aria-label="Back">‹</button>
        <Avatar name={other?.name} />
        <div>
          <div className="text-[13px] font-semibold">{other?.name || 'Chat'}</div>
          <div className="max-w-[220px] truncate text-[10px] text-muted">{task?.title}</div>
        </div>
      </div>

      {status !== 'connected' && !error && (
        <div className="bg-amber-bg px-4 py-1.5 text-center text-[11px] text-amber-dark">
          {status === 'offline' ? 'Offline. Retrying…' : status === 'reconnecting' ? 'Reconnecting…' : 'Connecting…'}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto bg-paper/60 px-4 py-4">
        <ErrorNote message={error} />
        {messages.length === 0 && !error && <p className="mt-6 text-center text-xs text-muted">No messages yet. Say hello 👋</p>}
        {messages.map((m) => {
          const mine = m.senderId === user.id;
          return (
            <div key={m.id} className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug ${mine ? 'self-end rounded-br-md bg-navy text-[#EDE9DD]' : 'self-start rounded-bl-md bg-white'}`}>
              {m.text}
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      <form onSubmit={send} className="sticky bottom-0 flex gap-2 border-t border-line bg-white px-3.5 pb-4 pt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          disabled={!!error}
          className="flex-1 rounded-full border border-line px-4 py-2.5 text-[13px] outline-none focus:border-navy"
        />
        <button type="submit" disabled={!text.trim() || !!error} className="rounded-full bg-amber px-4 text-sm font-semibold disabled:opacity-40" aria-label="Send">➤</button>
      </form>
    </div>
  );
}
