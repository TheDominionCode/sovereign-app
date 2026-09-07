"use client";

import { useRef } from "react";
import { Bold, Italic, List, ListOrdered, Undo, Redo } from "lucide-react";

// A minimal rich-text field: a contentEditable div with a small formatting
// toolbar (Bold/Italic/lists/undo/redo via document.execCommand), synced
// into a hidden <input> so it posts through this repo's usual native
// <form action={serverAction}> pattern — no client-side fetch needed.
export default function RichTextField({
  name,
  defaultValue,
  placeholder,
}: {
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
}) {
  const editableRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  const sync = () => {
    if (hiddenRef.current && editableRef.current) {
      hiddenRef.current.value = editableRef.current.innerHTML;
    }
  };

  const exec = (command: string) => {
    editableRef.current?.focus();
    document.execCommand(command, false);
    sync();
  };

  const buttons: { icon: React.ElementType; command: string; label: string }[] = [
    { icon: Bold, command: "bold", label: "Bold" },
    { icon: Italic, command: "italic", label: "Italic" },
    { icon: List, command: "insertUnorderedList", label: "Bullet list" },
    { icon: ListOrdered, command: "insertOrderedList", label: "Numbered list" },
    { icon: Undo, command: "undo", label: "Undo" },
    { icon: Redo, command: "redo", label: "Redo" },
  ];

  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden bg-white">
      <div className="flex items-center gap-1 border-b border-stone-100 bg-stone-50 px-2 py-1">
        {buttons.map(({ icon: Icon, command, label }) => (
          <button
            key={command}
            type="button"
            title={label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(command)}
            className="p-1.5 rounded hover:bg-stone-200 text-stone-500"
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>
      <div
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        data-placeholder={placeholder}
        className="min-h-[90px] px-3 py-2 text-sm text-stone-800 outline-none [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-stone-400"
        dangerouslySetInnerHTML={{ __html: defaultValue ?? "" }}
      />
      <input ref={hiddenRef} type="hidden" name={name} defaultValue={defaultValue ?? ""} />
    </div>
  );
}
