export type Position = "DEF" | "MID" | "ATT";

export type Player = {
  id: string;
  name: string;
  photo: string;
  preferredPosition: Position;
};

export type PlayerMatchStats = {
  goals: number;
  oppositeGoals: number;
  yellowCard: boolean;
};

export const POSITIONS: Position[] = ["DEF", "MID", "ATT"];
