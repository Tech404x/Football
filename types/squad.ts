import type { Player, PlayerMatchStats, Position } from "./player";

export type TeamId = "team-a" | "team-b";

export type SquadSlot = {
  id: string;
  label: string;
  position: Position;
  teamId: TeamId;
  order: number;
};

export type AssignmentMap = Record<string, string | null>;

export type Team = {
  id: string;
  name: string;
  players: string[];
};

export type PersistedSquadState = {
  players: Player[];
  assignments: AssignmentMap;
  showPool: boolean;
  markedPlayerIds: string[];
  playerStats?: Record<string, PlayerMatchStats | undefined>;
};
