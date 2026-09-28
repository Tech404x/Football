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
  const avatarClass = inactive ? "bg-gray-400" : "bg-[var(--color-pitch)]";
  const badgeClass = isFiftyPercent
    ? "bg-blue-600 ring-1 ring-white"
    : inactive
      ? "bg-black/65"
      : "bg-[var(--color-pitch-dark)]";

  return (
    <div
      className={clsx(
        "flex w-full items-center gap-1.5 rounded-xl border px-2 py-1.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        compact ? "py-1" : "py-1.5",
        isFiftyPercent
          ? "border-2 border-blue-500 bg-blue-50/30 ring-1 ring-blue-400/80 shadow-md shadow-blue-500/10"
          : clsx(
              "bg-white",
              highlight && "ring-1 ring-[var(--color-amber)]/70",
              borderClass,
              isCustom && "ring-1 ring-[#5a9eca]/50",
            ),
      )}
    >
      {/* Player Avatar with position text inside and number badge */}
      <div className={clsx("relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-black/10", avatarClass)}>
        <Image src={player.photo} alt={player.name} fill sizes="40px" className="object-cover" />
        {numberLabel && (
          <span
            className={clsx(
              "absolute top-0 left-0 z-10 flex h-3.5 min-w-3.5 items-center justify-center rounded-br-md px-1 text-[7.5px] font-black leading-none text-white",
              badgeClass,
            )}
          >
            {numberLabel}
          </span>
        )}
        <span
          className={clsx(
            "absolute bottom-0 inset-x-0 z-10 py-0.5 text-center text-[8.5px] font-black uppercase leading-none tracking-tight text-white",
            isFiftyPercent
              ? "bg-blue-600/95"
              : inactive
                ? "bg-black/75"
                : "bg-[var(--color-pitch-dark)]/95",
          )}
        >
          {note ?? player.preferredPosition}
        </span>
      </div>

      {/* Player Name placed immediately next to avatar */}
      <div className="flex min-w-0 flex-1 items-center overflow-hidden">
        <span className="truncate text-xs sm:text-sm font-black text-[var(--color-ink)]" dir="auto">
          {player.name}
        </span>
      </div>

      {/* Controls (50% and mark button) */}
      {markControl && <div className="shrink-0 ml-auto pl-0.5">{markControl}</div>}
    </div>
  );
};
