"use client";

import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import { useMemo, useRef, type MouseEvent } from "react";
import type { Player } from "@/types/player";
import { PlayerCard } from "./PlayerCard";

export const PLAYER_POOL_DROP_ID = "player-pool";

const PlayerPoolCard = ({
  player,
  marked,
  onToggleMark,
  numberLabel,
  className,
  inactive,
}: {
  player: Player;
  marked: boolean;
  onToggleMark: (playerId: string) => void;
  numberLabel: string;
  className?: string;
  inactive?: boolean;
}) => {
  const handleCheckboxClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onToggleMark(player.id);
  };

  return (
    <div className={clsx("w-full", className)}>
      <PlayerCard
        player={player}
        numberLabel={numberLabel}
        highlight={!inactive}
        inactive={inactive}
        markControl={
          <button
            onMouseDown={(event) => event.stopPropagation()}
            onClick={handleCheckboxClick}
            className={clsx(
              "flex h-5 w-5 items-center justify-center rounded border",
              marked ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white text-slate-400",
            )}
            aria-pressed={marked}
            aria-label={marked ? "Unmark player" : "Mark player"}
          >
            {marked ? "X" : ""}
          </button>
        }
      />
    </div>
  );
};

const DraggablePoolPlayer = ({
  player,
  marked,
  onToggleMark,
  numberLabel,
  assigned,
  inactive,
}: {
  player: Player;
  marked: boolean;
  onToggleMark: (playerId: string) => void;
  numberLabel: string;
  assigned: boolean;
  inactive?: boolean;
}) => {
  const disabled = assigned || !marked;
  return (
    <PlayerPoolCard
      player={player}
      marked={marked}
      onToggleMark={onToggleMark}
      numberLabel={numberLabel}
      inactive={inactive}
      className={clsx(disabled ? "opacity-60" : "", "cursor-default")}
    />
  );
};

export type PlayerPoolProps = {
  players: Player[];
  collapsed: boolean;
  onToggle: () => void;
  height?: number;
  markedPlayerIds: string[];
  onToggleMark: (playerId: string) => void;
  assignedPlayerIds: string[];
  hideToggle?: boolean;
  toggleLabel?: string;
};

export const PlayerPool = ({
  players,
  collapsed,
  onToggle,
  height,
  markedPlayerIds,
  onToggleMark,
  assignedPlayerIds,
  hideToggle,
  toggleLabel,
}: PlayerPoolProps) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const { isOver, setNodeRef } = useDroppable({ id: PLAYER_POOL_DROP_ID });
  const setScrollRef = (node: HTMLDivElement | null) => {
    scrollContainerRef.current = node;
    setNodeRef(node);
  };
  const markedSet = useMemo(() => new Set(markedPlayerIds), [markedPlayerIds]);
  const assignedSet = useMemo(() => new Set(assignedPlayerIds), [assignedPlayerIds]);
  const sortedPlayers = useMemo(() => {
    const order: Record<Player["preferredPosition"], number> = { DEF: 0, MID: 1, ATT: 2 };
    const priority = (player: Player) => {
      const marked = markedSet.has(player.id);
      const assigned = assignedSet.has(player.id);
      if (!marked && !assigned) {
        return 0;
      }
      if (!marked && assigned) {
        return 1;
      }
      if (marked && !assigned) {
        return 2;
      }
      return 3;
    };
    return [...players].sort((a, b) => {
      const priorityDiff = priority(a) - priority(b);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      const positionCompare = order[a.preferredPosition] - order[b.preferredPosition];
      if (positionCompare !== 0) {
        return positionCompare;
      }
      return a.name.localeCompare(b.name);
    });
  }, [players, markedSet, assignedSet]);

  const handleToggleMarkWithScroll = (playerId: string) => {
    const currentScroll = scrollContainerRef.current?.scrollTop ?? 0;
    onToggleMark(playerId);
    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = currentScroll;
      }
    });
  };

  return (
    <section
      className="flex h-full flex-col rounded-3xl bg-white/70 p-4 shadow-lg"
      style={height ? { height } : undefined}
    >
      <header className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">Player Pool</p>
          <h2 className="text-lg font-semibold text-slate-900">
            Available Players ({markedPlayerIds.length} of {players.length})
          </h2>
        </div>
        {!hideToggle && (
          <button
            onClick={onToggle}
            className="rounded-full border border-emerald-200 px-4 py-1 text-sm font-medium text-emerald-700"
          >
            {toggleLabel ?? (collapsed ? "Show" : "Hide")}
          </button>
        )}
      </header>
      <div className="flex-1 min-h-0">
        <div
          ref={setScrollRef}
          className={clsx(
            "grid gap-3 overflow-hidden rounded-2xl border border-dashed border-emerald-200/60 p-3 transition-all",
            collapsed ? "max-h-0 p-0 opacity-0" : "h-full overflow-y-auto",
            isOver && "bg-emerald-50/80",
          )}
        >
          {sortedPlayers.length === 0 ? (
            <p className="text-sm text-slate-500">Everyone is on the pitch.</p>
          ) : (
            (() => {
              let activeNumber = 1;
              let inactiveNumber = 1;
              let lastGroup: number | undefined;
              return sortedPlayers.map((player) => {
                const marked = markedSet.has(player.id);
                const assigned = assignedSet.has(player.id);
                const numberLabel = marked ? String(activeNumber++) : String(inactiveNumber++);
                const groupKey = marked ? (assigned ? 1 : 0) : assigned ? 3 : 2;
                const inactive = !marked;
                const showDivider = lastGroup !== undefined && groupKey !== lastGroup;
                lastGroup = groupKey;
                return (
                  <div key={`${player.id}-${assigned ? "on" : "off"}`} className="flex flex-col gap-2">
                    {showDivider && <hr className="border-dashed border-slate-200" />}
                    <DraggablePoolPlayer
                      player={player}
                      marked={marked}
                      onToggleMark={handleToggleMarkWithScroll}
                      numberLabel={numberLabel}
                      assigned={assigned}
                      inactive={inactive}
                    />
                  </div>
                );
              });
            })()
          )}
        </div>
      </div>
    </section>
  );
};
