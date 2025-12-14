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

const SlotPlayer = ({ player, slot }: { player: Player; slot: SquadSlot }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: player.id,
    data: { type: "player", playerId: player.id },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={clsx("cursor-grab touch-none", isDragging && "opacity-80")}
    >
      <PlayerBadge player={player} teamId={slot.teamId} />
    </div>
  );
};

export type PositionSlotProps = {
  slot: SquadSlot;
  player?: Player | null;
};

export const PositionSlot = ({ slot, player }: PositionSlotProps) => {
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
      {player ? <SlotPlayer player={player} slot={slot} /> : null}
    </div>
  );
};
