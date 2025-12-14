"use client";

import { useDroppable, useDraggable } from "@dnd-kit/core";
import clsx from "clsx";
import type { Player } from "@/types/player";
import type { SquadSlot, TeamId } from "@/types/squad";

const jerseyClasses = {
  light: "bg-white text-emerald-700",
  dark: "bg-slate-900 text-white",
};

export const PlayerBadge = ({
  player,
  teamId,
}: {
  player: Player;
  teamId: TeamId;
}) => {
  const variant = teamId === "team-a" ? "light" : "dark";
  const firstName = player.name.trim().split(/\s+/)[0] ?? player.name;

  return (
    <div className="flex flex-col items-center gap-0.5 sm:gap-1">
      <div
        className={clsx(
          "flex items-center justify-center rounded-xl sm:rounded-2xl font-bold uppercase shadow-lg",
          "h-8 w-8 sm:h-14 sm:w-14 text-[9px] sm:text-sm",
          jerseyClasses[variant],
        )}
      >
        {player.preferredPosition}
      </div>
      <p className="text-sm sm:text-lg font-semibold text-white drop-shadow text-right" dir="rtl">
        {player.name}
      </p>
    </div>
  );
};

const SlotPlayer = ({ player, slot, onMissPlayer, activeMenuPlayerId, setActiveMenuPlayerId }: { player: Player; slot: SquadSlot; onMissPlayer: (playerId: string) => void; activeMenuPlayerId: string | null; setActiveMenuPlayerId: (id: string | null) => void }) => {
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

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveMenuPlayerId(showMenu ? null : player.id);
  };

  const handleMiss = () => {
    onMissPlayer(player.id);
    setActiveMenuPlayerId(null);
  };

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
        <PlayerBadge player={player} teamId={slot.teamId} />
      </div>
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
};

export const PositionSlot = ({ slot, player, onMissPlayer, activeMenuPlayerId, setActiveMenuPlayerId }: PositionSlotProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: slot.id,
    data: { type: "slot", slotId: slot.id },
  });
  const isEmpty = !player;

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex min-h-[60px] sm:min-h-[90px] w-full items-center justify-center rounded-2xl sm:rounded-3xl p-2 sm:p-3 transition",
        isOver && "bg-emerald-400/10 ring-2 ring-emerald-200",
        isEmpty && !isOver && "opacity-0",
      )}
    >
      {player ? <SlotPlayer player={player} slot={slot} onMissPlayer={onMissPlayer} activeMenuPlayerId={activeMenuPlayerId} setActiveMenuPlayerId={setActiveMenuPlayerId} /> : null}
    </div>
  );
};
