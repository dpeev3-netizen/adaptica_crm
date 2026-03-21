"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CustomMention from '@tiptap/extension-mention';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import NeoButton from '@/components/ui/NeoButton';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, onSubmit, placeholder = "Write a note..." }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      // CustomMention could be configured here for @ mentions
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm w-full max-w-none focus:outline-none min-h-[60px] p-3 font-medium',
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey && onSubmit) {
          event.preventDefault();
          onSubmit();
          return true;
        }
        return false;
      }
    },
  });

  // Keep content synced if wiped externally
  if (editor && content === '' && editor.getHTML() !== '<p></p>') {
    setTimeout(() => editor.commands.setContent(''));
  }

  if (!editor) {
    return null;
  }

  return (
    <div className="bg-surface shadow-neumorph-concave rounded-xl border-2 border-transparent transition-colors focus-within:border-primary/20 overflow-hidden">
      <div className="flex border-b border-background/50 px-2 py-1 gap-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-primary/20 text-primary' : 'text-muted hover:text-foreground hover:bg-background/50'}`}
          title="Bold"
        >
          <Bold size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-primary/20 text-primary' : 'text-muted hover:text-foreground hover:bg-background/50'}`}
          title="Italic"
        >
          <Italic size={14} />
        </button>
        <div className="w-px h-5 bg-background/80 my-auto mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-primary/20 text-primary' : 'text-muted hover:text-foreground hover:bg-background/50'}`}
          title="Bullet List"
        >
          <List size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-primary/20 text-primary' : 'text-muted hover:text-foreground hover:bg-background/50'}`}
          title="Numbered List"
        >
          <ListOrdered size={14} />
        </button>
      </div>
      <EditorContent editor={editor} className="bg-transparent" />
    </div>
  );
}
