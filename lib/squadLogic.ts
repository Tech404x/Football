import type { Player, Position } from "@/types/player";
import type { AssignmentMap, SquadSlot, TeamId } from "@/types/squad";

export const TEAM_LABELS: Record<TeamId, string> = {
  "team-a": "White Team",
  "team-b": "Black Team",
};

const LINE_COUNTS: Record<Position, number> = {
  ATT: 3,
  MID: 5,
  DEF: 5,
};

const POSITION_PRIORITY: Position[] = ["DEF", "MID", "ATT"];
const TEAM_SEQUENCE: TeamId[] = ["team-a", "team-b"];

const buildTeamSlots = (teamId: TeamId): SquadSlot[] => {
  const slots: SquadSlot[] = [];
  (Object.keys(LINE_COUNTS) as Position[]).forEach((position) => {
    const count = LINE_COUNTS[position];
    for (let index = 1; index <= count; index += 1) {
      slots.push({
        id: `${teamId}-${position.toLowerCase()}-${index}`,
        label: `${TEAM_LABELS[teamId]} ${position}`,
        position,
        teamId,
        order: index,
      });
    }
  });
  return slots;
};

export const FORMATION_SLOTS: SquadSlot[] = [
  ...buildTeamSlots("team-a"),
  ...buildTeamSlots("team-b"),
];

export const createEmptyAssignments = (
  slots: SquadSlot[] = FORMATION_SLOTS,
): AssignmentMap => {
  return slots.reduce<AssignmentMap>((acc, slot) => {
    acc[slot.id] = null;
    return acc;
  }, {});
};

const buildBalancedSlotOrder = (slots: SquadSlot[]): SquadSlot[] => {
  const groupedByPosition: Record<Position, Record<TeamId, SquadSlot[]>> = {
    ATT: { "team-a": [], "team-b": [] },
    MID: { "team-a": [], "team-b": [] },
    DEF: { "team-a": [], "team-b": [] },
  };

  slots.forEach((slot) => {
    groupedByPosition[slot.position]?.[slot.teamId]?.push(slot);
  });

  Object.values(groupedByPosition).forEach((teamMap) => {
    TEAM_SEQUENCE.forEach((teamId) => {
      teamMap[teamId]?.sort((a, b) => a.order - b.order);
    });
  });

  const ordered: SquadSlot[] = [];
  POSITION_PRIORITY.forEach((position) => {
    const teamMap = groupedByPosition[position];
    if (!teamMap) {
      return;
    }
    let slotsRemaining = TEAM_SEQUENCE.some((teamId) => teamMap[teamId]?.length);
    while (slotsRemaining) {
      TEAM_SEQUENCE.forEach((teamId) => {
        const queue = teamMap[teamId];
        if (queue && queue.length) {
          ordered.push(queue.shift()!);
        }
      });
      slotsRemaining = TEAM_SEQUENCE.some((teamId) => teamMap[teamId]?.length);
    }
  });

  const seen = new Set(ordered.map((slot) => slot.id));
  slots.forEach((slot) => {
    if (!seen.has(slot.id)) {
      ordered.push(slot);
    }
  });

  return ordered;
};

export const autoAssignPlayers = (
  players: Player[],
  slots: SquadSlot[] = FORMATION_SLOTS,
): AssignmentMap => {
  const availablePlayers = [...players];
  const used = new Set<string>();
  const assignments = createEmptyAssignments(slots);
  const orderedSlots = buildBalancedSlotOrder(slots);

  const claimPlayer = (slot: SquadSlot, predicate: (player: Player) => boolean) => {
    if (assignments[slot.id]) {
      return;
    }
    const matchIndex = availablePlayers.findIndex((player) => {
      return !used.has(player.id) && predicate(player);
    });
    if (matchIndex === -1) {
      return;
    }
    const player = availablePlayers[matchIndex];
    assignments[slot.id] = player.id;
    used.add(player.id);
  };

  orderedSlots.forEach((slot) => claimPlayer(slot, (player) => player.preferredPosition === slot.position));
  orderedSlots.forEach((slot) => claimPlayer(slot, () => true));

  return assignments;
};

export const ensureAssignmentsIntegrity = (
  players: Player[],
  assignments: AssignmentMap,
): AssignmentMap => {
  const validPlayerIds = new Set(players.map((player) => player.id));
  const baseline = createEmptyAssignments();

  Object.entries(baseline).forEach(([slotId]) => {
    const playerId = assignments[slotId];
    if (playerId && validPlayerIds.has(playerId)) {
      baseline[slotId] = playerId;
    }
  });

  return baseline;
};

export const removePlayerFromAssignments = (
  playerId: string,
  assignments: AssignmentMap,
): AssignmentMap => {
  const next: AssignmentMap = { ...assignments };
  Object.entries(assignments).forEach(([slotId, currentId]) => {
    if (currentId === playerId) {
      next[slotId] = null;
    }
  });
  return next;
};

export const swapPlayerIntoSlot = (
  playerId: string,
  slotId: string,
  assignments: AssignmentMap,
): AssignmentMap => {
  const currentSlotEntry = Object.entries(assignments).find(([, id]) => id === playerId);
  const currentSlotId = currentSlotEntry?.[0];
  const displacedPlayerId = assignments[slotId];

  const next = removePlayerFromAssignments(playerId, assignments);
  next[slotId] = playerId;

  if (currentSlotId && displacedPlayerId && currentSlotId !== slotId) {
    next[currentSlotId] = displacedPlayerId;
  }

  return next;
};
