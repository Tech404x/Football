"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import type { Player, Position } from "@/types/player";
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
};

export const SquadBoard = ({
  slots,
  assignments,
  playersById,

  onMissPlayer,
  showAbsents,
  isFullscreen,
  alternateJerseys,
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

  const lineWidth = (count: number) => ({
    gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
  });

  const fieldContainerClass = clsx(
    "w-screen -mx-4 sm:mx-auto sm:w-full sm:max-w-4xl",
    isFullscreen && "w-full mx-auto sm:max-w-5xl",
  );

  const pitchClass = clsx(
    "relative w-full overflow-hidden",
    "bg-gradient-to-b from-[#1b7f3a] via-[#147033] to-[#0b4f23]",
    "before:absolute before:inset-0 before:bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.04)_12px,transparent_12px,transparent_24px)] before:opacity-40 before:pointer-events-none",
    isFullscreen ? "min-h-[calc(100vh-100px)]" : "h-[70vh] sm:h-[55vh]",
  );

  return (
    <section className="flex flex-col gap-4 sm:gap-5" onClick={() => setActiveMenuPlayerId(null)}>
      {!isFullscreen && (
        <header className="flex flex-wrap items-center justify-between gap-4 px-4 sm:px-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-50/80">Squad Board</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm" />
        </header>
      )}
      
      {/* Mobile-first pitch: full-width on mobile, constrained on larger screens */}
      <div className={fieldContainerClass}>
        <div className={pitchClass}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-1 sm:inset-2 rounded-2xl border-2 border-white/40"></div>
            <div className="absolute inset-x-4 sm:inset-x-6 top-1/2 h-0.5 sm:h-1 border-t border-white/60"></div>
            <div className="absolute left-1/2 top-1/2 h-16 w-16 sm:h-24 sm:w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 sm:border-4 border-white/60"></div>
            <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>

            {/* Top penalty box */}
            <div className="absolute left-1/2 top-0 h-[22%] w-[60%] -translate-x-1/2 border-2 border-white/60 border-t-0"></div>
            <div className="absolute left-1/2 top-0 h-[12%] w-[30%] -translate-x-1/2 border-2 border-white/60 border-t-0"></div>
            <div className="absolute left-1/2 top-0 h-[6%] w-[15%] -translate-x-1/2 border-2 border-white/60 border-t-0"></div>

            {/* Bottom penalty box */}
            <div className="absolute left-1/2 bottom-0 h-[22%] w-[60%] -translate-x-1/2 border-2 border-white/60 border-b-0"></div>
            <div className="absolute left-1/2 bottom-0 h-[12%] w-[30%] -translate-x-1/2 border-2 border-white/60 border-b-0"></div>
            <div className="absolute left-1/2 bottom-0 h-[6%] w-[15%] -translate-x-1/2 border-2 border-white/60 border-b-0"></div>
          </div>
          {/* Team positioning on football field */}
          <div className="absolute inset-1 sm:inset-2 z-10">
            {/* Team A (White) - Top half */}
            {teamIds.includes("team-a") && (() => {
              const teamASlots = slots.filter((slot) => slot.teamId === "team-a");
              return (
                <div className="absolute top-0 left-0 right-0 h-1/2 flex flex-col justify-evenly px-4">
                  {teamOrder("team-a").map((line) => {
                    const lineSlots = buildLineSlots(teamASlots, line);
                    if (lineSlots.length === 0) return null;
                    return (
                      <div key={`team-a-${line}`} className="w-full">
                        <div className="grid gap-2 sm:gap-4 w-full" style={lineWidth(lineSlots.length)}>
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
            
            {/* Team B (Black) - Bottom half */}
            {teamIds.includes("team-b") && (() => {
              const teamBSlots = slots.filter((slot) => slot.teamId === "team-b");
              return (
                <div className="absolute bottom-0 left-0 right-0 h-1/2 flex flex-col justify-evenly px-4">
                  {teamOrder("team-b").map((line) => {
                    const lineSlots = buildLineSlots(teamBSlots, line);
                    if (lineSlots.length === 0) return null;
                    return (
                      <div key={`team-b-${line}`} className="w-full">
                        <div className="grid gap-2 sm:gap-4 w-full" style={lineWidth(lineSlots.length)}>
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
