'use client';

import { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import Composer from '../components/Composer';
import {
  listSessions,
  createSession,
  getMessages,
  deleteSession,
  streamMessage,
} from '../lib/api';

let tempId = 0;
const nextTempId = () => `temp-${++tempId}`;

export default function Page() {
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streamingId, setStreamingId] = useState(null);
  const [model, setModel] = useState('');

  const busy = streamingId !== null;

  // Load sessions on mount; make sure there is at least one.
  useEffect(() => {
    (async () => {
      try {
        let list = await listSessions();
        if (!list.length) {
          const s = await createSession();
          list = [s];
        }
        setSessions(list);
        setActiveId(list[0].id);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // Load messages when the active session changes.
  useEffect(() => {
    if (!activeId) return;
    (async () => {
      try {
        setMessages(await getMessages(activeId));
      } catch (e) {
        console.error(e);
      }
    })();
  }, [activeId]);

  const refreshSessions = useCallback(async () => {
    try {
      setSessions(await listSessions());
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleNew = async () => {
    if (busy) return;
    const s = await createSession();
    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
    setMessages([]);
  };

  const handleDelete = async (id) => {
    if (busy) return;
    await deleteSession(id);
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (id === activeId) {
      if (remaining.length) setActiveId(remaining[0].id);
      else handleNew();
    }
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || busy || !activeId) return;

    const userMsg = { id: nextTempId(), role: 'user', content };
    const assistantMsg = { id: nextTempId(), role: 'assistant', content: '' };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setStreamingId(assistantMsg.id);

    await streamMessage(activeId, content, {
      onMeta: (d) => setModel(d.model || ''),
      onToken: (t) =>
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: m.content + t } : m))
        ),
      onError: (err) =>
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: `⚠️ ${err.message}. Check the backend / LLM provider.` }
              : m
          )
        ),
      onDone: () => {
        setStreamingId(null);
        refreshSessions();
      },
    });

    setStreamingId(null);
  };

  return (
    <div className="app">
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        onSelect={(id) => !busy && setActiveId(id)}
        onNew={handleNew}
        onDelete={handleDelete}
      />
      <main className="main">
        <div className="topbar">
          <span className="dot" />
          <strong style={{ fontSize: 13 }}>Chat</strong>
          {model && <span className="model">model: {model}</span>}
        </div>
        <ChatWindow messages={messages} streamingId={streamingId} model={model} />
        <Composer value={input} onChange={setInput} onSend={handleSend} disabled={busy} />
      </main>
    </div>
  );
}
