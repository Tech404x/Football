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
    <section className="flex flex-col gap-5 rounded-3xl bg-gradient-to-b from-emerald-700 via-emerald-800 to-emerald-950 p-6 text-white shadow-2xl export-gradient">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-50/80">Squad Board</p>
          <h2 className="text-2xl font-bold">{matchupLabel}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="rounded-2xl bg-white/10 px-4 py-2">
            <span className="font-semibold">{filledCount}/{slots.length}</span>
            <span className="ml-2 text-emerald-50/80">placed</span>
          </div>
          <div className="rounded-2xl bg-white/5 px-3 py-1 text-xs font-semibold text-emerald-50/80">
            {poolCount} in pool
          </div>
        </div>
      </header>
      <div className="relative overflow-hidden rounded-[40px] border border-white/20 bg-emerald-900 export-surface">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-6 border-4 border-white/30 rounded-[32px]"></div>
          <div className="absolute inset-x-10 top-1/2 h-1 border-t border-white/40"></div>
          <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white/30"></div>
          <div className="absolute inset-x-10 top-[30%] h-20 border-y border-white/20"></div>
          <div className="absolute inset-x-10 bottom-[30%] h-20 border-y border-white/20"></div>
        </div>
        <div className="relative z-10 flex flex-col divide-y divide-white/15">
        {teamIds.map((teamId) => {
          const teamSlots = slots.filter((slot) => slot.teamId === teamId);
            return (
              <div
                key={teamId}
                className={clsx(
                  "flex flex-col gap-8 px-6 py-8",
                  teamId === "team-a" ? "pb-10" : "pt-10",
                )}
              >
                {teamOrder(teamId).map((line) => {
                  const lineSlots = buildLineSlots(teamSlots, line);
                  if (lineSlots.length === 0) {
                    return null;
                  }
                  return (
                    <div key={`${teamId}-${line}`} className="px-6">
                      <div
                        className="grid gap-4"
                        style={lineWidth(lineSlots.length)}
                      >
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
          })}
        </div>
      </div>
    </section>
  );
};
