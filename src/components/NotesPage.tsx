import { useRef, useState } from "react";
import type { Note, NoteColor } from "../types";

export const NOTE_COLORS: NoteColor[] = ["yellow", "blue", "green", "pink", "purple", "white"];

const COLOR_STYLES: Record<NoteColor, { bg: string; border: string; swatch: string }> = {
  yellow: { bg: "bg-yellow-100", border: "border-yellow-300", swatch: "bg-yellow-300" },
  blue: { bg: "bg-sky-100", border: "border-sky-300", swatch: "bg-sky-300" },
  green: { bg: "bg-emerald-100", border: "border-emerald-300", swatch: "bg-emerald-300" },
  pink: { bg: "bg-pink-100", border: "border-pink-300", swatch: "bg-pink-300" },
  purple: { bg: "bg-purple-100", border: "border-purple-300", swatch: "bg-purple-300" },
  white: { bg: "bg-white", border: "border-slate-300", swatch: "bg-white" },
};

const MIN_WIDTH = 180;
const MIN_HEIGHT = 130;

interface NotesPageProps {
  notes: Note[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<Pick<Note, "title" | "text" | "color">>) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onDelete: (id: string) => void;
}

export function NotesPage({ notes, onAdd, onUpdate, onMove, onResize, onDelete }: NotesPageProps) {
  return (
    <div className="relative flex-1 overflow-auto bg-slate-100">
      <div className="sticky top-0 z-20 flex justify-end border-b border-slate-200 bg-slate-100/90 px-6 py-3 backdrop-blur-sm">
        <button
          type="button"
          onClick={onAdd}
          className="rounded bg-blue-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-blue-700"
        >
          + Add Note
        </button>
      </div>

      <div className="relative h-[1400px] w-full">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} onUpdate={onUpdate} onMove={onMove} onResize={onResize} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

interface NoteCardProps {
  note: Note;
  onUpdate: NotesPageProps["onUpdate"];
  onMove: NotesPageProps["onMove"];
  onResize: NotesPageProps["onResize"];
  onDelete: NotesPageProps["onDelete"];
}

function DragHandleIcon() {
  return (
    <svg viewBox="0 0 8 14" className="h-3.5 w-2" fill="currentColor">
      <circle cx="1.5" cy="1.5" r="1.3" />
      <circle cx="6.5" cy="1.5" r="1.3" />
      <circle cx="1.5" cy="7" r="1.3" />
      <circle cx="6.5" cy="7" r="1.3" />
      <circle cx="1.5" cy="12.5" r="1.3" />
      <circle cx="6.5" cy="12.5" r="1.3" />
    </svg>
  );
}

function ResizeHandleIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-full w-full p-1 text-black/30">
      <path d="M12 4L4 12M12 8.5L8.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function NoteCard({ note, onUpdate, onMove, onResize, onDelete }: NoteCardProps) {
  const [showColors, setShowColors] = useState(false);
  const dragOrigin = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const resizeOrigin = useRef<{ startX: number; startY: number; originW: number; originH: number } | null>(null);
  const colors = COLOR_STYLES[note.color];

  function handleDragPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragOrigin.current = { startX: e.clientX, startY: e.clientY, originX: note.x, originY: note.y };
  }

  function handleDragPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragOrigin.current) return;
    const { startX, startY, originX, originY } = dragOrigin.current;
    onMove(note.id, Math.max(0, originX + (e.clientX - startX)), Math.max(0, originY + (e.clientY - startY)));
  }

  function handleDragPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    dragOrigin.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  function handleResizePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeOrigin.current = { startX: e.clientX, startY: e.clientY, originW: note.width, originH: note.height };
  }

  function handleResizePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!resizeOrigin.current) return;
    const { startX, startY, originW, originH } = resizeOrigin.current;
    onResize(
      note.id,
      Math.max(MIN_WIDTH, originW + (e.clientX - startX)),
      Math.max(MIN_HEIGHT, originH + (e.clientY - startY))
    );
  }

  function handleResizePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    resizeOrigin.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  function handleDeleteClick() {
    if (window.confirm("Delete this note? This can't be undone.")) {
      onDelete(note.id);
    }
  }

  return (
    <div
      style={{ left: note.x, top: note.y, width: note.width, height: note.height }}
      className={`absolute flex flex-col rounded-lg border shadow-md ${colors.bg} ${colors.border}`}
    >
      <div className="flex items-center gap-1.5 rounded-t-lg border-b border-black/5 px-1.5 py-1.5">
        <div
          onPointerDown={handleDragPointerDown}
          onPointerMove={handleDragPointerMove}
          onPointerUp={handleDragPointerUp}
          title="Drag to move"
          className="flex h-5 w-4 shrink-0 cursor-grab touch-none items-center justify-center rounded text-slate-400 hover:bg-black/5 active:cursor-grabbing"
        >
          <DragHandleIcon />
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowColors((s) => !s)}
            title="Change color"
            className={`h-3.5 w-3.5 rounded-full ${colors.swatch} ring-1 ring-black/10`}
          />
          {showColors && (
            <div className="absolute left-0 top-5 z-30 flex gap-1 rounded-md border border-slate-200 bg-white p-1.5 shadow-lg">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    onUpdate(note.id, { color: c });
                    setShowColors(false);
                  }}
                  title={c}
                  className={`h-4 w-4 rounded-full ${COLOR_STYLES[c].swatch} ring-1 ring-black/10 hover:scale-110`}
                />
              ))}
            </div>
          )}
        </div>

        <input
          value={note.title}
          onChange={(e) => onUpdate(note.id, { title: e.target.value })}
          placeholder="Untitled"
          className="min-w-0 flex-1 truncate bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-400"
        />

        <button
          type="button"
          onClick={handleDeleteClick}
          title="Delete note"
          className="shrink-0 text-slate-400 transition-colors hover:text-red-500"
        >
          ✕
        </button>
      </div>

      <textarea
        value={note.text}
        onChange={(e) => onUpdate(note.id, { text: e.target.value })}
        placeholder="Type a note..."
        className="flex-1 resize-none rounded-b-lg bg-transparent p-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
      />

      <div
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
        title="Drag to resize"
        className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize touch-none rounded-tl hover:bg-black/5"
      >
        <ResizeHandleIcon />
      </div>
    </div>
  );
}
