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
  dimmed?: boolean;
  numberLabel?: string;
};

export const PlayerCard = ({
  player,
  compact = false,
  highlight,
  note,
  markControl,
  dimmed,
  numberLabel,
}: PlayerCardProps) => {
  return (
    <div
      className={clsx(
        "flex w-full items-center gap-3 rounded-2xl border bg-white/80 px-3 py-2 shadow-sm backdrop-blur transition",
        compact ? "py-1" : "py-2.5",
        highlight && "ring-2 ring-emerald-400",
        dimmed ? "border-red-300 opacity-60" : "border-emerald-400/70",
      )}
    >
      <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-emerald-200">
        {numberLabel && (
          <span className="absolute -bottom-1 left-1/2 z-10 -translate-x-1/2 rounded-full bg-emerald-600 px-2 text-[10px] font-bold text-white">
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
