"use client";

import clsx from "clsx";
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
  label,
  onClick,
  variant = "ghost",
  disabled,
}: {
  label: string;
  onClick: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={clsx(
      "rounded-2xl px-4 py-2 text-sm font-semibold transition",
      variant === "primary"
        ? "bg-emerald-600 text-white shadow-lg hover:bg-emerald-500 disabled:bg-emerald-300"
        : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:text-emerald-300",
    )}
  >
    {label}
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
        <h1 className="text-2xl font-bold text-slate-900">Squad Selector</h1>
        <p className="text-sm text-slate-500">Drag & drop to build your lineup.</p>
        {lastSavedMessage && <p className="text-xs font-semibold text-emerald-600">{lastSavedMessage}</p>}
      </div>
      <div className="flex flex-col items-end gap-3">
        <div className="flex flex-wrap justify-end gap-2">
          {onTogglePlayerPool && (
            <ControlButton label="Player Pool" onClick={onTogglePlayerPool} variant="primary" />
          )}
          {onToggleAbsents && (
            <ControlButton
              label="Absents"
              onClick={onToggleAbsents}
              variant={absentsActive ? "primary" : "ghost"}
            />
          )}
          {onToggleJerseys && (
            <ControlButton
              label="Shirts"
              onClick={onToggleJerseys}
              variant={jerseysSwapped ? "primary" : "ghost"}
            />
          )}
          {onToggleFullscreen && (
            <ControlButton
              label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              onClick={onToggleFullscreen}
              variant={isFullscreen ? "primary" : "ghost"}
            />
          )}
          <ControlButton label="Regenerate" onClick={onRegenerate} variant="ghost" disabled={isRegenerateDisabled} />
          <ControlButton label="Add Player" onClick={onAddPlayer} variant="ghost" />
          <ControlButton label="Reset" onClick={onReset} variant="ghost" />
          {onSave && <ControlButton label="Save" onClick={onSave} variant="primary" />}
        </div>
      </div>
    </section>
  );
};
