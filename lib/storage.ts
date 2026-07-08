import type { PersistedSquadState } from "@/types/squad";

export const STORAGE_KEY = "soccer-squad-state";

export const loadState = (): PersistedSquadState | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PersistedSquadState;
  } catch (error) {
    console.warn("Failed to parse stored squad state", error);
    return null;
  }
};

export const saveState = (state: PersistedSquadState) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const clearState = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
};