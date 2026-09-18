import { useEffect, useMemo, useState } from "react";
import rawHockeyPlayers from "./data/hockey_players.json";
import rawPlayers from "./data/players.json";
import { addTreeNode, deleteTreeNode } from "./draftTree";
import { DraftTreePage } from "./components/DraftTreePage";
import { HockeyDraftBoard } from "./components/HockeyDraftBoard";
import { HockeyTeamPanel } from "./components/HockeyTeamPanel";
import { buildHockeyRosterSlots, HOCKEY_ROSTER_TEMPLATE, type HockeyRosterSlotLabel } from "./hockeyRosterSlots";
import { MyTeamPanel } from "./components/MyTeamPanel";
import { MyTeamsPage } from "./components/MyTeamsPage";
import { NOTE_COLORS, NotesPage } from "./components/NotesPage";
import { RankingsPanel } from "./components/RankingsPanel";
import { Sidebar, type Sport, type View } from "./components/Sidebar";
import { TiersPanel } from "./components/TiersPanel";
import { Badge, TopBanner } from "./components/TopBanner";
import { WatchlistPanel } from "./components/WatchlistPanel";
import { getMyPicks } from "./snakeDraft";
import type { DraftConfig, DraftTree, HockeyPlayer, Note, Player, RankOverride, SavedTeam, Selections } from "./types";

const MY_HOCKEY_TEAM = "The Bedardians";
const SPORT_KEY = "fantasy-draft-sport";
const HOCKEY_PICKS_KEY = "fantasy-draft-hockey-picks";
const HOCKEY_TAKEN_KEY = "fantasy-draft-hockey-taken";
const HOCKEY_KEEPERS_LOADED_KEY = "fantasy-draft-hockey-keepers-loaded";
const HOCKEY_SLOT_OVERRIDES_KEY = "fantasy-draft-hockey-slot-overrides";
const OVERRIDES_KEY = "fantasy-draft-overrides";
const SAVED_TEAMS_KEY = "fantasy-draft-saved-teams";
const NOTES_KEY = "fantasy-draft-notes";
const TREES_KEY = "fantasy-draft-trees";
const WATCHLIST_KEY = "fantasy-draft-watchlist";
const players = rawPlayers as Player[];
const hockeyPlayers = rawHockeyPlayers as HockeyPlayer[];

function loadSport(): Sport {
  const raw = localStorage.getItem(SPORT_KEY);
  return raw === "hockey" ? "hockey" : "football";
}

