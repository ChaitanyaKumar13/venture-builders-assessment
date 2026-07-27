'use client';

export default function Sidebar({ sessions, activeId, onSelect, onNew, onDelete }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="eyebrow">Venture Builders</div>
        <h1>AI Query Assistant</h1>
      </div>

      <button className="new-chat" onClick={onNew}>+ New chat</button>

      <ul className="sessions">
        {sessions.map((s) => (
          <li
            key={s.id}
            className={`session ${s.id === activeId ? 'active' : ''}`}
            onClick={() => onSelect(s.id)}
          >
            <span className="title">{s.title}</span>
            <button
              className="del"
              title="Delete chat"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(s.id);
              }}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
