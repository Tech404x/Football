"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import type { Player, PlayerMatchStats, Position } from "@/types/player";
import type { AssignmentMap, SquadSlot, TeamId } from "@/types/squad";
import { PositionSlot } from "./PositionSlot";

const LINE_ORDER: Position[] = ["DEF", "MID", "ATT"];

const teamOrder = (teamId: TeamId): Position[] => {
  return teamId === "team-a" ? LINE_ORDER : [...LINE_ORDER].reverse();
};

const buildLineSlots = (slots: SquadSlot[], line: Position) => {
  return slots
    .filter((slot) => slot.position === line)
    .sort((a, b) => a.order - b.order);
};

export type SquadBoardProps = {
  slots: SquadSlot[];
  assignments: AssignmentMap;
  playersById: Record<string, Player>;

  onMissPlayer: (playerId: string) => void;
  showAbsents?: boolean;
  isFullscreen?: boolean;
  alternateJerseys?: boolean;
  dragOriginSlotId?: string;
  showSwapPreview?: boolean;
  isHorizontal?: boolean;
  playerStats: Record<string, PlayerMatchStats | undefined>;
  onUpdatePlayerStats: (playerId: string, updates: Partial<PlayerMatchStats>) => void;
  onToggleOptionsBar?: () => void;
  onTogglePlayerPool?: () => void;
  showOptionsBar?: boolean;
};

