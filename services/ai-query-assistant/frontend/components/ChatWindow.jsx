'use client';

import { useEffect, useRef } from 'react';

function Message({ role, content, streaming }) {
  const isUser = role === 'user';
  return (
    <div className={`msg ${isUser ? 'user' : 'assistant'}`}>
      <div className="avatar">{isUser ? 'You' : 'AI'}</div>
      <div className="bubble">
        <div className="role">{isUser ? 'You' : 'Assistant'}</div>
        <div className="content">
          {content}
          {streaming && <span className="cursor" />}
        </div>
      </div>
    </div>
  );
}

export default function ChatWindow({ messages, streamingId, model }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  if (!messages.length) {
    return (
      <div className="thread">
        <div className="empty">
          <div>
            <h2>Ask anything</h2>
            <p>Responses stream token by token. Your chats are saved on the left.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="thread">
      <div className="thread-inner">
        {messages.map((m) => (
          <Message
            key={m.id}
            role={m.role}
            content={m.content}
            streaming={m.id === streamingId}
          />
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
