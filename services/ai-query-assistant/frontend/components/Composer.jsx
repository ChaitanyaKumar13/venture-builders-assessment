'use client';

import { useRef } from 'react';

export default function Composer({ value, onChange, onSend, disabled }) {
  const taRef = useRef(null);

  const autoGrow = (el) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  };

  return (
    <div className="composer">
      <div className="composer-inner">
        <textarea
          ref={taRef}
          rows={1}
          value={value}
          placeholder="Send a message…  (Enter to send, Shift+Enter for newline)"
          onChange={(e) => {
            onChange(e.target.value);
            autoGrow(e.target);
          }}
          onKeyDown={handleKeyDown}
        />
        <button className="send" onClick={onSend} disabled={disabled || !value.trim()} title="Send">
          ↑
        </button>
      </div>
      <div className="hint">Streaming enabled · powered by a local or hosted LLM</div>
    </div>
  );
}
