"use client";

import { DndContext, DragOverlay, PointerSensor, type DragEndEvent, type DragStartEvent, useSensor, useSensors } from "@dnd-kit/core";
import clsx from "clsx";
import html2canvas from "html2canvas";
import { useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { AddPlayerModal, type AddPlayerValues } from "@/components/AddPlayerModal";
import { PlayerPool, PLAYER_POOL_DROP_ID } from "@/components/PlayerPool";
import { SquadBoard } from "@/components/SquadBoard";
import { TopControls } from "@/components/TopControls";
import { PlayerCard } from "@/components/PlayerCard";
import { mockPlayers } from "@/lib/mockPlayers";
import {
  FORMATION_SLOTS,
  autoAssignPlayers,
  createEmptyAssignments,
  ensureAssignmentsIntegrity,
  removePlayerFromAssignments,
  swapPlayerIntoSlot,
} from "@/lib/squadLogic";
import { loadState, saveState } from "@/lib/storage";
import type { Player } from "@/types/player";
import type { AssignmentMap } from "@/types/squad";

export default function HomePage() {
  const [players, setPlayers] = useState<Player[]>(mockPlayers);
  const [assignments, setAssignments] = useState<AssignmentMap>(createEmptyAssignments());
  const [showPool, setShowPool] = useState(true);
  const [markedPlayerIds, setMarkedPlayerIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [lastSavedMessage, setLastSavedMessage] = useState<string>();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [boardHeight, setBoardHeight] = useState<number>();
  const [draggingPlayerId, setDraggingPlayerId] = useState<string>();
  const [exporting, setExporting] = useState(false);
  const [stateReady, setStateReady] = useState(false);

  useEffect(() => {
    const stored = loadState();
    if (stored) {
      setPlayers(stored.players);
      setAssignments(ensureAssignmentsIntegrity(stored.players, stored.assignments));
      setShowPool(stored.showPool);
      setMarkedPlayerIds(stored.markedPlayerIds ?? []);
    }
    setStateReady(true);
  }, []);

  useEffect(() => {
    if (!stateReady) {
      return;
    }
    saveState({ players, assignments, showPool, markedPlayerIds });
  }, [players, assignments, showPool, markedPlayerIds, stateReady]);

  useEffect(() => {
    if (!lastSavedMessage) {
      return;
    }
    const timeout = window.setTimeout(() => setLastSavedMessage(undefined), 4000);
    return () => window.clearTimeout(timeout);
  }, [lastSavedMessage]);

  useEffect(() => {
    if (!boardRef.current || typeof window === "undefined") {
      return;
    }
    const element = boardRef.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setBoardHeight(entry.contentRect.height);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const playersById = useMemo(() => {
    return players.reduce<Record<string, Player>>((acc, player) => {
      acc[player.id] = player;
      return acc;
    }, {});
  }, [players]);

  const assignedPlayers = useMemo(() => new Set(Object.values(assignments).filter(Boolean) as string[]), [assignments]);
  const markedPlayerSet = useMemo(() => new Set(markedPlayerIds), [markedPlayerIds]);
  const availablePlayers = players.filter((player) => !assignedPlayers.has(player.id));
  const poolPlayers = players;
  const draggingPlayer = draggingPlayerId ? playersById[draggingPlayerId] : undefined;
  const markedPlayers = useMemo(
    () => players.filter((player) => markedPlayerIds.includes(player.id)),
    [players, markedPlayerIds],
  );

  const handleDragStart = (event: DragStartEvent) => {
    const playerId = event.active?.data?.current?.playerId as string | undefined;
    if (!playerId) {
      return;
    }
    setDraggingPlayerId(playerId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const playerId = event.active?.data?.current?.playerId as string | undefined;
    if (!playerId) {
      setDraggingPlayerId(undefined);
      return;
    }
    const overId = event.over?.id;
    if (!overId) {
      setDraggingPlayerId(undefined);
      return;
    }

    setAssignments((current) => {
      if (overId === PLAYER_POOL_DROP_ID) {
        return removePlayerFromAssignments(playerId, current);
      }
      if (typeof overId === "string" && Object.prototype.hasOwnProperty.call(current, overId)) {
        return swapPlayerIntoSlot(playerId, overId, current);
      }
      return current;
    });
    setDraggingPlayerId(undefined);
  };

  const handleDragCancel = () => {
    setDraggingPlayerId(undefined);
  };

  const handleSave = () => {
    saveState({ players, assignments, showPool, markedPlayerIds });
    setLastSavedMessage(`Saved at ${new Date().toLocaleTimeString()}`);
  };

  const handleReset = () => {
    setAssignments(createEmptyAssignments());
    setLastSavedMessage("All squad slots cleared");
  };

  const handleAutoFill = () => {
    if (markedPlayers.length === 0) {
      return;
    }
    setAssignments(autoAssignPlayers(markedPlayers));
  };

  const handleRegenerate = () => {
    if (markedPlayers.length === 0) {
      return;
    }
    const shuffled = [...markedPlayers];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setAssignments(autoAssignPlayers(shuffled));
  };

  const handleAddPlayer = (values: AddPlayerValues) => {
    const newPlayer: Player = {
      id: nanoid(6),
      name: values.name,
      preferredPosition: values.preferredPosition,
      photo: values.photo?.trim() ? values.photo.trim() : "/players/placeholder.svg",
    };
    setPlayers((prev) => [...prev, newPlayer]);
    setModalOpen(false);
    setLastSavedMessage(`${values.name} added to the pool`);
  };

  const handleToggleMark = (playerId: string) => {
    setMarkedPlayerIds((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId);
      }
      return [...prev, playerId];
    });
  };

  const exportBoardImage = async () => {
    const boardElement = boardRef.current;
    if (!boardElement) {
      return null;
    }
    boardElement.dataset.exporting = "true";
    try {
      const canvas = await html2canvas(boardElement, {
        backgroundColor: "#064e3b",
        scale: 2,
      });
      return new Promise<{ blob: Blob; dataUrl: string } | null>((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          resolve({ blob, dataUrl: canvas.toDataURL("image/png") });
        }, "image/png");
      });
    } finally {
      delete boardElement.dataset.exporting;
    }
  };

  const handleDownloadBoard = async () => {
    if (exporting) {
      return;
    }
    setExporting(true);
    try {
      const result = await exportBoardImage();
      if (!result) {
        return;
      }
      const link = document.createElement("a");
      link.href = result.dataUrl;
      link.download = `squad-${new Date().toISOString()}.png`;
      link.click();
    } finally {
      setExporting(false);
    }
  };

  const handleShareBoard = async () => {
    if (exporting) {
      return;
    }
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      await handleDownloadBoard();
      return;
    }
    setExporting(true);
    try {
      const result = await exportBoardImage();
      if (!result) {
        return;
      }
      const file = new File([result.blob], "squad.png", { type: "image/png" });
      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        await handleDownloadBoard();
        return;
      }
      await navigator.share({ files: [file], title: "Squad Lineup", text: "تشكيلة الفريق" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-emerald-100 px-4 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-16">
        <TopControls
          onSave={handleSave}
          onReset={handleReset}
          onAutoFill={handleAutoFill}
          onRegenerate={handleRegenerate}
          onAddPlayer={() => setModalOpen(true)}
          lastSavedMessage={lastSavedMessage}
        />
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
          <div
            className={clsx(
              "grid gap-6 grid-cols-1",
              showPool
                ? "lg:grid-cols-[minmax(0,0.8fr)_minmax(0,0.45fr)]"
                : "lg:grid-cols-[minmax(0,0.8fr)_minmax(0,0.2fr)]",
            )}
          >
            <div ref={boardRef} className="h-full" data-export-board>
              <SquadBoard
                slots={FORMATION_SLOTS}
                assignments={assignments}
                playersById={playersById}
                poolCount={availablePlayers.length}
              />
            </div>
            <PlayerPool
              players={poolPlayers}
              collapsed={!showPool}
              onToggle={() => setShowPool((prev) => !prev)}
              height={boardHeight}
              markedPlayerIds={markedPlayerIds}
              onToggleMark={handleToggleMark}
              assignedPlayerIds={Array.from(assignedPlayers)}
            />
          </div>
          <DragOverlay dropAnimation={null}>
            {draggingPlayer ? (
              <div className="w-64">
                <PlayerCard
                  player={draggingPlayer}
                  dimmed={!markedPlayerSet.has(draggingPlayer.id)}
                  note={draggingPlayer.preferredPosition}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleDownloadBoard}
            disabled={exporting}
            className="rounded-2xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 disabled:bg-emerald-400"
          >
            تنزيل التشكيلة
          </button>
          <button
            onClick={handleShareBoard}
            disabled={exporting}
            className="rounded-2xl border border-emerald-300 px-5 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:text-emerald-300"
          >
            مشاركة التشكيلة
          </button>
        </div>
      </div>
      {modalOpen && (
        <AddPlayerModal onClose={() => setModalOpen(false)} onSubmit={handleAddPlayer} />
      )}
    </main>
  );
}
