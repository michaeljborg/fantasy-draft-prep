import { useRef } from "react";

export type View = "board" | "myTeams" | "notes" | "draftTree";

interface NavItemProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

function NavItem({ label, active, disabled, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={disabled ? "Coming soon" : undefined}
      className={`mb-1 flex w-full items-center rounded px-3 py-2 text-left text-sm font-semibold transition-colors ${
        active
          ? "bg-white/10 text-white"
          : disabled
            ? "cursor-not-allowed text-blue-900"
            : "text-blue-200 hover:bg-white/5 hover:text-white"
      }`}
    >
      {label}
      {disabled && (
        <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-blue-900">
          Soon
        </span>
      )}
    </button>
  );
}

interface SidebarProps {
  active: View;
  onNavigate: (view: View) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
}

export function Sidebar({ active, onNavigate, onExportData, onImportData }: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onImportData(file);
    e.target.value = ""; // allow re-selecting the same file again later
  }

  return (
    <div className="flex h-full w-44 shrink-0 flex-col bg-[#050b1c]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-500 text-sm font-bold text-white">
          FD
        </div>
        <span className="text-xs font-bold uppercase tracking-wide text-white">Draft Prep</span>
      </div>
      <nav className="flex-1 px-2.5 py-4">
        <NavItem label="Draft Board" active={active === "board"} onClick={() => onNavigate("board")} />
        <NavItem label="My Teams" active={active === "myTeams"} onClick={() => onNavigate("myTeams")} />
        <NavItem label="Notes" active={active === "notes"} onClick={() => onNavigate("notes")} />
        <NavItem label="Draft Tree" active={active === "draftTree"} onClick={() => onNavigate("draftTree")} />
      </nav>
      <div className="border-t border-white/10 px-2.5 py-3">
        <button
          type="button"
          onClick={onExportData}
          className="mb-1 flex w-full items-center rounded px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-blue-200 transition-colors hover:bg-white/5 hover:text-white"
        >
          Export Data
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center rounded px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-blue-200 transition-colors hover:bg-white/5 hover:text-white"
        >
          Import Data
        </button>
        <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileChange} />
      </div>
    </div>
  );
}
