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
  light: "bg-[var(--color-chalk)] text-[var(--color-pitch-dark)]",
  dark: "bg-[#070b12] text-white",
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

const GoalIcon = ({
  variant = "default",
  sizeClass = "h-4 w-4 sm:h-5 sm:w-5",
}: {
  variant?: "default" | "opposite";
  sizeClass?: string;
}) => (
  <div
    className={clsx(
      "relative rounded-full p-[2px] shadow-md sm:p-[3px]",
      sizeClass,
      variant === "opposite" ? "bg-[var(--color-danger)]" : "bg-white",
    )}
  >
    <Image src="/goal-ball.svg" alt="Goal scored" fill sizes="20px" priority className="object-contain" />
  </div>
);

const CardIcon = ({ active = true }: { active?: boolean }) => (
  <span
    className={clsx(
      "block h-4 w-3 rounded-[2px] border border-[#8a5a10] bg-[var(--color-amber)] shadow transition sm:h-5 sm:w-4",
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
      ? "border-2 border-[var(--color-danger)] ring-2 ring-[var(--color-danger)]/70 ring-offset-1 ring-offset-red-100/50"
      : mismatchLevel === 1
        ? "border-2 border-[var(--color-amber)] ring-2 ring-[var(--color-amber)]/70 ring-offset-1 ring-offset-yellow-100/70"
        : "border-2 border-transparent";

  const positiveGoals = stats?.goals ?? 0;
  const oppositeGoals = stats?.oppositeGoals ?? 0;
  const hasStats = Boolean(stats && (positiveGoals > 0 || oppositeGoals > 0 || stats.yellowCard));

  return (
    <div
      className={clsx(
        "relative z-30 flex flex-col items-center gap-0.5 sm:gap-1",
        isCustom && "rounded-xl border border-white/35 bg-white/10 px-1 py-1",
      )}
    >
      <div className="relative flex items-center justify-center">
        <div
          className={clsx(
            "flex items-center justify-center rounded-xl font-black uppercase shadow-[0_8px_18px_rgba(0,0,0,0.28)]",
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
              {positiveGoals > 0 &&
                Array.from({ length: Math.min(positiveGoals, 5) }).map((_, index) => (
                  <GoalIcon key={`goal-${index}`} />
                ))}
              {positiveGoals > 5 && (
                <span className="pl-1 text-xs font-bold text-white sm:text-sm">+{positiveGoals - 5}</span>
              )}
              {oppositeGoals > 0 && (
                <div className="flex items-center gap-1 pl-1">
                  {Array.from({ length: Math.min(oppositeGoals, 5) }).map((_, index) => (
                    <GoalIcon key={`opp-goal-${index}`} variant="opposite" />
                  ))}
                  {oppositeGoals > 5 && (
                    <span className="text-xs font-bold text-white sm:text-sm">+{oppositeGoals - 5}</span>
                  )}
                </div>
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
          "max-w-[7rem] font-black leading-tight text-white drop-shadow text-right sm:max-w-[10rem]",
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

  const handleOppositeGoalChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextGoals = Number(event.target.value);
    onUpdatePlayerStats(player.id, { oppositeGoals: nextGoals });
  };

  const toggleYellowCard = () => {
    onUpdatePlayerStats(player.id, { yellowCard: !stats?.yellowCard });
  };

  const goalSelectorValue = stats?.goals ?? 0;
  const oppositeGoalSelectorValue = stats?.oppositeGoals ?? 0;

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
      const menuHeight = 175;
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
    <div className={clsx("relative", showMenu ? "z-50" : "z-30")}>
      <div
        ref={setRefs}
        style={style}
        {...listeners}
        {...attributes}
        className={clsx(
          "cursor-grab touch-none rounded-xl transition focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-amber)]",
          isDragging ? "transition-none opacity-80" : "transition",
          showMenu && "outline outline-2 outline-dashed outline-[var(--color-amber)]",
        )}
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
          className="absolute -right-2 -top-2 z-20 flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-danger)] text-xs font-black text-white shadow-lg"
          aria-label={`Remove ${player.name}`}
        >
          X
        </button>
      )}
      {showMenu && (
        <div
          className={clsx(
            "absolute z-20 w-44 transform rounded-xl border border-black/10 bg-[var(--color-panel)] p-3 text-xs text-[var(--color-ink)] shadow-2xl",
            menuVertical === "below" ? "top-full mt-1 origin-top" : "bottom-full mb-1 origin-bottom",
            menuAlignment === "left" && "left-0 -translate-x-0",
            menuAlignment === "right" && "right-0 translate-x-0",
            menuAlignment === "center" && "left-1/2 -translate-x-1/2",
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-2 flex flex-col gap-1">
            <label className="text-[11px] font-black uppercase tracking-wide text-black/55">Goals</label>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-base leading-none">⚽</span>
              <select
                value={goalSelectorValue}
                onChange={handleGoalChange}
                className="field-input min-h-0 flex-1 py-1 px-2 text-xs font-black"
              >
                {[0, 1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-2 flex flex-col gap-1">
            <label className="text-[11px] font-black uppercase tracking-wide text-[var(--color-danger)]">opposite goals</label>
            <div className="flex items-center gap-2">
              <span className="shrink-0">
                <GoalIcon variant="opposite" sizeClass="h-4 w-4" />
              </span>
              <select
                value={oppositeGoalSelectorValue}
                onChange={handleOppositeGoalChange}
                className="field-input min-h-0 flex-1 border-red-200 bg-red-50 py-1 px-2 text-xs font-black text-[var(--color-danger)]"
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
            <span className="text-[11px] font-black uppercase tracking-wide text-black/55">Cards</span>
            <div className="flex gap-2">
              <button
                onClick={toggleYellowCard}
                className={clsx(
                  "rounded-md border border-[var(--color-line)] bg-white p-1 shadow-sm transition hover:-translate-y-0.5",
                  stats?.yellowCard && "ring-2 ring-[var(--color-amber)]",
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
            className="btn-danger mt-1 block w-full min-h-0 px-2 py-2 text-center text-[11px]"
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
      ? "bg-[var(--color-amber)]/15 ring-2 ring-[var(--color-amber)]"
      : "bg-white/10 ring-2 ring-white/75"
    : undefined;
  const originHighlightClass = isOriginSlot ? "bg-[var(--color-amber)]/15 ring-2 ring-[var(--color-amber)]" : undefined;

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex min-h-[68px] w-full items-center justify-center rounded-xl p-2 transition sm:min-h-[92px] sm:p-3",
        originHighlightClass,
        overHighlightClass,
        isEmpty && !isOver && "opacity-0",
      )}
    >
      {player ? (
        <div className={clsx("relative", activeMenuPlayerId === player.id ? "z-50" : "z-30")}>
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
              <div className="absolute -left-8 rounded-full bg-[var(--color-amber)] p-2 text-[var(--color-night)] shadow-lg ring-2 ring-white/70">
                <ArrowsRightLeftIcon className="h-5 w-5 animate-pulse" />
              </div>
            </div>
          )}
          {showSwapPreview && isOriginSlot && player && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="absolute -right-8 rounded-full bg-[var(--color-amber)] p-2 text-[var(--color-night)] shadow-lg ring-2 ring-white/70">
                <ArrowsRightLeftIcon className="h-5 w-5 animate-pulse" />
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

