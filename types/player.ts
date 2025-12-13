export type Position = "DEF" | "MID" | "ATT";

export type Player = {
  id: string;
  name: string;
  photo: string;
  preferredPosition: Position;
};

export const POSITIONS: Position[] = ["DEF", "MID", "ATT"];
