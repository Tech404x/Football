"use client";

import { useState, type FormEvent } from "react";
import { POSITIONS, type Position } from "@/types/player";

export type AddPlayerValues = {
  name: string;
  preferredPosition: Position;
};

export type AddPlayerModalProps = {
  onClose: () => void;
  onSubmit: (values: AddPlayerValues) => void;
};

const defaultForm: AddPlayerValues = {
  name: "",
  preferredPosition: "MID",
};

export const AddPlayerModal = ({ onClose, onSubmit }: AddPlayerModalProps) => {
  const [form, setForm] = useState(defaultForm);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      return;
    }
    onSubmit({ ...form, name: form.name.trim() });
    setForm(defaultForm);
  };

  const handleClose = () => {
    setForm(defaultForm);
    onClose();
  };

  return (
    <div className="modal-scrim">
      <div className="modal-panel w-full max-w-md p-6">
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="panel-kicker text-black/50">Add Player</p>
            <h3 className="mt-1 text-2xl font-black text-[var(--color-ink)]">New teammate</h3>
          </div>
          <button onClick={handleClose} className="btn-secondary min-h-0 px-3 py-2 text-sm">
            Close
          </button>
        </header>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-bold text-[var(--color-ink)]">
            Full name
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="field-input"
              placeholder="Player name"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold text-[var(--color-ink)]">
            Preferred position
            <select
              value={form.preferredPosition}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, preferredPosition: event.target.value as Position }))
              }
              className="field-input"
            >
              {POSITIONS.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="btn-primary mt-1"
          >
            Save Player
          </button>
        </form>
      </div>
    </div>
  );
};
