# Fantasy Draft Prep

A client-only fantasy football draft prep tool: personalized rankings, a live
pick board, tiers, a watchlist, saved rosters, freeform notes, and a
branching "what-if" draft scenario planner. No backend, no accounts,
no network calls after the page loads — everything runs in the browser and
persists to `localStorage`.

## Contents

- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Data model](#data-model)
- [Data storage & persistence](#data-storage--persistence)

## Tech stack

- **React 19** + **TypeScript**, built with **Vite 6**
- **Tailwind CSS v4** (via `@tailwindcss/vite`, no separate PostCSS config)
- No backend, no router, no state-management library (no Redux/Zustand/Context)

## Getting started

```bash
npm install
npm run dev       # start the Vite dev server (http://localhost:5173)
npm run build     # type-check (tsc -b) + production build to dist/
npm run preview   # serve the production build locally
```

Requires Node 20+. `dist/` after `npm run build` is a fully static site —
copy it anywhere and serve it with any static file server, no Node required
on the target machine.

## Project structure

```
src/
├── main.tsx                  # ReactDOM root
├── App.tsx                   # Single source of truth: all app state, all
│                              # localStorage load/save, all handlers, routes
│                              # between the four tabs
├── types.ts                  # Every shared type/interface in the app
├── index.css                 # Tailwind import + a couple of small overrides
│                              # (e.g. hiding number-input spinners)
│
├── snakeDraft.ts              # Pure fn: (teams, slot, rounds) -> your pick numbers
├── rosterSlots.ts              # Pure fn: lays drafted picks into a positional
│                               # roster (QB/RB/RB/WR/WR/TE/FLEX/DST/K/BENCH)
├── draftTree.ts                # Pure fns: build/edit/layout a branching
│                               # DraftTree (scenario planner)
├── positionStyles.ts           # Shared position -> Tailwind color-class maps
│
├── data/
│   ├── players.json            # The actual player pool the app runs on
│   └── fantasy_rankings.json   # Original source export (kept for reference;
│                               # not imported by the app)
│
└── components/
    ├── Sidebar.tsx              # Left nav (Draft Board / My Teams / Notes /
    │                            # Draft Tree) + Export/Import Data buttons
    ├── TopBanner.tsx            # Page header bar + shared Badge component
    │
    ├── MyTeamPanel.tsx          # "My Team" bubble: config form, Draft Order
    │                            # / Positional roster views, Save/Clear, PickRow
    ├── RankingsPanel.tsx        # "Rankings" bubble: sortable/searchable/
    │                            # filterable player table
    ├── TiersPanel.tsx           # "Tiers" bubble: players grouped into tiers;
    │                            # also exports the shared PlayerRow component
    ├── WatchlistPanel.tsx       # "Watchlist" bubble: your starred players
    ├── PlayerSearchList.tsx     # Shared search-and-pick player list (used by
    │                            # Draft Tree's node/root pickers)
    │
    ├── MyTeamsPage.tsx          # "My Teams" tab: saved-roster card gallery
    ├── NotesPage.tsx            # "Notes" tab: freeform draggable/resizable
    │                            # sticky-note canvas
    ├── DraftTreePage.tsx        # "Draft Tree" tab: switches between list/editor
    ├── DraftTreeList.tsx        # Draft Tree: scenario gallery + the two
    │                            # "start a new scenario" flows
    └── DraftTreeEditor.tsx      # Draft Tree: the graphical branching canvas
```

## Architecture

**One state owner, everything else is presentational.** `App.tsx` holds every
piece of app state (`useState`), loads it from `localStorage` on first
render, and writes it back on every change (`useEffect`). All other
components receive data and callbacks as props — there's no Context, no
global store, no prop-drilling library. This was a deliberate simplicity
choice made early in the project and it's held up: the state surface is
small enough (nine `useState` calls in `App.tsx`) that prop-passing stays
manageable, and it keeps every component trivially testable/reasoned-about
in isolation.

**Four tabs, one router-free switch.** `activeView` (`"board" | "myTeams" |
"notes" | "draftTree"`) is a single piece of state; `App.tsx`'s JSX is a
ternary chain that renders one tab's `TopBanner` + page component at a time.
There's no URL routing — the whole app is one page.



## Data model

Everything lives in `types.ts`. The core type is `Player`:

```ts
interface Player {
  id: string;
  name: string;
  position: "QB" | "RB" | "WR" | "TE" | "K" | "DST";
  team: string;
  rank: number;        // consensus rank, overridden per-player via RankOverride
  bye?: number;
  adp?: number;         // average draft position
  tier?: number;         // overall (cross-position) tier
  positionTier?: number; // tier within this player's own position
}
```

Other important shapes:

- **`DraftConfig`** — `{ teams, slot, rounds }`. Drives `snakeDraft.ts`'s
  pick calculation everywhere it's used.
- **`Selections`** — `Record<pickNumber, playerId>`. The live Draft Board's
  picks-in-progress.
- **`SavedTeam`** — a named, dated snapshot: its own `config` plus
  `SavedTeamPick[]`, each pick storing a *snapshotted* player (`id`, `name`,
  `position`, `team` only — not the full `Player`) so it stays valid forever.
- **`DraftTree` / `DraftTreeNode`** — a tree is `{ id, name, createdAt,
  config, roots: DraftTreeNode[] }`. Each node is `{ id, pick, player,
  children: DraftTreeNode[] }`. More than one root means multiple Round-1
  options; more than one child on a node means it branches there. Player
  data is snapshotted the same way as `SavedTeam`.
- **`Note`** — `{ id, title, text, color, x, y, width, height }` for the
  Notes canvas.

Two type aliases make the shared components reusable across "live player"
and "snapshotted player" contexts without duplicating code:
`DraftTreePlayer = Pick<Player, "id"|"name"|"position"|"team">` and
`rosterSlots.ts`'s `PositionedPlayer = Pick<Player, "id"|"position">` — both
narrow enough that a full `Player` satisfies them for free.

## Data storage & persistence

**There is no backend and no database.** Every piece of user data lives in
the browser's `localStorage`, scoped to whatever origin the app is served
from (e.g. `http://localhost:5173`). This means:

- Data doesn't sync across browsers, devices, or even across `http://` vs
  `https://`/different ports on the same machine — it's tied to one browser
  profile on one origin.
- Copying the project files to another computer does **not** bring your
  data with it (see the five keys below) — only the code moves.
- Clearing site data/cookies for that origin wipes everything.

Five independent `localStorage` keys, each owned by one `useState` +
`useEffect` pair in `App.tsx`:

| Key | Shape stored | React state |
|---|---|---|
| `fantasy-draft-overrides` | `Record<playerId, RankOverride>` | `overrides` |
| `fantasy-draft-saved-teams` | `SavedTeam[]` | `savedTeams` |
| `fantasy-draft-notes` | `Note[]` | `notes` |
| `fantasy-draft-trees` | `DraftTree[]` | `trees` |
| `fantasy-draft-watchlist` | `string[]` (player ids) | `watchlistIds` (a `Set<string>` in memory) |

**Export / Import**, in the sidebar's bottom section, moves all five keys
between browsers/devices as one file:
- **Export** bundles all five pieces of state (`overrides`, `savedTeams`,
  `notes`, `trees`, `watchlist`) plus a `version` and `exportedAt` timestamp
  into one JSON object, and triggers a browser download
  (`fantasy-draft-prep-backup-YYYY-MM-DD.json`) via a `Blob` + temporary
  `<a download>` element — no server involved.
- **Import** reads the chosen file with `FileReader`, parses it defensively
  (a malformed file shows an alert and changes nothing), asks for
  confirmation since it **replaces** all five pieces of state outright (not
  a merge), then calls the same five `setX` functions `App.tsx` already
  owns — the existing `useEffect`s pick up the change and persist it to
  `localStorage` automatically, so no separate import-specific persistence
  code was needed.

**The player pool itself** (`src/data/players.json`) is a static file
bundled into the app at build time, not stored in `localStorage` — it's data,
not user state. It was generated once from `src/data/fantasy_rankings.json`
(a rankings export) via a one-off conversion script (not part of the
repo).
