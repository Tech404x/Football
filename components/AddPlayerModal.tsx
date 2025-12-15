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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">Add Player</p>
            <h3 className="text-xl font-semibold text-slate-900">New teammate</h3>
          </div>
          <button onClick={handleClose} className="text-sm text-slate-500 hover:text-slate-800">
            Close
          </button>
        </header>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
            Full name
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-base"
              placeholder="Player name"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
            Preferred position
            <select
              value={form.preferredPosition}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, preferredPosition: event.target.value as Position }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-base"
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
            className="rounded-2xl bg-emerald-600 py-3 text-base font-semibold text-white shadow-lg hover:bg-emerald-500"
          >
            Save Player
          </button>
        </form>
      </div>
    </div>
  );
};
