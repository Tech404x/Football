"use client";

import { useDroppable, useDraggable } from "@dnd-kit/core";
import clsx from "clsx";
import type { Player } from "@/types/player";
import type { SquadSlot } from "@/types/squad";

const jerseyClasses = {
  light: "bg-white text-emerald-700",
  dark: "bg-slate-900 text-white",
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

  const variant = slot.teamId === "team-a" ? "light" : "dark";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={clsx("cursor-grab touch-none", isDragging && "opacity-80")}
    >
      <div className="flex flex-col items-center gap-1">
        <div
          className={clsx(
            "flex h-14 w-14 items-center justify-center rounded-2xl font-bold uppercase shadow-lg",
            jerseyClasses[variant],
          )}
        >
          {player.preferredPosition}
        </div>
        <p className="text-xs font-semibold text-white drop-shadow text-right" dir="rtl">
          {player.name}
        </p>
      </div>
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
        "flex min-h-[90px] w-full items-center justify-center rounded-3xl p-3 transition",
        isOver && "bg-emerald-400/10 ring-2 ring-emerald-200",
        isEmpty && !isOver && "opacity-0",
      )}
    >
      {player ? <SlotPlayer player={player} slot={slot} /> : null}
    </div>
  );
};
