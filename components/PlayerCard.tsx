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
  isCustom?: boolean;
  isFiftyPercent?: boolean;
  onToggleFiftyPercent?: () => void;
};

export const PlayerCard = ({
  player,
  compact = false,
  highlight,
  note,
  markControl,
  numberLabel,
  inactive,
  isCustom,
  isFiftyPercent,
}: PlayerCardProps) => {
  const borderClass = isFiftyPercent
    ? "border-2 border-blue-500 ring-2 ring-blue-400/90 shadow-md shadow-blue-500/10"
    : inactive
      ? "border-[var(--color-line)]"
      : "border-[var(--color-pitch)]/45";
  const avatarClass = inactive ? "bg-[var(--color-pitch)]" : "bg-[var(--color-pitch)]";
  const badgeClass = isFiftyPercent
    ? "bg-blue-600 ring-1 ring-white"
    : inactive
      ? "bg-[var(--color-pitch-dark)]"
      : "bg-[var(--color-pitch-dark)]";

  return (
    <div
      className={clsx(
        "flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        compact ? "py-1" : "py-2.5",
        isFiftyPercent
          ? "border-2 border-blue-500 bg-blue-50/30 ring-2 ring-blue-400/80 shadow-md shadow-blue-500/10"
          : clsx(
              "bg-white",
              highlight && "ring-2 ring-[var(--color-amber)]/70",
              borderClass,
              isCustom && "ring-2 ring-[#5a9eca]/50",
            ),
      )}
    >
      <div className={clsx("relative h-10 w-10 shrink-0 overflow-hidden rounded-lg", avatarClass)}>
        {numberLabel && (
          <span
            className={clsx(
              "absolute -bottom-1 left-1/2 z-10 -translate-x-1/2 rounded-full px-2 text-[10px] font-black text-white",
              badgeClass,
            )}
          >
            {numberLabel}
          </span>
        )}
        <Image src={player.photo} alt={player.name} fill sizes="40px" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-1 max-w-[10rem] flex-col text-right" dir="rtl">
        <div className="flex items-center justify-end gap-1.5">
          {isFiftyPercent && (
            <span
              className="shrink-0 rounded-full border border-blue-200 bg-blue-600 px-1.5 py-0.2 text-[10px] font-black text-white shadow-sm"
              title="50% match player"
              dir="ltr"
            >
              50%
            </span>
          )}
          <span className="truncate text-sm font-black text-[var(--color-ink)]">{player.name}</span>
        </div>
        <span className="text-xs font-black uppercase tracking-wide text-black/45" dir="ltr">
          {note ?? player.preferredPosition}
        </span>
      </div>
      {markControl && <div className="shrink-0 ml-auto pl-1">{markControl}</div>}
    </div>
  );
};
