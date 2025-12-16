"use client";

import { useDroppable, useDraggable } from "@dnd-kit/core";
import clsx from "clsx";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/solid";
import { BASE_PLAYER_ID_SET } from "@/lib/mockPlayers";
import type { Player, Position } from "@/types/player";
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

export const PlayerBadge = ({
  player,
  teamId,
  large,
  alternate,
  mismatchLevel = 0,
  isCustom,
}: {
  player: Player;
  teamId: TeamId;
  large?: boolean;
  alternate?: boolean;
  mismatchLevel?: number;
  isCustom?: boolean;
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

  return (
    <div
      className={clsx(
        "flex flex-col items-center gap-0.5 sm:gap-1",
        isCustom && "rounded-3xl border border-sky-300/80 bg-sky-50/40 px-1 py-1",
      )}
    >
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
      <p
        className={clsx(
          "font-semibold text-white drop-shadow text-right",
          large ? "text-xl sm:text-3xl" : "text-sm sm:text-lg",
        )}
        dir="rtl"
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
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: player.id,
    data: { type: "player", playerId: player.id },
  });

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

  const handleRemoveClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    (onRemovePlayer ?? onMissPlayer)(player.id);
    setActiveMenuPlayerId(null);
  };

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (showRemoveControl) {
      handleRemoveClick(event);
      return;
    }
    setActiveMenuPlayerId(showMenu ? null : player.id);
  };

  const mismatchLevel = getPositionMismatchLevel(slot.position, player.preferredPosition);
  const isCustomPlayer = !BASE_PLAYER_ID_SET.has(player.id);

  return (
    <div className="relative">
      <div
        ref={setNodeRef}
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
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10">
          <button
            onClick={handleMiss}
            className="block w-full px-2 py-1 text-left text-xs bg-red-600 text-white hover:bg-red-700"
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

