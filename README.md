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
- [Features](#features)
- [Data model](#data-model)
- [Data storage & persistence](#data-storage--persistence)
- [Key algorithms & shared utilities](#key-algorithms--shared-utilities)
- [Styling conventions](#styling-conventions)
- [Known limitations](#known-limitations)

## Tech stack

- **React 19** + **TypeScript**, built with **Vite 6**
- **Tailwind CSS v4** (via `@tailwindcss/vite`, no separate PostCSS config)
- No backend, no router, no state-management library (no Redux/Zustand/Context)
  — see [Architecture](#architecture) for why
- `oxlint` for linting (`npm run lint`)

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
    ├── Sidebar.tsx              # Left nav (Draft Board / My Teams / Notes / Draft Tree)
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

**Reuse over duplication.** Several components export a piece meant to be
reused elsewhere rather than having every screen reimplement the same row:
- `TiersPanel.tsx` exports `PlayerRow` — the clickable player-list-item with
  drafted/implied-taken/selected styling and the arm-or-select-then-draft
  interaction. `WatchlistPanel.tsx` imports and reuses it directly.
- `MyTeamPanel.tsx` exports `PickRow` and `displayName` — `MyTeamsPage.tsx`
  reuses both so a saved team's card renders with pixel-identical styling to
  the live roster view, built from the exact same `buildPositionalSlots`
  function.
- `RankingsPanel.tsx` exports the `POSITIONS` filter list, reused by
  `TiersPanel` and `WatchlistPanel` for their own position dropdowns.

## Features

### Draft Board (`activeView === "board"`)
Four side-by-side panels, all reading from the same `effectivePlayers` /
`selections` / `armedPick` state in `App.tsx`:

- **My Team** — set Teams/Pick/Rounds, see your picks in **Draft Order**
  (round-by-round) or **Positional** (roster-shaped: QB, WR, WR, RB, RB, TE,
  W/R/T, DST, K, then BENCH) view. Save the current board as a named team,
  or Clear it.
- **Rankings** — every player, sortable by any column, filterable by
  position, searchable by name. Rank is editable inline (your personal
  override). Click a player to arm/select them, then either click a
  specific pick slot in My Team to assign them there, or use the inline
  **Draft** button to send them to your next open pick.
- **Tiers** — the same players grouped into tiers instead of a flat list.
  "All Positions" uses the overall cross-position tier; filtering to one
  position switches to that position's own tier scale (a separate, more
  granular set of tier numbers — see [Data model](#data-model)).
- **Watchlist** — players you've starred (★) from Rankings or Tiers, in
  their own list. Starring is independent of drafting — a player can be
  both starred and drafted (it just shows as drafted there too).

**"Implied taken" players:** once you draft anyone, every undrafted player
ranked at or better than your *worst* actual pick gets treated as probably
gone (dimmed, struck through, but still clickable if you want to draft them
anyway — it's a visual hint, not a lock). Recalculated live as you draft.

### My Teams (`activeView === "myTeams"`)
A card gallery of every team you've saved from the Draft Board. Each card
renders the same positional-roster layout as the live My Team panel (via the
shared `PickRow`/`buildPositionalSlots` combo), independent of the current
player pool — a saved team keeps showing correctly even if `players.json` is
later replaced, because each pick snapshots the player's `id`/`name`/
`position`/`team` at save time rather than re-looking them up.

### Notes (`activeView === "notes"`)
A freeform canvas of sticky notes: add, drag (via a dedicated grip handle,
separate from the title field so dragging and typing don't fight each
other), resize, recolor (6 colors), rename, edit, delete. Positions/sizes
are pixel coordinates on a large scrollable canvas.

### Draft Tree (`activeView === "draftTree"`)
The "what-if" scenario planner. You can have multiple named trees.
`DraftTreeList` is the gallery + the two ways to start one:
1. **Import a saved team** — chains that team's picks into one straight-line
   path you can branch off from.
2. **Start from scratch** — pick a Round 1 player via a search dropdown.

Opening a tree drops into `DraftTreeEditor`: a real graphical node-link
diagram (SVG connector lines + absolutely-positioned node boxes), laid out
top-to-bottom by round with sibling branches spread left-to-right so they
never overlap (`draftTree.ts`'s `layoutTree`, a from-scratch tree-layout
algorithm — see below). Click **+ Add pick** on any node to branch: click it
twice on the same node with two different players and you've created two
alternate Round-N paths from the same Round-(N-1) pick. The player search
excludes anyone already used earlier in that specific path, but the same
player can appear in sibling branches (different hypothetical universes).
Each tree snapshots its own `DraftConfig` at creation time, independent of
the live Draft Board's config.

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

Pattern used for all five (see `App.tsx`'s `loadX` functions): read the key,
`JSON.parse` it inside a `try/catch` (so corrupted or missing data never
crashes the app — it just falls back to an empty default), and write it back
with `JSON.stringify` inside a `useEffect` keyed on that piece of state. The
watchlist is the one exception that needs conversion at both ends, since
`Set` isn't directly JSON-serializable: `Array.from(set)` going out,
`new Set(parsedArray)` coming back in.

`loadNotes` additionally **backfills** fields (`title`, `width`, `height`)
that were added to the `Note` shape after the feature first shipped, so
notes saved by an older version of the app don't break on load — the
general pattern to follow if a persisted shape ever gains new required-
looking fields later.

**What is *not* persisted:** the live Draft Board's `config`
(teams/slot/rounds), `selections` (picks in progress), and `armedPick` all
reset on page reload — only *saved* teams, trees, notes, overrides, and the
watchlist survive a refresh.

**The player pool itself** (`src/data/players.json`) is a static file
bundled into the app at build time, not stored in `localStorage` — it's data,
not user state. It was generated once from `src/data/fantasy_rankings.json`
(a rankings export) via a one-off conversion script (not part of the
repo), then had tier numbers applied from separately pasted-in tier lists.
`fantasy_rankings.json` itself is kept only for reference and isn't imported
by any code. To refresh the player pool, `players.json` would need to be
regenerated/edited directly — there's no in-app data-refresh mechanism.

## Key algorithms & shared utilities

- **`snakeDraft.ts` — `getMyPicks({ teams, slot, rounds })`.** Standard
  snake-draft math: odd rounds go `1..teams`, even rounds reverse. Returns
  your overall pick numbers, e.g. 12 teams / slot 6 → `[6, 19, 30, 43, ...]`.
  Used by the Draft Board, `MyTeamsPage`, and every `DraftTree` (via each
  tree's own snapshotted config).

- **`rosterSlots.ts` — `buildPositionalSlots(myPicks, selections,
  playersById)`.** Lays your actual picks into the fixed starter template
  (QB, WR, WR, RB, RB, TE, W/R/T, DST, K) plus one BENCH slot per remaining
  round, filling exact-position slots before the flex slot, walked in the
  order picks were actually made. Generic over `PositionedPlayer` so it
  works identically for the live board and for a `SavedTeam`'s snapshotted
  picks.

- **`draftTree.ts` — tree building, editing, and layout.**
  `createTreeFromScratch` / `createTreeFromSavedTeam` build a new
  `DraftTree`; `addTreeNode` / `deleteTreeNode` are immutable recursive
  tree-edit functions (return a new tree, never mutate); `collectPathPlayerIds`
  walks root-to-node to find which players are already used along one path
  (for the "exclude already-picked" search filter); `layoutTree` is a
  from-scratch recursive tree-layout algorithm — post-order traversal
  assigns each leaf the next horizontal slot, each internal node the
  midpoint of its children's slots, producing non-overlapping positions for
  an arbitrarily-branching tree without any external graph-layout library.

- **`positionStyles.ts` — `POSITION_STYLES` / `SLOT_STYLES`.** The single
  source of truth for position badge colors (QB purple, RB blue, WR
  emerald, TE orange, K amber, DST red) so Rankings, Tiers, Watchlist, My
  Team, and My Teams all render the same position the same color.
  `SLOT_STYLES` extends it with two roster-slot-only colors (`W/R/T`,
  `BENCH`) for the Positional roster view.

- **"Implied taken" logic** lives inline in `App.tsx` (`impliedTakenIds`,
  a `useMemo`) rather than in a separate file — it's small, only used by
  the Draft Board's three player-list panels, and tightly coupled to
  `draftedPlayerIds`/`effectivePlayers`, so it didn't earn its own module.

## Styling conventions

- **Tailwind CSS v4**, utility classes inline, no CSS modules or
  styled-components anywhere.
- **Card language:** every panel/page is a white `rounded-xl border
  border-slate-200 shadow-sm` card floating on a `bg-slate-100` page
  background — established on the Draft Board and reused everywhere.
- **Sidebar:** fixed dark navy (`#050b1c`), separate visual language from
  the light content area on purpose.
- **Position colors:** always pulled from `positionStyles.ts`, never
  redefined locally in a component.
- **Truncation:** any text that can overflow a fixed-width container uses
  `min-w-0` on its flex ancestor + `truncate` on the text span itself —
  `whitespace-nowrap` alone (without `overflow-hidden`) will visually
  overflow into neighboring cells instead of clipping, which bit the
  Rankings table once (see git history / the Watchlist feature's fix) and
  is worth keeping in mind before adding new dense-table columns.
- **Responsiveness:** the Draft Board row has a `min-w` on the Rankings
  panel and the row's container scrolls horizontally
  (`overflow-x-auto`) rather than letting panels crush down to
  unreadable widths on narrower screens (verified down to 1440px).

## Known limitations

- **Single global draft config** — there's one "live" Teams/Slot/Rounds
  setting shared by the Draft Board and any new "from scratch" tree; no
  multi-league profiles.
- **No live-draft syncing** — the Draft Tree is an offline planning tool by
  design (per earlier project discussion), not connected to the live board;
  it doesn't know what you've actually drafted.
- **No data export/import** — moving your saved data to another browser or
  computer currently means manually copying the five `localStorage` keys via
  DevTools; there's no in-app export/import yet.
- **No automated tests** — correctness has been verified throughout
  development via `tsc`, `vite build`, and manual/Playwright-driven checks
  in the browser, not a test suite.
