"use client";

import clsx from "clsx";
import { useMemo } from "react";
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

const TEAM_SHORT_NAMES: Record<TeamId, string> = {
  "team-a": "White",
  "team-b": "Black",
};

export type SquadBoardProps = {
  slots: SquadSlot[];
  assignments: AssignmentMap;
  playersById: Record<string, Player>;
  poolCount: number;
};

export const SquadBoard = ({ slots, assignments, playersById, poolCount }: SquadBoardProps) => {
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

  const filledCount = Object.values(assignments).filter(Boolean).length;
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

  const matchupLabel = teamIds
    .map((teamId) => `${TEAM_SHORT_NAMES[teamId] ?? teamId} (${filledByTeam[teamId] ?? 0})`)
    .join(" vs ");

  return (
    <section className="flex flex-col gap-4 sm:gap-5">
      <header className="flex flex-wrap items-center justify-between gap-4 px-4 sm:px-0">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-50/80">Squad Board</p>
          <h2 className="text-xl sm:text-2xl font-bold">{matchupLabel}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm">
          <div className="rounded-2xl bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2">
            <span className="font-semibold">{filledCount}/{slots.length}</span>
            <span className="ml-2 text-emerald-50/80">placed</span>
          </div>
          <div className="rounded-2xl bg-white/5 px-2 py-1 sm:px-3 text-xs font-semibold text-emerald-50/80">
            {poolCount} in pool
          </div>
        </div>
      </header>
      
      {/* Mobile-first pitch: full-width on mobile, constrained on larger screens */}
      <div className="w-screen -mx-4 sm:mx-auto sm:w-full sm:max-w-4xl">
        <div className="relative w-full h-[70vh] sm:h-[55vh] bg-emerald-900 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            {/* Field lines - minimal padding for more space */}
            <div className="absolute inset-1 sm:inset-2 border-2 border-white/30 rounded-2xl"></div>
            <div className="absolute inset-x-4 sm:inset-x-6 top-1/2 h-0.5 sm:h-1 border-t border-white/40"></div>
            <div className="absolute left-1/2 top-1/2 h-16 w-16 sm:h-24 sm:w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 sm:border-4 border-white/30"></div>
            <div className="absolute inset-x-4 sm:inset-x-6 top-[30%] h-10 sm:h-16 border-y border-white/20"></div>
            <div className="absolute inset-x-4 sm:inset-x-6 bottom-[30%] h-10 sm:h-16 border-y border-white/20"></div>
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
                            return <PositionSlot key={slot.id} slot={slot} player={player} />;
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
                            return <PositionSlot key={slot.id} slot={slot} player={player} />;
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
