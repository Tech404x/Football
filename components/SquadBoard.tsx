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
    isFullscreen ? "min-h-[calc(100vh-96px)]" : isHorizontal ? "h-[52vh] min-h-[440px] sm:h-[48vh]" : "h-[78vh] min-h-[680px] sm:h-[66vh]",
  );

  return (
    <section className="flex flex-col gap-3" onClick={() => setActiveMenuPlayerId(null)}>
      {/* Mobile-first pitch: full-width on mobile, constrained on larger screens */}
      <div className={fieldContainerClass}>
        <div className={pitchClass}>
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
            <div className="absolute inset-0">
              {["home", "away"].map((side) => (
                <div
                  key={`${side}-goal`}
                  className={clsx(
                    "absolute flex items-center justify-center overflow-hidden rounded-md",
                    isHorizontal
                      ? side === "home"
                        ? "left-1 top-1/2 -translate-y-1/2 h-16 sm:h-24 w-16 sm:w-24"
                        : "right-1 top-1/2 -translate-y-1/2 h-16 sm:h-24 w-16 sm:w-24"
                      : side === "home"
                        ? "top-1 left-1/2 -translate-x-1/2 w-32 sm:w-40 h-10 sm:h-14"
                        : "bottom-1 left-1/2 -translate-x-1/2 w-32 sm:w-40 h-10 sm:h-14"
                  )}
                >
                  <div className="relative h-full w-full rounded-md border-[3px] border-white/90 bg-gradient-to-br from-white/35 to-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
                    <div className="absolute inset-[3px] rounded-sm border border-white/70"></div>
                    <div className="absolute inset-[5px] rounded-sm opacity-80 bg-[linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.45)_1px,transparent_1px)] bg-[length:8px_8px]"></div>
                    <div className="absolute inset-y-2 left-2 w-1 bg-white/50 blur-[1px]"></div>
                    <div className="absolute inset-y-2 right-2 w-1 bg-white/50 blur-[1px]"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Team positioning on football field */}
          <div className="absolute inset-1 z-20 sm:inset-2">
            {/* Team A (White) */}
            {teamIds.includes("team-a") && (() => {
              const teamASlots = slots.filter((slot) => slot.teamId === "team-a");
              return (
                <div
                  className={clsx(
                    "absolute flex px-3 sm:px-4",
                    isHorizontal
                      ? "left-0 top-0 bottom-0 w-1/2 flex-row justify-center gap-6 sm:gap-10"
                      : "top-0 left-0 right-0 h-1/2 flex-col justify-evenly"
                  )}
                >
                  {teamOrder("team-a").map((line) => {
                    const lineSlots = buildLineSlots(teamASlots, line);
                    if (lineSlots.length === 0) return null;
                    return (
                      <div key={`team-a-${line}`} className={isHorizontal ? "h-full" : "w-full"}>
                        <div
                          className={clsx("grid gap-2 sm:gap-4", isHorizontal ? "h-full" : "w-full")}
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
                    "absolute flex px-3 sm:px-4",
                    isHorizontal
                      ? "right-0 top-0 bottom-0 w-1/2 flex-row justify-center gap-6 sm:gap-10"
                      : "bottom-0 left-0 right-0 h-1/2 flex-col justify-evenly"
                  )}
                >
                  {teamOrder("team-b").map((line) => {
                    const lineSlots = buildLineSlots(teamBSlots, line);
                    if (lineSlots.length === 0) return null;
                    return (
                      <div key={`team-b-${line}`} className={isHorizontal ? "h-full" : "w-full"}>
                        <div
                          className={clsx("grid gap-2 sm:gap-4", isHorizontal ? "h-full" : "w-full")}
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
        </div>
      </div>
    </section>
  );
};







