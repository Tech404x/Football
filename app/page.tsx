"use client";

import { DndContext, DragOverlay, PointerSensor, type DragEndEvent, type DragStartEvent, useSensor, useSensors } from "@dnd-kit/core";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { AddPlayerModal, type AddPlayerValues } from "@/components/AddPlayerModal";
import { PlayerPool, PLAYER_POOL_DROP_ID } from "@/components/PlayerPool";
import { SquadBoard } from "@/components/SquadBoard";
import { TopControls } from "@/components/TopControls";
import { PlayerBadge } from "@/components/PositionSlot";
import {
  UserGroupIcon,
  NoSymbolIcon,
  ArrowPathIcon,
  PlusIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/solid";
import { Shirt as ShirtIcon } from "lucide-react";
import { mockPlayers } from "@/lib/mockPlayers";
import {
  autoAssignPlayers,
  createEmptyAssignments,
  ensureAssignmentsIntegrity,
  removePlayerFromAssignments,
  swapPlayerIntoSlot,
} from "@/lib/squadLogic";
import { FORMATION_SLOTS } from "@/lib/squadLogic";
import { loadState } from "@/lib/storage";
import type { Player } from "@/types/player";
import type { AssignmentMap, SquadSlot, TeamId } from "@/types/squad";

const FORMATION_SLOT_MAP = FORMATION_SLOTS.reduce<Record<string, SquadSlot>>((acc, slot) => {
  acc[slot.id] = slot;
  return acc;
}, {});

const DEFAULT_INACTIVE_PLAYER_IDS = ["p22", "p13", "p11", "p16", "p9"] as const;

const getDefaultActivePlayerIds = (players: Player[]): string[] => {
  return players.map((player) => player.id).filter((id) => {
    return !(DEFAULT_INACTIVE_PLAYER_IDS as readonly string[]).includes(id);
  });
};

const assignPlayerToBoard = (
  current: AssignmentMap,
  player: Player,
): { next: AssignmentMap; assignedSlotId?: string } => {
  const next: AssignmentMap = removePlayerFromAssignments(player.id, current);
  const availableSlots = FORMATION_SLOTS.filter((slot) => !next[slot.id]);
  if (!availableSlots.length) {
    return { next };
  }

  const teamCounts: Record<TeamId, number> = { "team-a": 0, "team-b": 0 };
  Object.entries(next).forEach(([slotId, playerId]) => {
    if (!playerId) {
      return;
    }
    const slot = FORMATION_SLOT_MAP[slotId];
    if (slot) {
      teamCounts[slot.teamId] += 1;
    }
  });

  const pickBalancedSlot = (slots: SquadSlot[]) => {
    if (!slots.length) {
      return undefined;
    }
    return [...slots].sort((a, b) => {
      const teamDiff = teamCounts[a.teamId] - teamCounts[b.teamId];
      if (teamDiff !== 0) {
        return teamDiff;
      }
      return a.order - b.order;
    })[0];
  };

  const preferredSlots = availableSlots.filter((slot) => slot.position === player.preferredPosition);
  const targetSlot = pickBalancedSlot(preferredSlots) ?? pickBalancedSlot(availableSlots);
  if (!targetSlot) {
    return { next };
  }
  next[targetSlot.id] = player.id;
  return { next, assignedSlotId: targetSlot.id };
};

export default function HomePage() {
  const [players, setPlayers] = useState<Player[]>(mockPlayers);
  const [assignments, setAssignments] = useState<AssignmentMap>(createEmptyAssignments());
  const [showPool, setShowPool] = useState(false);
  const [markedPlayerIds, setMarkedPlayerIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [lastSavedMessage, setLastSavedMessage] = useState<string>();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [draggingPlayerId, setDraggingPlayerId] = useState<string>();
  const [stateReady, setStateReady] = useState(false);
  const [absentMode, setAbsentMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [alternateJerseys, setAlternateJerseys] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = loadState();
    if (stored) {
      setPlayers(stored.players);
      setAssignments(ensureAssignmentsIntegrity(stored.players, stored.assignments));
      setShowPool(stored.showPool);
      setMarkedPlayerIds(stored.markedPlayerIds ?? []);
    } else {
      const activePlayerIds = getDefaultActivePlayerIds(mockPlayers);
      setMarkedPlayerIds(activePlayerIds);
      const initialMarkedPlayers = mockPlayers.filter((player) => activePlayerIds.includes(player.id));
      const autoAssignments = autoAssignPlayers(initialMarkedPlayers, undefined, { allowRebalanceWhenAllAssigned: true });
      setAssignments(autoAssignments);
    }
    setStateReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Removed auto-save to local storage

  useEffect(() => {
    if (!lastSavedMessage) {
      return;
    }
    const timeout = window.setTimeout(() => setLastSavedMessage(undefined), 4000);
    return () => window.clearTimeout(timeout);
  }, [lastSavedMessage]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const handleChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const playersById = useMemo(() => {
    return players.reduce<Record<string, Player>>((acc, player) => {
      acc[player.id] = player;
      return acc;
    }, {});
  }, [players]);

  const assignedPlayers = useMemo(() => new Set(Object.values(assignments).filter(Boolean) as string[]), [assignments]);
  const availablePlayers = players.filter((player) => !assignedPlayers.has(player.id));
  const poolPlayers = players;
  const draggingPlayer = draggingPlayerId ? playersById[draggingPlayerId] : undefined;
  const markedPlayers = useMemo(
    () => players.filter((player) => markedPlayerIds.includes(player.id)),
    [players, markedPlayerIds],
  );
  const teamCounts = useMemo(() => {
    const counts: Record<TeamId, number> = { "team-a": 0, "team-b": 0 };
    Object.entries(assignments).forEach(([slotId, playerId]) => {
      if (!playerId) {
        return;
      }
      const slot = FORMATION_SLOT_MAP[slotId];
      if (slot) {
        counts[slot.teamId] += 1;
      }
    });
    return counts;
  }, [assignments]);

  const handleDragStart = (event: DragStartEvent) => {
    const playerId = event.active?.data?.current?.playerId as string | undefined;
    if (!playerId) {
      return;
    }
    setDraggingPlayerId(playerId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const playerId = event.active?.data?.current?.playerId as string | undefined;
    if (!playerId) {
      setDraggingPlayerId(undefined);
      return;
    }
    const overId = event.over?.id;
    if (!overId) {
      setDraggingPlayerId(undefined);
      return;
    }

    setAssignments((current) => {
      if (overId === PLAYER_POOL_DROP_ID) {
        return removePlayerFromAssignments(playerId, current);
      }
      if (typeof overId === "string" && Object.prototype.hasOwnProperty.call(current, overId)) {
        return swapPlayerIntoSlot(playerId, overId, current);
      }
      return current;
    });
    setDraggingPlayerId(undefined);
  };

  const handleDragCancel = () => {
    setDraggingPlayerId(undefined);
  };


  const handleReset = () => {
    const defaultActiveIds = getDefaultActivePlayerIds(players);
    const nextMarkedPlayers = players.filter((player) => defaultActiveIds.includes(player.id));
    setMarkedPlayerIds(defaultActiveIds);
    const autoAssignments = autoAssignPlayers(nextMarkedPlayers, undefined, { allowRebalanceWhenAllAssigned: true });
    setAssignments(autoAssignments);
    setLastSavedMessage("Squad reset and auto-filled");
  };


  const handleRegenerate = () => {
    const assignedPlayerIds = Object.values(assignments).filter(Boolean) as string[];
    if (assignedPlayerIds.length === 0) {
      return;
    }
    const assignedPlayers = assignedPlayerIds.map(id => playersById[id]).filter(Boolean);
    const shuffled = [...assignedPlayers];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setAssignments(autoAssignPlayers(shuffled, undefined, { allowRebalanceWhenAllAssigned: true }));
  };

  const handleAddPlayer = (values: AddPlayerValues) => {
    const newPlayer: Player = {
      id: nanoid(6),
      name: values.name,
      preferredPosition: values.preferredPosition,
      photo: "/players/placeholder.svg",
    };
    setPlayers((prevPlayers) => [...prevPlayers, newPlayer]);
    setMarkedPlayerIds((prevMarked) => {
      if (prevMarked.includes(newPlayer.id)) {
        return prevMarked;
      }
      return [...prevMarked, newPlayer.id];
    });

    let placedOnBoard = false;
    setAssignments((current) => {
      const { next, assignedSlotId } = assignPlayerToBoard(current, newPlayer);
      placedOnBoard = Boolean(assignedSlotId);
      return next;
    });

    setModalOpen(false);
    setLastSavedMessage(
      placedOnBoard ? `${values.name} added to the squad board` : `${values.name} added to the pool`,
    );
  };

  const handleToggleFullscreen = async () => {
    if (typeof document === "undefined") {
      return;
    }
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      if (boardRef.current && boardRef.current.requestFullscreen) {
        await boardRef.current.requestFullscreen();
      }
    } catch (error) {
      console.error("Failed to toggle fullscreen", error);
    }
  };

  const handleToggleMark = (playerId: string) => {
    const player = playersById[playerId];
    setMarkedPlayerIds((prev) => {
      if (prev.includes(playerId)) {
        setAssignments((current) => removePlayerFromAssignments(playerId, current));
        return prev.filter((id) => id !== playerId);
      }
      if (player) {
        setAssignments((current) => assignPlayerToBoard(current, player).next);
      }
      return [...prev, playerId];
    });
  };

  const handleMissPlayer = (playerId: string) => {
    setAssignments((current) => {
      const next = removePlayerFromAssignments(playerId, current);
      // Balance teams by moving a player if diff > 1
      const assignedIds = Object.values(next).filter(Boolean) as string[];
      if (assignedIds.length === 0) return next;
      const slotMap = FORMATION_SLOTS.reduce<Record<string, SquadSlot>>((acc, slot) => {
        acc[slot.id] = slot;
        return acc;
      }, {});
      const counts: Record<TeamId, number> = { "team-a": 0, "team-b": 0 };
      assignedIds.forEach(id => {
        const slotId = Object.entries(next).find(([, pid]) => pid === id)?.[0];
        if (slotId) {
          const slot = slotMap[slotId];
          if (slot) counts[slot.teamId] += 1;
        }
      });
      const diff = Math.abs(counts["team-a"] - counts["team-b"]);
      if (diff <= 1) return next;
      const majority: TeamId = counts["team-a"] > counts["team-b"] ? "team-a" : "team-b";
      const minority: TeamId = majority === "team-a" ? "team-b" : "team-a";
      const emptySlotInMinority = FORMATION_SLOTS.find(slot => slot.teamId === minority && !next[slot.id]);
      if (!emptySlotInMinority) return next;
      const playerToMove = assignedIds.find(id => {
        const slotId = Object.entries(next).find(([, pid]) => pid === id)?.[0];
        if (slotId) {
          const slot = slotMap[slotId];
          return slot?.teamId === majority;
        }
        return false;
      });
      if (playerToMove) {
        const currentSlotId = Object.entries(next).find(([, pid]) => pid === playerToMove)?.[0];
        if (currentSlotId) {
          next[currentSlotId] = null;
          next[emptySlotInMinority.id] = playerToMove;
        }
      }
      return next;
    });
    setMarkedPlayerIds((prev) => prev.filter((id) => id !== playerId));
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-emerald-100 px-4 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-16">
        <TopControls
          onReset={handleReset}
          onRegenerate={handleRegenerate}
          onAddPlayer={() => setModalOpen(true)}
          onTogglePlayerPool={() => setShowPool(true)}
          onToggleAbsents={() => setAbsentMode((prev) => !prev)}
          absentsActive={absentMode}
          onToggleFullscreen={handleToggleFullscreen}
          isFullscreen={isFullscreen}
          onToggleJerseys={() => setAlternateJerseys((prev) => !prev)}
          jerseysSwapped={alternateJerseys}
          isRegenerateDisabled={assignedPlayers.size === 0}
        />
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
          <div className="relative w-full" ref={boardRef} data-export-board>
            {isFullscreen && (
              <div className="sticky top-0 z-30 bg-emerald-900/90 px-4 py-3 shadow-lg">
                <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 text-white">
                  <div className="flex flex-wrap items-center gap-6 text-2xl">
                    <button
                      onClick={() => setShowPool(true)}
                      className="text-white transition hover:text-emerald-200"
                      aria-label="Player Pool"
                    >
                      <UserGroupIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => setAbsentMode((prev) => !prev)}
                      className={clsx(
                        "transition",
                        absentMode ? "text-red-300" : "text-white hover:text-emerald-200",
                      )}
                      aria-label="Absents"
                    >
                      <NoSymbolIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => setAlternateJerseys((prev) => !prev)}
                      className={clsx(
                        "transition",
                        alternateJerseys ? "text-emerald-200" : "text-white hover:text-emerald-200",
                      )}
                      aria-label="Swap Shirts"
                    >
                      <ShirtIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={handleRegenerate}
                      aria-label="Regenerate"
                      className="text-white transition hover:text-emerald-200"
                    >
                      <ArrowPathIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={handleReset}
                      aria-label="Reset"
                      className="text-white transition hover:text-emerald-200"
                    >
                      <ArrowUturnLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => setModalOpen(true)}
                      aria-label="Add Player"
                      className="text-white transition hover:text-emerald-200"
                    >
                      <PlusIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-semibold text-white">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-900 bg-white text-emerald-900 font-bold">
                      {teamCounts[alternateJerseys ? 'team-b' : 'team-a']}
                    </span>
                    <span className="text-white/70">vs</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white bg-black text-white font-bold">
                      {teamCounts[alternateJerseys ? 'team-a' : 'team-b']}
                    </span>
                  </div>
                  <button
                    onClick={handleToggleFullscreen}
                    className="text-white transition hover:text-emerald-200"
                    aria-label="Exit fullscreen"
                  >
                    {isFullscreen ? (
                      <ArrowsPointingInIcon className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <ArrowsPointingOutIcon className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            )}
            <SquadBoard
              slots={FORMATION_SLOTS}
              assignments={assignments}
              playersById={playersById}
              onMissPlayer={handleMissPlayer}
              showAbsents={absentMode}
              isFullscreen={isFullscreen}
              alternateJerseys={alternateJerseys}
            />
            {isFullscreen && (
                <div
                  className={clsx(
                    "absolute inset-0 z-20 flex justify-end transition-all",
                    showPool ? "pointer-events-auto" : "pointer-events-none",
                  )}
                  style={{ paddingTop: "56px" }}
                >
                  <div
                    className={clsx(
                      "absolute inset-0 bg-emerald-900/40 transition-opacity",
                    showPool ? "opacity-100" : "opacity-0",
                  )}
                  onClick={() => setShowPool(false)}
                />
                <div
                  className={clsx(
                    "relative ml-auto h-full w-[80%] max-w-3xl bg-white/95 shadow-2xl transition-transform duration-300 ease-out",
                    showPool ? "translate-x-0" : "translate-x-full",
                  )}
                >
                  <PlayerPool
                    players={poolPlayers}
                    collapsed={false}
                    onToggle={() => setShowPool(false)}
                    markedPlayerIds={markedPlayerIds}
                    onToggleMark={handleToggleMark}
                    assignedPlayerIds={Array.from(assignedPlayers)}
                    hideToggle
                    toggleLabel="Close"
                  />
                </div>
              </div>
            )}
            {isFullscreen && modalOpen && (
              <AddPlayerModal onClose={() => setModalOpen(false)} onSubmit={handleAddPlayer} />
            )}
          </div>
          <DragOverlay dropAnimation={null}>
            {draggingPlayer ? (
              <div className="w-32 rounded-3xl bg-emerald-900/70 px-3 py-2">
                <PlayerBadge player={draggingPlayer} teamId="team-a" alternate={alternateJerseys} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
      {!isFullscreen && (
        <div
          className={clsx(
            "fixed inset-0 z-50 flex justify-end transition-all",
            showPool ? "pointer-events-auto" : "pointer-events-none",
          )}
        >
          <div
            className={clsx(
              "absolute inset-0 bg-slate-900/40 transition-opacity",
              showPool ? "opacity-100" : "opacity-0",
            )}
            onClick={() => setShowPool(false)}
          />
          <div
            className={clsx(
              "relative z-10 h-full bg-white shadow-2xl transition-transform duration-300 ease-out w-[80vw] max-w-2xl",
              showPool ? "translate-x-0" : "translate-x-full",
            )}
          >
            <PlayerPool
              players={poolPlayers}
              collapsed={false}
              onToggle={() => setShowPool(false)}
              markedPlayerIds={markedPlayerIds}
              onToggleMark={handleToggleMark}
              assignedPlayerIds={Array.from(assignedPlayers)}
              hideToggle
              toggleLabel="Close"
            />
          </div>
        </div>
      )}
      {modalOpen && !isFullscreen && (
        <AddPlayerModal onClose={() => setModalOpen(false)} onSubmit={handleAddPlayer} />
      )}
    </main>
  );
}
