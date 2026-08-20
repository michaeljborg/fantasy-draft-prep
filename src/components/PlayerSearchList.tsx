import { useMemo, useState } from "react";
import { POSITION_STYLES } from "../positionStyles";
import type { Player } from "../types";

interface PlayerSearchListProps {
  players: Player[];
  excludeIds?: Set<string>;
  onSelect: (player: Player) => void;
  autoFocus?: boolean;
  placeholder?: string;
}

/** A search box + filtered, click-to-select player list. Used for the Draft Tree's "search bar dropdown" pick flow. */
export function PlayerSearchList({ players, excludeIds, onSelect, autoFocus, placeholder }: PlayerSearchListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return players
      .filter((p) => !excludeIds?.has(p.id))
      .filter((p) => p.name.toLowerCase().includes(q))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 50);
  }, [players, excludeIds, query]);

  return (
    <div className="flex w-64 flex-col">
      <input
        type="text"
        autoFocus={autoFocus}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder ?? "Search players..."}
        className="rounded-t border-b border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:bg-blue-50"
      />
      <ul className="max-h-56 overflow-y-auto">
        {filtered.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onSelect(p)}
              className="flex w-full items-center justify-between px-2.5 py-1.5 text-left text-sm hover:bg-blue-50/60"
            >
              <span className="truncate font-semibold text-blue-900">{p.name}</span>
              <span className={`ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${POSITION_STYLES[p.position]}`}>
                {p.position}
              </span>
            </button>
          </li>
        ))}
        {filtered.length === 0 && <li className="px-2.5 py-2 text-xs text-slate-400">No players found</li>}
      </ul>
    </div>
  );
}