function loadOverrides(): Record<string, RankOverride> {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadSavedTeams(): SavedTeam[] {
  try {
    const raw = localStorage.getItem(SAVED_TEAMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadHockeyPicks(): string[] {
  try {
    const raw = localStorage.getItem(HOCKEY_PICKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadHockeyKeepersLoaded(): boolean {
  return localStorage.getItem(HOCKEY_KEEPERS_LOADED_KEY) !== "false";
}

function loadHockeyTaken(): string[] {
  try {
    const raw = localStorage.getItem(HOCKEY_TAKEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadHockeySlotOverrides(): Partial<Record<string, HockeyRosterSlotLabel>> {
  try {
    const raw = localStorage.getItem(HOCKEY_SLOT_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadWatchlist(): Set<string> {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function loadTrees(): DraftTree[] {
  try {
    const raw = localStorage.getItem(TREES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Note>[]) : [];
    // Backfill fields for notes saved before title/width/height existed.
    return parsed.map((n) => ({
      id: n.id ?? crypto.randomUUID(),
      title: n.title ?? "",
      text: n.text ?? "",
      color: n.color ?? "yellow",
      x: n.x ?? 40,
      y: n.y ?? 40,
      width: n.width ?? 224,
      height: n.height ?? 200,
    }));
  } catch {
    return [];
  }
}

export default function App() {
  const [sport, setSport] = useState<Sport>(loadSport);
  const [overrides, setOverrides] = useState<Record<string, RankOverride>>(loadOverrides);
  const [config, setConfig] = useState<DraftConfig>({ teams: 12, slot: 6, rounds: 15 });
  const [selections, setSelections] = useState<Selections>({});
  const [armedPick, setArmedPick] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<View>("board");
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>(loadSavedTeams);
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [trees, setTrees] = useState<DraftTree[]>(loadTrees);
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(loadWatchlist);
  const [hockeyDraftedIds, setHockeyDraftedIds] = useState<string[]>(loadHockeyPicks);
  const [hockeyTakenIds, setHockeyTakenIds] = useState<string[]>(loadHockeyTaken);
  const [hockeyKeepersLoaded, setHockeyKeepersLoaded] = useState<boolean>(loadHockeyKeepersLoaded);
  const [hockeyNextPickIsMine, setHockeyNextPickIsMine] = useState(false);
  const [hockeySlotOverrides, setHockeySlotOverrides] = useState<Partial<Record<string, HockeyRosterSlotLabel>>>(
    loadHockeySlotOverrides
  );

  useEffect(() => {
    localStorage.setItem(SPORT_KEY, sport);
  }, [sport]);

  useEffect(() => {
    localStorage.setItem(HOCKEY_TAKEN_KEY, JSON.stringify(hockeyTakenIds));
  }, [hockeyTakenIds]);

  useEffect(() => {
    localStorage.setItem(HOCKEY_SLOT_OVERRIDES_KEY, JSON.stringify(hockeySlotOverrides));
  }, [hockeySlotOverrides]);

  useEffect(() => {
    localStorage.setItem(HOCKEY_PICKS_KEY, JSON.stringify(hockeyDraftedIds));
  }, [hockeyDraftedIds]);

  useEffect(() => {
    localStorage.setItem(HOCKEY_KEEPERS_LOADED_KEY, String(hockeyKeepersLoaded));
  }, [hockeyKeepersLoaded]);

  useEffect(() => {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  }, [overrides]);

  useEffect(() => {
    localStorage.setItem(SAVED_TEAMS_KEY, JSON.stringify(savedTeams));
  }, [savedTeams]);

  useEffect(() => {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(TREES_KEY, JSON.stringify(trees));
  }, [trees]);

  useEffect(() => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(Array.from(watchlistIds)));
  }, [watchlistIds]);

  const effectivePlayers = useMemo(
    () =>
      players.map((p) => ({
        ...p,
        rank: overrides[p.id]?.rank ?? p.rank,
      })),
    [overrides]
  );

  const playersById = useMemo(
    () => Object.fromEntries(effectivePlayers.map((p) => [p.id, p])),
    [effectivePlayers]
  );

  const myPicks = useMemo(
    () => getMyPicks(config).filter((pick) => pick <= players.length),
    [config]
  );

  const draftedPlayerIds = useMemo(
    () => new Set(Object.values(selections).filter((id): id is string => Boolean(id))),
    [selections]
  );

  // Whenever you draft a player, assume everyone ranked ahead of them is gone too --
  // players at or below the worst rank you've actually drafted get treated as taken.
  const impliedTakenIds = useMemo(() => {
    let maxDraftedRank = 0;
    for (const id of draftedPlayerIds) {
      const rank = playersById[id]?.rank;
      if (rank != null && rank > maxDraftedRank) maxDraftedRank = rank;
    }
    if (maxDraftedRank === 0) return new Set<string>();
    return new Set(
      effectivePlayers.filter((p) => p.rank <= maxDraftedRank && !draftedPlayerIds.has(p.id)).map((p) => p.id)
    );
  }, [draftedPlayerIds, playersById, effectivePlayers]);

  function handleConfigChange(next: DraftConfig) {
    if (next.slot > next.teams) next.slot = next.teams;
    setConfig(next);
  }

  function handleOverrideChange(playerId: string, patch: RankOverride) {
    setOverrides((prev) => ({ ...prev, [playerId]: { ...prev[playerId], ...patch } }));
  }

  function handleArmPick(pick: number) {
    setArmedPick((prev) => (prev === pick ? null : pick));
  }

  function handlePlayerClick(playerId: string) {
    if (draftedPlayerIds.has(playerId)) {
      // Undo: clear whichever pick this player is assigned to.
      const pickEntry = Object.entries(selections).find(([, id]) => id === playerId);
      if (pickEntry) {
        const pickNum = Number(pickEntry[0]);
        setSelections((prev) => {
          const next = { ...prev };
          delete next[pickNum];
          return next;
        });
      }
      return;
    }
    if (armedPick == null) return;
    setSelections((prev) => ({ ...prev, [armedPick]: playerId }));
    setArmedPick(null);
  }

  function handleDraftPlayer(playerId: string) {
    const nextOpenPick = myPicks.find((pick) => !selections[pick]);
    if (nextOpenPick == null) return;
    setSelections((prev) => ({ ...prev, [nextOpenPick]: playerId }));
  }

  function handleSaveTeam() {
    const picks = myPicks
      .filter((pick) => selections[pick])
      .map((pick) => {
        const player = playersById[selections[pick]!];
        return {
          pick,
          player: { id: player.id, name: player.name, position: player.position, team: player.team },
        };
      });
    if (picks.length === 0) return;
    const newTeam: SavedTeam = {
      id: crypto.randomUUID(),
      name: `Team ${savedTeams.length + 1}`,
      createdAt: new Date().toISOString(),
      config,
      picks,
    };
    setSavedTeams((prev) => [newTeam, ...prev]);
  }

  function handleClearTeam() {
    setSelections({});
    setArmedPick(null);
  }

  function handleRenameTeam(id: string, name: string) {
    setSavedTeams((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
  }

  function handleDeleteTeam(id: string) {
    setSavedTeams((prev) => prev.filter((t) => t.id !== id));
  }

  function handleAddNote() {
    const offset = (notes.length % 6) * 32;
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: "",
      text: "",
      color: NOTE_COLORS[notes.length % NOTE_COLORS.length],
      x: 40 + offset,
      y: 40 + offset,
      width: 224,
      height: 200,
    };
    setNotes((prev) => [...prev, newNote]);
  }

  function handleUpdateNote(id: string, patch: Partial<Pick<Note, "title" | "text" | "color">>) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }

  function handleMoveNote(id: string, x: number, y: number) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
  }

  function handleResizeNote(id: string, width: number, height: number) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, width, height } : n)));
  }

  function handleDeleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  function handleCreateTree(tree: DraftTree) {
    setTrees((prev) => [tree, ...prev]);
  }

  function handleRenameTree(id: string, name: string) {
    setTrees((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
  }

  function handleDeleteTree(id: string) {
    setTrees((prev) => prev.filter((t) => t.id !== id));
  }

  function handleAddTreeNode(treeId: string, parentId: string | null, player: Player) {
    setTrees((prev) =>
      prev.map((t) =>
        t.id === treeId
          ? addTreeNode(t, parentId, { id: player.id, name: player.name, position: player.position, team: player.team })
          : t
      )
    );
  }

  function handleDeleteTreeNode(treeId: string, nodeId: string) {
    setTrees((prev) => prev.map((t) => (t.id === treeId ? deleteTreeNode(t, nodeId) : t)));
  }

  function handleToggleWatchlist(playerId: string) {
    setWatchlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  }

  function handleExportData() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      overrides,
      savedTeams,
      notes,
      trees,
      watchlist: Array.from(watchlistIds),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fantasy-draft-prep-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleImportData(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(reader.result as string);
        if (!data || typeof data !== "object") throw new Error("Invalid file");
      } catch {
        window.alert("Couldn't read that file — make sure it's a Fantasy Draft Prep export.");
        return;
      }
      const confirmed = window.confirm(
        "Import this file? It will replace all current rank overrides, saved teams, notes, draft trees, and your watchlist on this device."
      );
      if (!confirmed) return;
      setOverrides((data.overrides as Record<string, RankOverride>) ?? {});
      setSavedTeams(Array.isArray(data.savedTeams) ? (data.savedTeams as SavedTeam[]) : []);
      setNotes(Array.isArray(data.notes) ? (data.notes as Note[]) : []);
      setTrees(Array.isArray(data.trees) ? (data.trees as DraftTree[]) : []);
      setWatchlistIds(new Set(Array.isArray(data.watchlist) ? (data.watchlist as string[]) : []));
    };
    reader.readAsText(file);
  }

  function handleSportChange(next: Sport) {
    setSport(next);
    setActiveView("board");
  }

  const effectiveHockeyPlayers = useMemo(
    () => (hockeyKeepersLoaded ? hockeyPlayers : hockeyPlayers.map((p) => ({ ...p, rosterStatus: "FA" }))),
    [hockeyKeepersLoaded]
  );

  const hockeyPlayersById = useMemo(
    () => Object.fromEntries(effectiveHockeyPlayers.map((p) => [p.id, p])),
    [effectiveHockeyPlayers]
  );

  const myHockeyKeeperIds = useMemo(
    () => effectiveHockeyPlayers.filter((p) => p.rosterStatus === MY_HOCKEY_TEAM).map((p) => p.id),
    [effectiveHockeyPlayers]
  );

  // A pick made while keepers were unloaded stops counting once the player is actually kept again (by anyone),
  // so a reload never lets someone else's keeper masquerade as one of your picks.
  const hockeyDraftedNotAlreadyKept = useMemo(
    () => hockeyDraftedIds.filter((id) => hockeyPlayersById[id]?.rosterStatus === "FA"),
    [hockeyDraftedIds, hockeyPlayersById]
  );

  const hockeyRosterSlots = useMemo(
    () =>
      buildHockeyRosterSlots(
        [...myHockeyKeeperIds, ...hockeyDraftedNotAlreadyKept],
        hockeyPlayersById,
        hockeySlotOverrides
      ),
    [myHockeyKeeperIds, hockeyDraftedNotAlreadyKept, hockeyPlayersById, hockeySlotOverrides]
  );

  const isHockeyRosterFull = myHockeyKeeperIds.length + hockeyDraftedNotAlreadyKept.length >= HOCKEY_ROSTER_TEMPLATE.length;
  const hockeyDraftedIdSet = useMemo(() => new Set(hockeyDraftedIds), [hockeyDraftedIds]);
  const hockeyTakenIdSet = useMemo(() => new Set(hockeyTakenIds), [hockeyTakenIds]);

  function handleDraftHockeyPlayer(playerId: string) {
    setHockeyDraftedIds((prev) => {
      if (prev.includes(playerId)) return prev;
      if (myHockeyKeeperIds.length + hockeyDraftedNotAlreadyKept.length >= HOCKEY_ROSTER_TEMPLATE.length) return prev;
      return [...prev, playerId];
    });
    setHockeyTakenIds((prev) => prev.filter((id) => id !== playerId));
  }

  function handleMarkHockeyTaken(playerId: string) {
    setHockeyTakenIds((prev) => (prev.includes(playerId) ? prev : [...prev, playerId]));
    setHockeyDraftedIds((prev) => prev.filter((id) => id !== playerId));
  }

  /** The single Draft button routes to your team only when armed; otherwise it just marks the player taken. */
  function handleHockeyDraftClick(playerId: string) {
    if (hockeyNextPickIsMine) {
      handleDraftHockeyPlayer(playerId);
      setHockeyNextPickIsMine(false);
    } else {
      handleMarkHockeyTaken(playerId);
    }
  }

  function handleToggleHockeyNextPickIsMine() {
    setHockeyNextPickIsMine((prev) => !prev);
  }

  function handleUndoHockeyDraft(playerId: string) {
    setHockeyDraftedIds((prev) => prev.filter((id) => id !== playerId));
    setHockeyTakenIds((prev) => prev.filter((id) => id !== playerId));
    setHockeySlotOverrides((prev) => {
      if (!(playerId in prev)) return prev;
      const next = { ...prev };
      delete next[playerId];
      return next;
    });
  }

  function handleClearHockeyPicks() {
    setHockeyDraftedIds([]);
    setHockeyTakenIds([]);
  }

  function handleToggleHockeyKeepers() {
    setHockeyKeepersLoaded((prev) => !prev);
  }

  function handleMoveHockeyPlayerToSlot(playerId: string, targetLabel: HockeyRosterSlotLabel) {
    setHockeySlotOverrides((prev) => ({ ...prev, [playerId]: targetLabel }));
  }

  function handleResetHockeyBoard() {
    setHockeyDraftedIds([]);
    setHockeyTakenIds([]);
    setHockeySlotOverrides({});
    setHockeyNextPickIsMine(false);
    setHockeyKeepersLoaded(false);
  }

  const canSave = Object.values(selections).some(Boolean);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
      <Sidebar
        active={activeView}
        onNavigate={setActiveView}
        sport={sport}
        onSportChange={handleSportChange}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        {sport === "hockey" ? (
          <>
            <TopBanner title="Hockey Draft Board" right={<Badge label={`${hockeyPlayers.length} Players`} />} />
            <div className="flex flex-1 gap-6 overflow-hidden bg-slate-100 p-6">
              <HockeyTeamPanel
                slots={hockeyRosterSlots}
                playersById={hockeyPlayersById}
                myTeamName={MY_HOCKEY_TEAM}
                onUndoDraft={handleUndoHockeyDraft}
                onClearPicks={handleClearHockeyPicks}
                canClearPicks={hockeyDraftedIds.length > 0 || hockeyTakenIds.length > 0}
                keepersLoaded={hockeyKeepersLoaded}
                onToggleKeepers={handleToggleHockeyKeepers}
                nextPickIsMine={hockeyNextPickIsMine}
                onToggleNextPickIsMine={handleToggleHockeyNextPickIsMine}
                onMoveToSlot={handleMoveHockeyPlayerToSlot}
                onResetBoard={handleResetHockeyBoard}
              />
              <HockeyDraftBoard
                players={effectiveHockeyPlayers}
                myTeamName={MY_HOCKEY_TEAM}
                draftedByMeIds={hockeyDraftedIdSet}
                takenByOthersIds={hockeyTakenIdSet}
                isRosterFull={isHockeyRosterFull}
                nextPickIsMine={hockeyNextPickIsMine}
                onDraftPlayer={handleHockeyDraftClick}
                onUndoDraft={handleUndoHockeyDraft}
              />
            </div>
          </>
        ) : activeView === "board" ? (
          <>
            <TopBanner title="Draft Board" />
            <div className="flex flex-1 justify-center overflow-x-auto overflow-y-hidden bg-slate-100 p-6">
              <div className="flex w-full max-w-[1800px] gap-6">
                <MyTeamPanel
                  config={config}
                  onConfigChange={handleConfigChange}
                  myPicks={myPicks}
                  selections={selections}
                  armedPick={armedPick}
                  onArmPick={handleArmPick}
                  playersById={playersById}
                  canSave={canSave}
                  onSaveTeam={handleSaveTeam}
                  onClearTeam={handleClearTeam}
                />
                <RankingsPanel
                  players={effectivePlayers}
                  onOverrideChange={handleOverrideChange}
                  myPicks={myPicks}
                  draftedPlayerIds={draftedPlayerIds}
                  impliedTakenIds={impliedTakenIds}
                  watchlistIds={watchlistIds}
                  armedPick={armedPick}
                  onPlayerClick={handlePlayerClick}
                  onDraftPlayer={handleDraftPlayer}
                  onToggleWatchlist={handleToggleWatchlist}
                />
                <TiersPanel
                  players={effectivePlayers}
                  draftedPlayerIds={draftedPlayerIds}
                  impliedTakenIds={impliedTakenIds}
                  watchlistIds={watchlistIds}
                  armedPick={armedPick}
                  onPlayerClick={handlePlayerClick}
                  onDraftPlayer={handleDraftPlayer}
                  onToggleWatchlist={handleToggleWatchlist}
                />
                <WatchlistPanel
                  players={effectivePlayers}
                  watchlistIds={watchlistIds}
                  draftedPlayerIds={draftedPlayerIds}
                  impliedTakenIds={impliedTakenIds}
                  armedPick={armedPick}
                  onPlayerClick={handlePlayerClick}
                  onDraftPlayer={handleDraftPlayer}
                  onToggleWatchlist={handleToggleWatchlist}
                />
              </div>
            </div>
          </>
        ) : activeView === "myTeams" ? (
          <>
            <TopBanner
              title="My Teams"
              right={<Badge label={`${savedTeams.length} Saved`} />}
            />
            <MyTeamsPage teams={savedTeams} onRename={handleRenameTeam} onDelete={handleDeleteTeam} />
          </>
        ) : activeView === "notes" ? (
          <>
            <TopBanner
              title="Notes"
              right={<Badge label={`${notes.length} Notes`} />}
            />
            <NotesPage
              notes={notes}
              onAdd={handleAddNote}
              onUpdate={handleUpdateNote}
              onMove={handleMoveNote}
              onResize={handleResizeNote}
              onDelete={handleDeleteNote}
            />
          </>
        ) : (
          <>
            <TopBanner
              title="Draft Tree"
              right={<Badge label={`${trees.length} Scenario${trees.length === 1 ? "" : "s"}`} />}
            />
            <DraftTreePage
              trees={trees}
              savedTeams={savedTeams}
              players={effectivePlayers}
              config={config}
              onCreateTree={handleCreateTree}
              onRenameTree={handleRenameTree}
              onDeleteTree={handleDeleteTree}
              onAddNode={handleAddTreeNode}
              onDeleteNode={handleDeleteTreeNode}
            />
          </>
        )}
      </div>
    </div>
  );
}
