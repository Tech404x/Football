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
      "flex h-11 w-11 items-center justify-center rounded-lg text-sm font-black transition",
      variant === "primary"
        ? "bg-[var(--color-amber)] text-[var(--color-night)] shadow-lg hover:-translate-y-0.5 disabled:bg-black/10 disabled:text-black/30"
        : "border border-[var(--color-line)] text-[var(--color-ink)] hover:-translate-y-0.5 hover:border-[var(--color-amber)] disabled:text-black/30",
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
  isRegenerateDisabled,
}: TopControlsProps) => {
  return (
    <section className="modal-panel flex flex-wrap items-center justify-between gap-4 p-4">
      <div className="flex flex-col gap-2">
        <p className="panel-kicker text-black/50">Kooraa match board</p>
        <h1 className="text-2xl font-black text-[var(--color-ink)] mx-auto text-center">Squad Selector</h1>
      </div>
      <div className="flex flex-col items-end gap-3">
        <div className="flex flex-wrap justify-end gap-2 items-center">
          {onToggleFullscreen && (
            <div className="mr-auto">
              <ControlButton
                icon={isFullscreen ? <ArrowsPointingInIcon className="h-5 w-5" /> : <ArrowsPointingOutIcon className="h-5 w-5" />}
                srLabel={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                onClick={onToggleFullscreen}
                variant={isFullscreen ? "primary" : "ghost"}
              />
            </div>
          )}
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

