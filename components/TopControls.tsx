"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import {
  UserGroupIcon,
  NoSymbolIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ArrowPathIcon,
  PlusIcon,
  ArrowUturnLeftIcon,
  BookmarkSquareIcon,
} from "@heroicons/react/24/solid";
import { Shirt as ShirtIcon } from "lucide-react";

export type TopControlsProps = {
  onSave?: () => void;
  onReset: () => void;
  onRegenerate: () => void;
  onAddPlayer: () => void;
  onTogglePlayerPool?: () => void;
  onToggleAbsents?: () => void;
  absentsActive?: boolean;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  onToggleJerseys?: () => void;
  jerseysSwapped?: boolean;
  lastSavedMessage?: string;
  isRegenerateDisabled?: boolean;
};

const ControlButton = ({
  icon,
  onClick,
  variant = "ghost",
  disabled,
  srLabel,
}: {
  icon: ReactNode;
  onClick: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
  srLabel: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={srLabel}
    className={clsx(
      "flex h-10 w-10 items-center justify-center rounded-full text-sm transition",
      variant === "primary"
        ? "bg-emerald-600 text-white shadow-lg hover:bg-emerald-500 disabled:bg-emerald-300"
        : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:text-emerald-300",
    )}
  >
    <span aria-hidden="true" className="h-5 w-5">
      {icon}
    </span>
  </button>
);

export const TopControls = ({
  onSave,
  onReset,
  onRegenerate,
  onAddPlayer,
  onTogglePlayerPool,
  onToggleAbsents,
  absentsActive,
  onToggleFullscreen,
  isFullscreen,
  onToggleJerseys,
  jerseysSwapped,
  lastSavedMessage,
  isRegenerateDisabled,
}: TopControlsProps) => {
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/80 p-4 shadow">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900 mx-auto text-center">Squad Selector</h1>
        {lastSavedMessage && <p className="text-xs font-semibold text-emerald-600">{lastSavedMessage}</p>}
      </div>
      <div className="flex flex-col items-end gap-3">
        <div className="flex flex-wrap justify-end gap-2">
          {onTogglePlayerPool && (
            <ControlButton
              icon={<UserGroupIcon className="h-5 w-5" />}
              srLabel="Player Pool"
              onClick={onTogglePlayerPool}
              variant="primary"
            />
          )}
          {onToggleAbsents && (
            <ControlButton
              icon={<NoSymbolIcon className="h-5 w-5" />}
              srLabel="Toggle Absents"
              onClick={onToggleAbsents}
              variant={absentsActive ? "primary" : "ghost"}
            />
          )}
          {onToggleJerseys && (
            <ControlButton
              icon={<ShirtIcon className="h-5 w-5" />}
              srLabel="Swap Shirts"
              onClick={onToggleJerseys}
              variant={jerseysSwapped ? "primary" : "ghost"}
            />
          )}
          {onToggleFullscreen && (
            <ControlButton
              icon={isFullscreen ? <ArrowsPointingInIcon className="h-5 w-5" /> : <ArrowsPointingOutIcon className="h-5 w-5" />}
              srLabel={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              onClick={onToggleFullscreen}
              variant={isFullscreen ? "primary" : "ghost"}
            />
          )}
          <ControlButton
            icon={<ArrowPathIcon className="h-5 w-5" />}
            srLabel="Regenerate"
            onClick={onRegenerate}
            variant="ghost"
            disabled={isRegenerateDisabled}
          />
          <ControlButton icon={<PlusIcon className="h-5 w-5" />} srLabel="Add Player" onClick={onAddPlayer} variant="ghost" />
          <ControlButton
            icon={<ArrowUturnLeftIcon className="h-5 w-5" />}
            srLabel="Reset"
            onClick={onReset}
            variant="ghost"
          />
          {onSave && (
            <ControlButton icon={<BookmarkSquareIcon className="h-5 w-5" />} srLabel="Save" onClick={onSave} variant="primary" />
          )}
        </div>
      </div>
    </section>
  );
};
