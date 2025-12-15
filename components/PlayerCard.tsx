"use client";

import clsx from "clsx";
import Image from "next/image";
import type { ReactNode } from "react";
import type { Player } from "@/types/player";

export type PlayerCardProps = {
  player: Player;
  compact?: boolean;
  highlight?: boolean;
  note?: string;
  markControl?: ReactNode;
  numberLabel?: string;
  inactive?: boolean;
};

export const PlayerCard = ({
  player,
  compact = false,
  highlight,
  note,
  markControl,
  numberLabel,
  inactive,
}: PlayerCardProps) => {
  const borderClass = inactive ? "border-red-500" : "border-emerald-600";
  const avatarClass = inactive ? "bg-red-300" : "bg-emerald-500";
  const badgeClass = inactive ? "bg-red-600" : "bg-emerald-600";

  return (
    <div
      className={clsx(
        "flex w-full items-center gap-3 rounded-2xl border bg-white px-3 py-2 shadow-md transition",
        compact ? "py-1" : "py-2.5",
        highlight && "ring-2 ring-emerald-400",
        borderClass,
      )}
    >
      <div className={clsx("relative h-10 w-10 overflow-hidden rounded-xl", avatarClass)}>
        {numberLabel && (
          <span
            className={clsx(
              "absolute -bottom-1 left-1/2 z-10 -translate-x-1/2 rounded-full px-2 text-[10px] font-bold text-white",
              badgeClass,
            )}
          >
            {numberLabel}
          </span>
        )}
        <Image src={player.photo} alt={player.name} fill sizes="40px" className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col text-right" dir="rtl">
        <span className="text-sm font-semibold text-slate-900">{player.name}</span>
        <span className="text-xs uppercase tracking-wide text-slate-500" dir="ltr">
          {note ?? player.preferredPosition}
        </span>
      </div>
      {markControl && <div className="pl-1">{markControl}</div>}
    </div>
  );
};
