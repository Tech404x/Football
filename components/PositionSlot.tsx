"use client";

import { useDroppable, useDraggable } from "@dnd-kit/core";
import clsx from "clsx";
import Image from "next/image";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/solid";
import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { BASE_PLAYER_ID_SET } from "@/lib/mockPlayers";
import type { Player, PlayerMatchStats, Position } from "@/types/player";
import type { SquadSlot, TeamId } from "@/types/squad";

const jerseyClasses = {
  light: "bg-white text-emerald-700",
  dark: "bg-slate-900 text-white",
};

const POSITION_SEQUENCE: Position[] = ["DEF", "MID", "ATT"];

const getPositionMismatchLevel = (slotPosition: Position, playerPosition: Position): number => {
  const slotIndex = POSITION_SEQUENCE.indexOf(slotPosition);
  const playerIndex = POSITION_SEQUENCE.indexOf(playerPosition);
  if (slotIndex === -1 || playerIndex === -1) {
    return 0;
  }
  return Math.abs(slotIndex - playerIndex);
};

const GoalIcon = () => (
  <div className="relative h-4 w-4 sm:h-5 sm:w-5 drop-shadow rounded-full bg-white/80 p-[2px] sm:p-[3px]">
    <Image src="/goal-ball.svg" alt="Goal scored" fill sizes="20px" priority className="object-contain" />
  </div>
);

const CardIcon = ({ active = true }: { active?: boolean }) => (
  <span
    className={clsx(
      "block h-4 w-3 rounded-[2px] border border-yellow-700 bg-yellow-300 shadow transition sm:h-5 sm:w-4",
      !active && "opacity-40",
    )}
    title="Yellow card"
  />
);

