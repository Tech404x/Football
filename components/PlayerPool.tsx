"use client";

import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import { useMemo, useRef, type MouseEvent } from "react";
import type { Player } from "@/types/player";
import { BASE_PLAYER_ID_SET } from "@/lib/mockPlayers";
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
        isCustom={!BASE_PLAYER_ID_SET.has(player.id)}
        markControl={
          <button
            onMouseDown={(event) => event.stopPropagation()}
            onClick={handleCheckboxClick}
            className={clsx(
              "flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-black transition",
              marked
                ? "border-[var(--color-pitch-dark)] bg-[var(--color-pitch-dark)] text-white"
                : "border-[var(--color-line)] bg-white text-black/35 hover:border-[var(--color-amber)]",
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
      className={clsx(disabled && "cursor-default")}
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
      className="flex h-full flex-col bg-[var(--color-panel)] p-4 sm:p-5"
      style={height ? { height } : undefined}
    >
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="panel-kicker text-black/50">Player Pool</p>
          <h2 className="mt-1 text-xl font-black text-[var(--color-ink)]">
            Available Players ({markedPlayerIds.length} of {players.length})
          </h2>
        </div>
        <button
          onClick={onToggle}
          className="pool-close-button"
          aria-label={toggleLabel ?? (collapsed ? "Show player pool" : "Close player pool")}
          title={toggleLabel ?? (collapsed ? "Show" : "Close")}
        >
          X
        </button>
      </header>
      <div className="flex-1 min-h-0">
        <div
          ref={setScrollRef}
          className={clsx(
            "grid gap-3 overflow-hidden rounded-xl border border-dashed border-[var(--color-line)] bg-white/60 p-3 transition-all",
            collapsed ? "max-h-0 p-0 opacity-0" : "h-full overflow-y-auto",
            isOver && "border-[var(--color-amber)] bg-[#fff8e8]",
          )}
        >
          {sortedPlayers.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--color-line)] p-5 text-center text-sm font-bold text-black/55">
              Everyone is on the pitch.
            </p>
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
                    {showDivider && <hr className="border-dashed border-[var(--color-line)]" />}
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
