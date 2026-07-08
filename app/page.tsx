"use client";

import { DndContext, PointerSensor, type DragEndEvent, type DragStartEvent, type DragOverEvent, useSensor, useSensors } from "@dnd-kit/core";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { AddPlayerModal, type AddPlayerValues } from "@/components/AddPlayerModal";
import { PlayerPool, PLAYER_POOL_DROP_ID } from "@/components/PlayerPool";
import { SquadBoard } from "@/components/SquadBoard";
import {
  UserGroupIcon,
  NoSymbolIcon,
  ArrowPathIcon,
  PlusIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ArrowUturnLeftIcon,
  ArrowsRightLeftIcon,
  ArrowsUpDownIcon,
  Cog6ToothIcon,
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
import { loadState, saveState } from "@/lib/storage";
import type { Player, PlayerMatchStats } from "@/types/player";
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

const shufflePlayers = (list: Player[]): Player[] => {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const [dragOriginSlotId, setDragOriginSlotId] = useState<string>();
  const [swapPreviewActive, setSwapPreviewActive] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [orientationConfirmOpen, setOrientationConfirmOpen] = useState(false);
  const [stateReady, setStateReady] = useState(false);
  const [absentMode, setAbsentMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [alternateJerseys, setAlternateJerseys] = useState(false);
  const [isHorizontal, setIsHorizontal] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerMatchStats | undefined>>({});

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = loadState();
    if (stored) {
      setPlayers(stored.players);
      setAssignments(ensureAssignmentsIntegrity(stored.players, stored.assignments));
      setShowPool(false);
      setMarkedPlayerIds(stored.markedPlayerIds ?? []);
      setPlayerStats(stored.playerStats ?? {});
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

  useEffect(() => {
    if (!stateReady) {
      return;
    }
    saveState({
      players,
      assignments,
      showPool,
      markedPlayerIds,
      playerStats,
    });
  }, [players, assignments, showPool, markedPlayerIds, playerStats, stateReady]);

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

  useEffect(() => {
    const updateOrientation = () => {
      setIsHorizontal(window.innerWidth >= 1024);
    };
    if (typeof window !== "undefined") {
      updateOrientation();
      window.addEventListener("resize", updateOrientation);
      return () => window.removeEventListener("resize", updateOrientation);
    }
  }, []);

  useEffect(() => {
    if (!settingsOpen) {
      return;
    }
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && settingsRef.current?.contains(target)) {
        return;
      }
      setSettingsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [settingsOpen]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const playersById = useMemo(() => {
    return players.reduce<Record<string, Player>>((acc, player) => {
      acc[player.id] = player;
      return acc;
    }, {});
  }, [players]);

  const assignedPlayers = useMemo(() => new Set(Object.values(assignments).filter(Boolean) as string[]), [assignments]);
  const poolPlayers = players;
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

  const teamGoals = useMemo(() => {
    const totals: Record<TeamId, number> = { "team-a": 0, "team-b": 0 };
    Object.entries(assignments).forEach(([slotId, playerId]) => {
      if (!playerId) {
        return;
      }
      const slot = FORMATION_SLOT_MAP[slotId];
      if (!slot) {
        return;
      }
      const stats = playerStats[playerId];
      const normalGoals = stats?.goals ?? 0;
      const oppositeGoals = stats?.oppositeGoals ?? 0;
      if (normalGoals > 0) {
        totals[slot.teamId] += normalGoals;
      }
      if (oppositeGoals > 0) {
        const oppositeTeam: TeamId = slot.teamId === "team-a" ? "team-b" : "team-a";
        totals[oppositeTeam] += oppositeGoals;
      }
    });
    return totals;
  }, [assignments, playerStats]);

  const handleDragStart = (event: DragStartEvent) => {
    const playerId = event.active?.data?.current?.playerId as string | undefined;
    if (!playerId) {
      return;
    }
    const originEntry = Object.entries(assignments).find(([, assigned]) => assigned === playerId);
    setDragOriginSlotId(originEntry?.[0]);
    setSwapPreviewActive(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const playerId = event.active?.data?.current?.playerId as string | undefined;
    if (!playerId) {
      return;
    }
    const overId = event.over?.id;
    if (!overId) {
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
    setDragOriginSlotId(undefined);
    setSwapPreviewActive(false);
  };

  const handleDragCancel = () => {
    setDragOriginSlotId(undefined);
    setSwapPreviewActive(false);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const playerId = event.active?.data?.current?.playerId as string | undefined;
    if (!playerId) {
      setSwapPreviewActive(false);
      return;
    }
    const overId = event.over?.id;
    if (typeof overId === "string" && overId !== PLAYER_POOL_DROP_ID) {
      if (assignments[overId] && overId !== dragOriginSlotId) {
        setSwapPreviewActive(true);
        return;
      }
    }
    setSwapPreviewActive(false);
  };


  const performReset = () => {
    const basePlayers = [...mockPlayers];
    setPlayers(basePlayers);
    const defaultActiveIds = getDefaultActivePlayerIds(basePlayers);
    const nextMarkedPlayers = basePlayers.filter((player) => defaultActiveIds.includes(player.id));
    setMarkedPlayerIds(defaultActiveIds);
    const shuffledPlayers = shufflePlayers(nextMarkedPlayers);
    const autoAssignments = autoAssignPlayers(shuffledPlayers, undefined, { allowRebalanceWhenAllAssigned: true });
    setAssignments(autoAssignments);
    setPlayerStats({});
    setLastSavedMessage("Squad reset and auto-filled");
    setResetConfirmOpen(false);
  };

  const handleResetRequest = () => {
    setResetConfirmOpen(true);
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
        setPlayerStats((stats) => {
          if (!stats[playerId]) {
            return stats;
          }
          const next = { ...stats };
          delete next[playerId];
          return next;
        });
        return prev.filter((id) => id !== playerId);
      }
      if (player) {
        setAssignments((current) => assignPlayerToBoard(current, player).next);
      }
      return [...prev, playerId];
    });
  };

  const togglePlayerPool = () => {
    setShowPool((prev) => !prev);
  };

  const pitchWidthClass = clsx(
    "mx-auto w-full",
    isFullscreen ? "max-w-5xl" : isHorizontal ? "max-w-6xl" : "max-w-4xl",
  );

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
    setPlayerStats((stats) => {
      if (!stats[playerId]) {
        return stats;
      }
      const next = { ...stats };
      delete next[playerId];
      return next;
    });
  };

  const handleUpdatePlayerStats = (playerId: string, updates: Partial<PlayerMatchStats>) => {
    setPlayerStats((prev) => {
      const current: PlayerMatchStats = prev[playerId] ?? { goals: 0, oppositeGoals: 0, yellowCard: false };
      const next: PlayerMatchStats = { ...current, ...updates };
      if (next.goals === 0 && next.oppositeGoals === 0 && !next.yellowCard) {
        if (!prev[playerId]) {
          return prev;
        }
        const trimmed = { ...prev };
        delete trimmed[playerId];
        return trimmed;
      }
      return { ...prev, [playerId]: next };
    });
  };

  const toolbarButtonClass = (active?: boolean, danger?: boolean) =>
    clsx("icon-button", active && "is-active", danger && "is-danger");

  return (
    <main className="app-shell">
      <div className="match-frame pb-10">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
          <div className="relative w-full" ref={boardRef} data-export-board>
            <div className={pitchWidthClass}>
              <div
                className={clsx(
                  "match-toolbar",
                  isFullscreen ? "sticky top-0 z-30" : "relative z-30",
                )}
                style={{
                  gridTemplateColumns: isHorizontal
                    ? "minmax(40rem, 1fr)"
                    : "1fr",
                }}
              >
                <div className="scoreboard" aria-label="Match scoreboard">
                  {(() => {
                    const leftTeamId: TeamId = alternateJerseys ? "team-b" : "team-a";
                    const rightTeamId: TeamId = alternateJerseys ? "team-a" : "team-b";
                    const leftGoals = teamGoals[leftTeamId];
                    const rightGoals = teamGoals[rightTeamId];
                    const diff = Math.abs(leftGoals - rightGoals);
                    const leftScore = leftGoals >= rightGoals ? diff : 0;
                    const rightScore = rightGoals >= leftGoals ? diff : 0;
                    return (
                      <div className="scoreboard-row">
                        <div className="scoreboard-meta">
                          <div className="team-chip light">
                            <strong>{teamCounts[leftTeamId]}</strong>
                            <span>Goals x{leftGoals}</span>
                          </div>
                          <div>
                            <p className="panel-kicker">vs</p>
                            <div className="match-score">{leftScore} - {rightScore}</div>
                          </div>
                          <div className="team-chip dark">
                            <strong>{teamCounts[rightTeamId]}</strong>
                            <span>Goals x{rightGoals}</span>
                          </div>
                        </div>
                        <div className="scoreboard-actions">
                          <button
                            onClick={togglePlayerPool}
                            className={toolbarButtonClass(showPool)}
                            aria-label="Player Pool"
                            title="Player pool"
                          >
                            <UserGroupIcon className="h-5 w-5" aria-hidden="true" />
                          </button>
                          <div className="settings-anchor" ref={settingsRef}>
                            <button
                              onClick={() => setSettingsOpen((prev) => !prev)}
                              className={toolbarButtonClass(settingsOpen)}
                              aria-label="Settings"
                              aria-expanded={settingsOpen}
                              aria-controls="match-settings-panel"
                              title="Settings"
                            >
                              <Cog6ToothIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                            <div
                              id="match-settings-panel"
                              className={clsx("settings-tray", settingsOpen && "is-open")}
                              aria-hidden={!settingsOpen}
                            >
                              <button
                                onClick={() => setAbsentMode((prev) => !prev)}
                                className={toolbarButtonClass(absentMode, true)}
                                aria-label="Absents"
                                title="Mark absents"
                                tabIndex={settingsOpen ? 0 : -1}
                              >
                                <NoSymbolIcon className="h-5 w-5" aria-hidden="true" />
                              </button>
                              <button
                                onClick={() => setAlternateJerseys((prev) => !prev)}
                                className={toolbarButtonClass(alternateJerseys)}
                                aria-label="Swap Shirts"
                                title="Swap shirts"
                                tabIndex={settingsOpen ? 0 : -1}
                              >
                                <ShirtIcon className="h-5 w-5" aria-hidden="true" />
                              </button>
                              <button
                                onClick={handleRegenerate}
                                aria-label="Regenerate"
                                title="Regenerate"
                                className={toolbarButtonClass()}
                                tabIndex={settingsOpen ? 0 : -1}
                              >
                                <ArrowPathIcon className="h-5 w-5" aria-hidden="true" />
                              </button>
                              <button
                                onClick={() => setOrientationConfirmOpen(true)}
                                aria-label="Toggle Pitch Orientation"
                                title="Toggle pitch orientation"
                                className={clsx(toolbarButtonClass(), "max-sm:!hidden")}
                                tabIndex={settingsOpen ? 0 : -1}
                              >
                                {isHorizontal ? (
                                  <ArrowsRightLeftIcon className="h-5 w-5" aria-hidden="true" />
                                ) : (
                                  <ArrowsUpDownIcon className="h-5 w-5" aria-hidden="true" />
                                )}
                              </button>
                              <button
                                onClick={handleResetRequest}
                                aria-label="Reset"
                                title="Reset squad"
                                className={toolbarButtonClass(false, true)}
                                tabIndex={settingsOpen ? 0 : -1}
                              >
                                <ArrowUturnLeftIcon className="h-5 w-5" aria-hidden="true" />
                              </button>
                              <button
                                onClick={() => setModalOpen(true)}
                                aria-label="Add Player"
                                title="Add player"
                                className={toolbarButtonClass()}
                                tabIndex={settingsOpen ? 0 : -1}
                              >
                                <PlusIcon className="h-5 w-5" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={handleToggleFullscreen}
                            className={toolbarButtonClass(isFullscreen)}
                            aria-label="Exit fullscreen"
                            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                          >
                            {isFullscreen ? (
                              <ArrowsPointingInIcon className="h-5 w-5" aria-hidden="true" />
                            ) : (
                              <ArrowsPointingOutIcon className="h-5 w-5" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="field-stage">
                <SquadBoard
                  slots={FORMATION_SLOTS}
                  assignments={assignments}
                  playersById={playersById}
                  onMissPlayer={handleMissPlayer}
                  showAbsents={absentMode}
                  isFullscreen={isFullscreen}
                  alternateJerseys={alternateJerseys}
                  dragOriginSlotId={dragOriginSlotId}
                  showSwapPreview={swapPreviewActive}
                  isHorizontal={isHorizontal}
                  playerStats={playerStats}
                  onUpdatePlayerStats={handleUpdatePlayerStats}
                />
              </div>
            </div>
            {orientationConfirmOpen && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
                <div className="modal-panel w-full max-w-lg p-6 text-center">
                  <p className="panel-kicker text-black/50">Pitch view</p>
                  <h2 className="mb-3 mt-1 text-2xl font-black text-[var(--color-ink)]">
                    Switch to {isHorizontal ? "Vertical" : "Horizontal"} View?
                  </h2>
                  <p className="mb-6 text-base font-semibold text-black/65">
                    This will change the pitch orientation.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                      onClick={() => setOrientationConfirmOpen(false)}
                      className="btn-secondary"
                    >
                      Keep Current View
                    </button>
                    <button
                      onClick={() => {
                        setIsHorizontal((prev) => !prev);
                        setOrientationConfirmOpen(false);
                      }}
                      className="btn-primary"
                    >
                      Yes, Switch View
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showPool && (
              <div className="absolute inset-x-0 bottom-0 top-24 z-40 flex justify-end md:top-28">
                <div
                  className="absolute inset-0 bg-black/55 transition-opacity"
                  onClick={() => setShowPool(false)}
                />
                <div className="pool-panel relative ml-auto h-full w-[92%] max-w-3xl overflow-hidden transition-transform duration-300 ease-out sm:w-[80%]">
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
            {modalOpen && (
              <AddPlayerModal onClose={() => setModalOpen(false)} onSubmit={handleAddPlayer} />
            )}
            {resetConfirmOpen && (
              <div className="modal-scrim">
                <div className="modal-panel w-full max-w-lg p-6 text-center">
                  <p className="panel-kicker text-black/50">Reset board</p>
                  <h2 className="mb-3 mt-1 text-2xl font-black text-[var(--color-ink)]">Reset Squad?</h2>
                  <p className="mb-6 text-base font-semibold text-black/65">
                    You will lose the current formation and the board will be auto-filled again.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                      onClick={() => setResetConfirmOpen(false)}
                      className="btn-secondary"
                    >
                      Keep Current Formation
                    </button>
                    <button
                      onClick={performReset}
                      className="btn-danger"
                    >
                      Yes, Reset Squad
                    </button>
                  </div>
                </div>
              </div>
            )}
            {lastSavedMessage && (
              <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-white/10 bg-[var(--color-night)] px-4 py-3 text-center text-sm font-bold text-white shadow-2xl">
                {lastSavedMessage}
              </div>
            )}
          </div>
        </DndContext>
      </div>

    </main>
  );
}