export const PlayerBadge = ({
  player,
  teamId,
  large,
  alternate,
  mismatchLevel = 0,
  isCustom,
  stats,
}: {
  player: Player;
  teamId: TeamId;
  large?: boolean;
  alternate?: boolean;
  mismatchLevel?: number;
  isCustom?: boolean;
  stats?: PlayerMatchStats;
}) => {
  const isTeamALight = alternate ? teamId === "team-b" : teamId === "team-a";
  const variant = isTeamALight ? "light" : "dark";
  const jerseyClass = jerseyClasses[variant];
  const mismatchBorderClasses =
    mismatchLevel >= 2
      ? "border-2 border-red-500 ring-2 ring-red-400/80 ring-offset-1 ring-offset-red-200/50"
      : mismatchLevel === 1
        ? "border-2 border-yellow-400 ring-2 ring-yellow-300/80 ring-offset-1 ring-offset-yellow-100/70"
        : "border-2 border-transparent";

  const hasStats = Boolean(stats && (stats.goals > 0 || stats.yellowCard));

  return (
    <div
      className={clsx(
        "flex flex-col items-center gap-0.5 sm:gap-1",
        isCustom && "rounded-3xl border border-sky-300/80 bg-sky-50/40 px-1 py-1",
      )}
    >
      <div className="relative flex items-center justify-center">
        <div
          className={clsx(
            "flex items-center justify-center rounded-xl sm:rounded-2xl font-bold uppercase shadow-lg",
            large
              ? "h-9 w-9 sm:h-14 sm:w-14 text-[10px] sm:text-sm"
              : "h-8 w-8 sm:h-14 sm:w-14 text-[9px] sm:text-sm",
            jerseyClass,
            mismatchBorderClasses,
          )}
        >
          {player.preferredPosition}
        </div>
        {hasStats && stats ? (
          <>
            <div className="absolute -top-6 left-1/2 flex -translate-x-1/2 items-center gap-1 text-[10px] sm:text-xs">
              {stats.goals > 0 &&
                Array.from({ length: Math.min(stats.goals, 5) }).map((_, index) => (
                  <GoalIcon key={index} />
                ))}
              {stats.goals > 5 && (
                <span className="text-xs font-bold text-white sm:text-sm">+{stats.goals - 5}</span>
              )}
              {stats.yellowCard && (
                <div className="pl-1">
                  <CardIcon />
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
      <p
        className={clsx(
          "font-semibold text-white drop-shadow text-right",
          large ? "text-xl sm:text-3xl" : "text-sm sm:text-lg",
        )}
        dir="rtl"
        style={{ textShadow: '-1px -1px 10px #000, 1px -1px 10px #000, -1px 1px 1px #000, 1px 1px 1px #000' }}
      >
        {player.name}
      </p>
    </div>
  );
};

const SlotPlayer = ({
  player,
  slot,
  onMissPlayer,
  activeMenuPlayerId,
  setActiveMenuPlayerId,
  showRemoveControl,
  onRemovePlayer,
  large,
  alternate,
  stats,
  onUpdatePlayerStats,
}: {
  player: Player;
  slot: SquadSlot;
  onMissPlayer: (playerId: string) => void;
  activeMenuPlayerId: string | null;
  setActiveMenuPlayerId: (id: string | null) => void;
  showRemoveControl?: boolean;
  onRemovePlayer?: (playerId: string) => void;
  large?: boolean;
  alternate?: boolean;
  stats?: PlayerMatchStats;
  onUpdatePlayerStats: (playerId: string, updates: Partial<PlayerMatchStats>) => void;
}) => {
  const [menuAlignment, setMenuAlignment] = useState<"center" | "left" | "right">("center");
  const [menuVertical, setMenuVertical] = useState<"below" | "above">("below");
  const badgeRef = useRef<HTMLDivElement | null>(null);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: player.id,
    data: { type: "player", playerId: player.id },
  });
  const setRefs = (node: HTMLDivElement | null) => {
    badgeRef.current = node;
    setNodeRef(node);
  };

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const showMenu = activeMenuPlayerId === player.id;

  const handleMiss = () => {
    onMissPlayer(player.id);
    setActiveMenuPlayerId(null);
  };

  const handleRemoveClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    (onRemovePlayer ?? onMissPlayer)(player.id);
    setActiveMenuPlayerId(null);
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (showRemoveControl) {
      handleRemoveClick(event);
      return;
    }
    setActiveMenuPlayerId(showMenu ? null : player.id);
  };

  const mismatchLevel = getPositionMismatchLevel(slot.position, player.preferredPosition);
  const isCustomPlayer = !BASE_PLAYER_ID_SET.has(player.id);

  const handleGoalChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextGoals = Number(event.target.value);
    onUpdatePlayerStats(player.id, { goals: nextGoals });
  };

  const toggleYellowCard = () => {
    onUpdatePlayerStats(player.id, { yellowCard: !stats?.yellowCard });
  };

  useEffect(() => {
    if (!showMenu) {
      return;
    }
    const updateAlignment = () => {
      const node = badgeRef.current;
      if (!node || typeof window === "undefined") {
        return;
      }
      const rect = node.getBoundingClientRect();
      const menuWidth = 160;
      const menuHeight = 140;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const centerX = rect.left + rect.width / 2;
      const padding = 16;
      if (centerX - menuWidth / 2 < padding) {
        setMenuAlignment("left");
      } else if (centerX + menuWidth / 2 > viewportWidth - padding) {
        setMenuAlignment("right");
      } else {
        setMenuAlignment("center");
      }
      if (rect.bottom + menuHeight > viewportHeight - padding) {
        setMenuVertical("above");
      } else {
        setMenuVertical("below");
      }
    };
    updateAlignment();
    window.addEventListener("resize", updateAlignment);
    return () => window.removeEventListener("resize", updateAlignment);
  }, [showMenu]);

  return (
    <div className="relative">
      <div
        ref={setRefs}
        style={style}
        {...listeners}
        {...attributes}
        className={clsx("cursor-grab touch-none", isDragging && "opacity-80")}
        onClick={handleClick}
      >
        <PlayerBadge
          player={player}
          teamId={slot.teamId}
          large={large}
          alternate={alternate}
          mismatchLevel={mismatchLevel}
          isCustom={isCustomPlayer}
          stats={stats}
        />
      </div>
      {showRemoveControl && (
        <button
          onClick={handleRemoveClick}
          className="absolute -top-2 -right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow-lg"
        >
          X
        </button>
      )}
      {showMenu && (
        <div
          className={clsx(
            "absolute z-10 w-36 transform rounded-xl border border-gray-200 bg-white p-2 text-xs shadow-xl",
            menuVertical === "below" ? "top-full mt-1 origin-top" : "bottom-full mb-1 origin-bottom",
            menuAlignment === "left" && "left-0 -translate-x-0",
            menuAlignment === "right" && "right-0 translate-x-0",
            menuAlignment === "center" && "left-1/2 -translate-x-1/2",
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-2 flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-600">Goals</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2">⚽</span>
              <select
                value={stats?.goals ?? 0}
                onChange={handleGoalChange}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1 pl-6 pr-2 text-xs font-semibold text-slate-800"
              >
                {[0, 1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600">Cards</span>
            <div className="flex gap-2">
              <button
                onClick={toggleYellowCard}
                className={clsx(
                  "rounded-md border border-slate-200 bg-white p-1 shadow-sm transition hover:scale-105",
                  stats?.yellowCard && "ring-2 ring-yellow-400",
                )}
                aria-pressed={Boolean(stats?.yellowCard)}
                aria-label="Toggle yellow card"
              >
                <CardIcon active={Boolean(stats?.yellowCard)} />
              </button>
            </div>
          </div>
          <button
            onClick={handleMiss}
            className="mt-1 block w-full rounded-lg bg-red-600 px-2 py-1 text-center text-[11px] font-semibold text-white hover:bg-red-700"
          >
            Absent
          </button>
        </div>
      )}
    </div>
  );
};

export type PositionSlotProps = {
  slot: SquadSlot;
  player?: Player | null;
  onMissPlayer: (playerId: string) => void;
  activeMenuPlayerId: string | null;
  setActiveMenuPlayerId: (id: string | null) => void;
  showRemoveControl?: boolean;
  onRemovePlayer?: (playerId: string) => void;
  large?: boolean;
  alternate?: boolean;
  isOriginSlot?: boolean;
  showSwapPreview?: boolean;
  statsByPlayerId: Record<string, PlayerMatchStats | undefined>;
  onUpdatePlayerStats: (playerId: string, updates: Partial<PlayerMatchStats>) => void;
};

export const PositionSlot = ({
  slot,
  player,
  onMissPlayer,
  activeMenuPlayerId,
  setActiveMenuPlayerId,
  showRemoveControl,
  onRemovePlayer,
  large,
  alternate,
  isOriginSlot,
  showSwapPreview,
  statsByPlayerId,
  onUpdatePlayerStats,
}: PositionSlotProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: slot.id,
    data: { type: "slot", slotId: slot.id },
  });
  const isEmpty = !player;

  const overHighlightClass = isOver
    ? player
      ? "bg-yellow-400/10 ring-2 ring-yellow-300"
      : "bg-emerald-400/10 ring-2 ring-emerald-200"
    : undefined;
  const originHighlightClass = isOriginSlot ? "ring-2 ring-yellow-400 bg-yellow-100/10" : undefined;

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex min-h-[60px] sm:min-h-[90px] w-full items-center justify-center rounded-2xl sm:rounded-3xl p-2 sm:p-3 transition",
        originHighlightClass,
        overHighlightClass,
        isEmpty && !isOver && "opacity-0",
      )}
    >
      {player ? (
        <div className="relative">
          <SlotPlayer
            player={player}
            slot={slot}
            onMissPlayer={onMissPlayer}
            activeMenuPlayerId={activeMenuPlayerId}
            setActiveMenuPlayerId={setActiveMenuPlayerId}
            showRemoveControl={showRemoveControl}
            onRemovePlayer={onRemovePlayer}
            large={large}
            alternate={alternate}
            stats={statsByPlayerId[player.id]}
            onUpdatePlayerStats={onUpdatePlayerStats}
          />
          {showSwapPreview && isOver && player && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="absolute -left-8 rounded-full bg-yellow-300/95 p-2 text-yellow-900 shadow-lg ring-2 ring-yellow-400">
                <ArrowsRightLeftIcon className="h-5 w-5 animate-pulse" />
              </div>
            </div>
          )}
          {showSwapPreview && isOriginSlot && player && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="absolute -right-8 rounded-full bg-yellow-300/95 p-2 text-yellow-900 shadow-lg ring-2 ring-yellow-400">
                <ArrowsRightLeftIcon className="h-5 w-5 animate-pulse" />
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
