'use client';

// Reusable Tiptap rich-text editor. Used for the professional summary and for
// each experience's bullet list. Emits HTML on every change via onChange.
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

export default function RichText({ value, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    immediatelyRender: false, // avoids SSR hydration mismatch in Next.js
    editorProps: {
      attributes: { class: 'tiptap-content' },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  // Keep external value changes (e.g. loading a resume) in sync.
  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, value]);

  if (!editor) return <div className="tiptap-box" />;

  const btn = (label, action, active) => (
    <button
      type="button"
      className={`tt-btn ${active ? 'active' : ''}`}
      onMouseDown={(e) => {
        e.preventDefault();
        action();
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="tiptap-box">
      <div className="tiptap-toolbar">
        {btn('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
        {btn('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
        {btn('• List', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
        {btn('1. List', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