export const SquadBoard = ({
  slots,
  assignments,
  playersById,

  onMissPlayer,
  showAbsents,
  isFullscreen,
  alternateJerseys,
  dragOriginSlotId,
  showSwapPreview,
  isHorizontal,
  playerStats,
  onUpdatePlayerStats,
  onToggleOptionsBar,
  onTogglePlayerPool,
  showOptionsBar = true,
}: SquadBoardProps) => {
  const [activeMenuPlayerId, setActiveMenuPlayerId] = useState<string | null>(null);
  const slotMap = useMemo(() => {
    return slots.reduce<Record<string, SquadSlot>>((acc, slot) => {
      acc[slot.id] = slot;
      return acc;
    }, {});
  }, [slots]);

  const teamIds = useMemo(() => {
    const ids: TeamId[] = [];
    slots.forEach((slot) => {
      if (!ids.includes(slot.teamId)) {
        ids.push(slot.teamId);
      }
    });
    return ids;
  }, [slots]);


  const filledByTeam = teamIds.reduce<Record<TeamId, number>>((acc, teamId) => {
    acc[teamId] = 0;
    return acc;
  }, {} as Record<TeamId, number>);

  Object.entries(assignments).forEach(([slotId, playerId]) => {
    if (!playerId) {
      return;
    }
    const slot = slotMap[slotId];
    if (slot) {
      filledByTeam[slot.teamId] += 1;
    }
  });

  const lineStyle = (count: number, horizontal: boolean) => ({
    ...(horizontal
      ? { gridTemplateRows: `repeat(${count}, minmax(0, 1fr))` }
      : { gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }),
  });

  const fieldContainerClass = clsx(
    "mx-auto w-full",
    isHorizontal
      ? (isFullscreen ? "max-w-6xl" : "max-w-5xl")
      : isFullscreen
        ? "max-w-5xl"
        : "max-w-4xl",
  );

  const pitchClass = clsx(
    "pitch-surface isolate relative w-full",
    !isFullscreen && "overflow-hidden",
    "bg-[linear-gradient(180deg,var(--color-pitch-light),var(--color-pitch)_48%,var(--color-pitch-dark))]",
    isFullscreen
      ? "h-[calc(100vh-2rem)] min-h-[580px]"
      : showOptionsBar
        ? isHorizontal
          ? "h-[calc(100svh-6.25rem)] min-h-[440px]"
          : "h-[calc(100svh-6.25rem)] min-h-[560px]"
        : isHorizontal
          ? "h-[calc(100svh-2rem)] min-h-[500px]"
          : "h-[calc(100svh-2rem)] min-h-[620px]",
  );

  const sizeVariant = isFullscreen ? "fullscreen" : !showOptionsBar ? "expanded" : "default";

  return (
    <section className="flex flex-col gap-3" onClick={() => setActiveMenuPlayerId(null)}>
      {/* Mobile-first pitch: full-width on mobile, constrained on larger screens */}
      <div className={fieldContainerClass}>
        <div className={pitchClass}>
          {/* Pitch background markings */}
          <div className="pointer-events-none absolute inset-0 z-0">
            <div className="absolute inset-1 sm:inset-2 rounded-xl border-2 border-white/55"></div>
            <div
              className={clsx(
                "absolute",
                isHorizontal
                  ? "inset-y-4 sm:inset-y-6 left-1/2 w-0.5 sm:w-1 border-l"
                  : "inset-x-4 sm:inset-x-6 top-1/2 h-0.5 sm:h-1 border-t",
                "border-white/65"
              )}
            ></div>
            <div className="absolute left-1/2 top-1/2 h-16 w-16 sm:h-24 sm:w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 sm:border-4 border-white/65"></div>
            <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
          </div>

          {/* Team positioning on football field */}
          <div className="pointer-events-none absolute inset-1 z-30 sm:inset-2">
            {/* Team A (White) */}
            {teamIds.includes("team-a") && (() => {
              const teamASlots = slots.filter((slot) => slot.teamId === "team-a");
              return (
                <div
                  className={clsx(
                    "pointer-events-none absolute flex px-3 sm:px-4",
                    isHorizontal
                      ? "left-0 top-0 bottom-0 w-1/2 flex-row justify-center gap-6 sm:gap-10"
                      : "top-0 left-0 right-0 h-1/2 flex-col justify-evenly"
                  )}
                >
                  {teamOrder("team-a").map((line) => {
                    const lineSlots = buildLineSlots(teamASlots, line);
                    if (lineSlots.length === 0) return null;
                    return (
                      <div key={`team-a-${line}`} className={clsx("pointer-events-none", isHorizontal ? "h-full" : "w-full")}>
                        <div
                          className={clsx("pointer-events-none grid gap-2 sm:gap-4", isHorizontal ? "h-full" : "w-full")}
                          style={lineStyle(lineSlots.length, isHorizontal || false)}
                        >
                          {lineSlots.map((slot) => {
                            const playerId = assignments[slot.id];
                            const player = playerId ? playersById[playerId] : undefined;
                            return (
                              <PositionSlot
                                key={slot.id}
                                slot={slot}
                                player={player}
                                onMissPlayer={onMissPlayer}
                                activeMenuPlayerId={activeMenuPlayerId}
                                setActiveMenuPlayerId={setActiveMenuPlayerId}
                                showRemoveControl={showAbsents}
                                onRemovePlayer={onMissPlayer}
                                large={isFullscreen}
                                sizeVariant={sizeVariant}
                                alternate={alternateJerseys}
                                isOriginSlot={slot.id === dragOriginSlotId}
                                showSwapPreview={showSwapPreview}
                                statsByPlayerId={playerStats}
                                onUpdatePlayerStats={onUpdatePlayerStats}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            
            {/* Team B (Black) */}
            {teamIds.includes("team-b") && (() => {
              const teamBSlots = slots.filter((slot) => slot.teamId === "team-b");
              return (
                <div
                  className={clsx(
                    "pointer-events-none absolute flex px-3 sm:px-4",
                    isHorizontal
                      ? "right-0 top-0 bottom-0 w-1/2 flex-row justify-center gap-6 sm:gap-10"
                      : "bottom-0 left-0 right-0 h-1/2 flex-col justify-evenly"
                  )}
                >
                  {teamOrder("team-b").map((line) => {
                    const lineSlots = buildLineSlots(teamBSlots, line);
                    if (lineSlots.length === 0) return null;
                    return (
                      <div key={`team-b-${line}`} className={clsx("pointer-events-none", isHorizontal ? "h-full" : "w-full")}>
                        <div
                          className={clsx("pointer-events-none grid gap-2 sm:gap-4", isHorizontal ? "h-full" : "w-full")}
                          style={lineStyle(lineSlots.length, isHorizontal || false)}
                        >
                          {lineSlots.map((slot) => {
                            const playerId = assignments[slot.id];
                            const player = playerId ? playersById[playerId] : undefined;
                            return (
                              <PositionSlot
                                key={slot.id}
                                slot={slot}
                                player={player}
                                onMissPlayer={onMissPlayer}
                                activeMenuPlayerId={activeMenuPlayerId}
                                setActiveMenuPlayerId={setActiveMenuPlayerId}
                                showRemoveControl={showAbsents}
                                onRemovePlayer={onMissPlayer}
                                large={isFullscreen}
                                sizeVariant={sizeVariant}
                                alternate={alternateJerseys}
                                isOriginSlot={slot.id === dragOriginSlotId}
                                showSwapPreview={showSwapPreview}
                                statsByPlayerId={playerStats}
                                onUpdatePlayerStats={onUpdatePlayerStats}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Interactive Goals Layer at z-40 (above team slots so entire net and middle are pressable) */}
          <div className="pointer-events-none absolute inset-0 z-40">
            {["home", "away"].map((side) => {
              const isTopGoal = side === "home";
              const handleClick = (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveMenuPlayerId(null);
                if (isTopGoal) {
                  onToggleOptionsBar?.();
                } else {
                  onTogglePlayerPool?.();
                }
              };
              const tooltipText = isTopGoal
                ? (showOptionsBar ? "Click goal to hide options bar" : "Click goal to show options bar")
                : "Click goal to show player pool";

              return (
                <button
                  type="button"
                  key={`${side}-goal`}
                  onClick={handleClick}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label={tooltipText}
                  title={tooltipText}
                  className={clsx(
                    "pointer-events-auto absolute flex items-center justify-center cursor-pointer select-none transition-all duration-150 active:scale-95 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 z-40",
                    isHorizontal
                      ? side === "home"
                        ? "left-0 top-1/2 -translate-y-1/2 w-16 sm:w-20 md:w-24 h-44 sm:h-52 md:h-60"
                        : "right-0 top-1/2 -translate-y-1/2 w-16 sm:w-20 md:w-24 h-44 sm:h-52 md:h-60"
                      : side === "home"
                        ? "top-0 left-1/2 -translate-x-1/2 w-48 sm:w-64 md:w-72 h-14 sm:h-16 md:h-20"
                        : "bottom-0 left-1/2 -translate-x-1/2 w-48 sm:w-64 md:w-72 h-14 sm:h-16 md:h-20"
                  )}
                >
                  {/* Goal Frame & Net: The whole area is the goal button */}
                  <div
                    className={clsx(
                      "pointer-events-none relative flex h-full w-full items-center justify-center overflow-hidden transition-all duration-200 shadow-[0_8px_24px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_24px_rgba(241,180,76,0.7)] group-active:brightness-95",
                      isHorizontal
                        ? side === "home"
                          ? "rounded-r-xl border-[3px] border-l-0 border-white/90 bg-gradient-to-r from-white/30 to-white/10 group-hover:border-amber-300"
                          : "rounded-l-xl border-[3px] border-r-0 border-white/90 bg-gradient-to-l from-white/30 to-white/10 group-hover:border-amber-300"
                        : side === "home"
                          ? "rounded-b-xl border-[3px] border-t-0 border-white/90 bg-gradient-to-b from-white/30 to-white/10 group-hover:border-amber-300"
                          : "rounded-t-xl border-[3px] border-b-0 border-white/90 bg-gradient-to-t from-white/30 to-white/10 group-hover:border-amber-300"
                    )}
                  >
                    {/* Realistic Soccer Net Mesh Pattern covering the whole net area */}
                    <div className="pointer-events-none absolute inset-0 opacity-75 group-hover:opacity-95 transition-opacity bg-[linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.45)_1px,transparent_1px)] bg-[length:6px_6px]" />
                    <div className="pointer-events-none absolute inset-0 bg-white/5 group-hover:bg-amber-400/15 transition-colors" />

                    {/* Goal Button Pill in Net */}
                    <div className="pointer-events-none relative z-10 flex items-center gap-1.5 rounded-full border border-white/40 bg-black/65 px-3 py-1 text-xs font-black uppercase text-white shadow-lg backdrop-blur-sm transition-all group-hover:border-amber-300 group-hover:bg-amber-400 group-hover:text-black group-hover:scale-105">
                      {isTopGoal ? (
                        <>
                          <span className="text-amber-300 group-hover:text-black">⚡</span>
                          <span>{showOptionsBar ? "Options ▲" : "Options ▼"}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-amber-300 group-hover:text-black">👥</span>
                          <span>Players Pool</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};







