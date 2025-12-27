from pathlib import Path
path = Path('components/PositionSlot.tsx')
text = path.read_text()
old = """export const PositionSlot = ({
  slot,
  player,
  onMissPlayer,
  activeMenuPlayerId,
  setActiveMenuPlayerId,
  showRemoveControl,
  onRemovePlayer,
  large,
  alternate,
  isOriginSlot,
  showSwapPreview,
  statsByPlayerId,
  onUpdatePlayerStats,
}: PositionSlotProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: slot.id,
    data: { type: \\\"slot\\\", slotId: slot.id },
  });
  const isEmpty = !player;

  const overHighlightClass = isOver
    ? player
      ? \\\"bg-yellow-400/10 ring-2 ring-yellow-300\\\"
      : \\\"bg-emerald-400/10 ring-2 ring-emerald-200\\\"
    : undefined;
  const originHighlightClass = isOriginSlot ? \\\"ring-2 ring-yellow-400 bg-yellow-100/10\\\" : undefined;

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        \\\"flex min-h-[60px] sm:min-h-[90px] w-full items-center justify-center rounded-2l sm:rounded-3xl p-2 sm:p-3 transition\\\",
        originHighlightClass,
        overHighlightClass,
        isEmpty && !isOver && \\\"opacity-0\\\",
      )}
    >
      {player ? (
        <div className=\\\"relative\\\">
          <SlotPlayer
            player={player}
            slot={slot}
            onMissPlayer={onMissPlayer}
            activeMenuPlayerId={activeMenuPlayerId}
            setActiveMenuPlayerId={setActiveMenuPlayerId}
            showRemoveControl={showRemoveControl}
            onRemovePlayer={onRemovePlayer}
            large={large}
            alternate={alternate}
            stats={statsByPlayerId[player.id]}
            onUpdatePlayerStats={onUpdatePlayerStats}
          />
          {showSwapPreview && isOver && player && (
            <div className=\\\"pointer-events-none absolute inset-0 flex items-center justify-center\\\">
              <div className=\\\"absolute -left-8 rounded-full bg-yellow-300/95 p-2 text-yellow-900 shadow-lg ring-2 ring-yellow-400\\\">
                <ArrowsRightLeftIcon className=\\\"h-5 w-5 animate-pulse\\\" />
              </div>
            </div>
          )}
          {showSwapPreview && isOriginSlot && player && (
            <div className=\\\"pointer-events-none absolute inset-0 flex items-center justify-center\\\">
              <div className=\\\"absolute -right-8 rounded-full bg-yellow-300/95 p-2 text-yellow-900 shadow-lg ring-2 ring-yellow-400\\\">
                <ArrowsRightLeftIcon className=\\\"h-5 w-5 animate-pulse\\\" />
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
"""
new = """export const PositionSlot = ({
  slot,
  player,
  onMissPlayer,
  activeMenuPlayerId,
  setActiveMenuPlayerId,
  showRemoveControl,
  onRemovePlayer,
  large,
  alternate,
  isOriginSlot,
  showSwapPreview,
  statsByPlayerId,
  onUpdatePlayerStats,
}: PositionSlotProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: slot.id,
    data: { type: \\\"slot\\\", slotId: slot.id },
  });
  const isEmpty = !player;

  const slotSizeClass = large
    ? \\\"h-[150px] w-[120px] sm:h-[180px] sm:w-[140px]\\\"
    : \\\"h-[110px] w-[90px] sm:h-[130px] sm:w-[110px]\\\";

  const highlightStyle = (() => {
    if (isOver) {
      if (player) {
        return {
          backgroundColor: \\\"rgba(251, 191, 36, 0.22)\\\",
          border: \\\"2px solid rgba(251, 191, 36, 0.85)\\\",
        } as const;
      }
      return {
        backgroundColor: \\\"rgba(74, 222, 128, 0.22)\\\",
        border: \\\"2px solid rgba(74, 222, 128, 0.65)\\\",
      } as const;
    }
    if (isOriginSlot) {
      return {
        backgroundColor: \\\"rgba(250, 204, 21, 0.16)\\\",
        border: \\\"2px solid rgba(250, 204, 21, 0.55)\\\",
      } as const;
    }
    return undefined;
  })();

  return (
    <div className=\\\"flex items-center justify-center\\\">
      <div
        ref={setNodeRef}
        className={clsx(
          \\\"relative shrink-0 rounded-[28px] border border-white/20 bg-white/5 px-2 py-2 sm:px-3 sm:py-3 transition-colors duration-200\\\",
          slotSizeClass,
          isEmpty && !isOver && \\\"opacity-80\\\"
        )}
      >
        <div className=\\\"pointer-events-none absolute inset-1 rounded-[26px] border border-white/10\\\" />
        {highlightStyle ? (
          <div className=\\\"pointer-events-none absolute inset-0 rounded-[28px]\\\" style={{ ...highlightStyle }} />
        ) : null}
        {player ? (
          <div className=\\\"relative z-10 flex h-full w-full items-center justify-center\\\">
            <SlotPlayer
              player={player}
              slot={slot}
              onMissPlayer={onMissPlayer}
              activeMenuPlayerId={activeMenuPlayerId}
              setActiveMenuPlayerId={setActiveMenuPlayerId}
              showRemoveControl={showRemoveControl}
              onRemovePlayer={onRemovePlayer}
              large={large}
              alternate={alternate}
              stats={statsByPlayerId[player.id]}
              onUpdatePlayerStats={onUpdatePlayerStats}
            />
            {showSwapPreview && isOver && player && (
              <div className=\\\"pointer-events-none absolute inset-0 flex items-center justify-center\\\">
                <div className=\\\"absolute -left-8 rounded-full bg-yellow-300/95 p-2 text-yellow-900 shadow-lg ring-2 ring-yellow-400\\\">
                  <ArrowsRightLeftIcon className=\\\"h-5 w-5 animate-pulse\\\" />
                </div>
              </div>
            )}
            {showSwapPreview && isOriginSlot && player && (
              <div className=\\\"pointer-events-none absolute inset-0 flex items-center justify-center\\\">
                <div className=\\\"absolute -right-8 rounded-full bg-yellow-300/95 p-2 text-yellow-900 shadow-lg ring-2 ring-yellow-400\\\">
                  <ArrowsRightLeftIcon className=\\\"h-5 w-5 animate-pulse\\\" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className=\\\"pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-white/60\\\">
            {!isOver && isEmpty ? slot.label : null}
          </div>
        )}
      </div>
    </div>
  );
};
"""
if old not in text:
    raise SystemExit('old block not found')
path.write_text(text.replace(old, new))
