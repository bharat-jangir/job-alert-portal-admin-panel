'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

// Jodit heavily relies on the DOM, so it must be dynamically imported for Next.js SSR
const JoditEditor = dynamic(() => import('jodit-react'), { 
  ssr: false,
  loading: () => <div className="min-h-[300px] bg-gray-50 animate-pulse rounded-md border border-gray-200 flex items-center justify-center text-gray-400">Loading Advanced Editor...</div>
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  // Memoize config so Jodit doesn't re-render unnecessarily
  const config = useMemo(() => ({
    readonly: false,
    placeholder: placeholder || 'Start typing...',
    minHeight: 400,
    maxHeight: 800,
    enableDragAndDropFileToEditor: true,
    buttons: [
      'source', '|',
      'bold',
      'strikethrough',
      'underline',
      'italic', '|',
      'ul',
      'ol', '|',
      'outdent', 'indent',  '|',
      'font',
      'fontsize',
      'brush',
      'paragraph', '|',
      'image',
      'video',
      'table',
      'link', '|',
      'align', 'undo', 'redo', '|',
      'hr',
      'eraser',
      'copyformat', '|',
      'symbol',
      'fullsize',
      'print',
      'about'
    ],
    // Ensure all HTML tags and classes are kept
    cleanHTML: {
      fillEmptyParagraph: false,
      removeEmptyElements: false,
      denyTags: '',
    },
    askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_as_html'
  } as any), [placeholder]);

  return (
    <div className={`bg-white ${className || ''}`}>
      <JoditEditor
        value={value}
        config={config}
        onBlur={(newContent) => onChange(newContent)} // Use onBlur for better performance with large HTML content
        onChange={(newContent) => {}} // We leave this empty and rely on onBlur to prevent lag
      />
    </div>
  );
}
