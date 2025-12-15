import type { Player } from "@/types/player";

export const mockPlayers: Player[] = [
  { id: "p1", name: "م الفكي", photo: "/players/placeholder.svg", preferredPosition: "MID" },
  { id: "p2", name: "الطيب", photo: "/players/placeholder.svg", preferredPosition: "DEF" },
  { id: "p3", name: "قباني", photo: "/players/placeholder.svg", preferredPosition: "DEF" },
  { id: "p4", name: "م عثمان", photo: "/players/placeholder.svg", preferredPosition: "ATT" },
  { id: "p5", name: "عمر ج", photo: "/players/placeholder.svg", preferredPosition: "MID" },
  { id: "p6", name: "هاني", photo: "/players/placeholder.svg", preferredPosition: "MID" },
  { id: "p7", name: "الواثق", photo: "/players/placeholder.svg", preferredPosition: "ATT" },
  { id: "p8", name: "سامي", photo: "/players/placeholder.svg", preferredPosition: "ATT" },
  { id: "p9", name: "الطاهر", photo: "/players/placeholder.svg", preferredPosition: "ATT" },
  { id: "p10", name: "عماد م", photo: "/players/placeholder.svg", preferredPosition: "DEF" },
  { id: "p11", name: "م الأزرق", photo: "/players/placeholder.svg", preferredPosition: "MID" },
  { id: "p12", name: "احمد ف", photo: "/players/placeholder.svg", preferredPosition: "MID" },
  { id: "p13", name: "امين م", photo: "/players/placeholder.svg", preferredPosition: "MID" },
  { id: "p14", name: "امين ع", photo: "/players/placeholder.svg", preferredPosition: "MID" },
  { id: "p15", name: "عبدالله", photo: "/players/placeholder.svg", preferredPosition: "DEF" },
  { id: "p16", name: "علاء", photo: "/players/placeholder.svg", preferredPosition: "DEF" },
  { id: "p17", name: "شادي", photo: "/players/placeholder.svg", preferredPosition: "ATT" },
  { id: "p18", name: "هيثم", photo: "/players/placeholder.svg", preferredPosition: "ATT" },
  { id: "p19", name: "أيمن ع", photo: "/players/placeholder.svg", preferredPosition: "ATT" },
  { id: "p20", name: "حذيفة", photo: "/players/placeholder.svg", preferredPosition: "DEF" },
  { id: "p21", name: "م بشير", photo: "/players/placeholder.svg", preferredPosition: "MID" },
  { id: "p22", name: "ص هباني", photo: "/players/placeholder.svg", preferredPosition: "MID" },
  { id: "p23", name: "م خليفة", photo: "/players/placeholder.svg", preferredPosition: "MID" },
];

export const BASE_PLAYER_ID_SET = new Set(mockPlayers.map((player) => player.id));
