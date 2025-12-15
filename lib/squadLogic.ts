import type { Player, Position } from "@/types/player";
import type { AssignmentMap, SquadSlot, TeamId } from "@/types/squad";

export const TEAM_LABELS: Record<TeamId, string> = {
  "team-a": "White Team",
  "team-b": "Black Team",
};

const LINE_COUNTS: Record<Position, number> = {
  ATT: 5,
  MID: 5,
  DEF: 5,
};

const POSITION_PRIORITY: Position[] = ["DEF", "MID", "ATT"];
const TEAM_SEQUENCE: TeamId[] = ["team-a", "team-b"];

const buildSymmetricIndexSequence = (count: number): number[] => {
  if (count <= 0) {
    return [];
  }
  const indexes: number[] = [];
  if (count % 2 === 1) {
    const center = Math.floor(count / 2);
    indexes.push(center);
    for (let offset = 1; indexes.length < count; offset += 1) {
      const left = center - offset;
      const right = center + offset;
      if (left >= 0) {
        indexes.push(left);
      }
      if (right < count) {
        indexes.push(right);
      }
    }
  } else {
    const rightCenter = count / 2;
    const leftCenter = rightCenter - 1;
    for (let offset = 0; indexes.length < count; offset += 1) {
      const left = leftCenter - offset;
      const right = rightCenter + offset;
      if (left >= 0) {
        indexes.push(left);
      }
      if (right < count) {
        indexes.push(right);
      }
    }
  }
  return indexes;
};

const getVisualFillOrder = (playersCount: number): number[] => {
  if (playersCount <= 0) {
    return [];
  }
  const oddOrder = [2, 1, 3, 0, 4];
  const evenOrder = [1, 3, 0, 4];
  const order = playersCount % 2 === 1 ? oddOrder : evenOrder;
  return order.slice(0, Math.min(playersCount, order.length));
};

const applyVisualSymmetryToAssignments = (
  assignments: AssignmentMap,
  slots: SquadSlot[],
): AssignmentMap => {
  const grouped: Record<string, SquadSlot[]> = {};
  slots.forEach((slot) => {
    const key = `${slot.teamId}-${slot.position}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(slot);
  });

  Object.values(grouped).forEach((groupSlots) => {
    if (!groupSlots.length) {
      return;
    }
    const sortedSlots = [...groupSlots].sort((a, b) => a.order - b.order);
    const assignedPlayers = sortedSlots
      .map((slot) => assignments[slot.id])
      .filter((playerId): playerId is string => Boolean(playerId));
    if (!assignedPlayers.length) {
      return;
    }
    const fillOrder = getVisualFillOrder(assignedPlayers.length);
    sortedSlots.forEach((slot) => {
      assignments[slot.id] = null;
    });
    fillOrder.forEach((slotIndex, idx) => {
      const playerId = assignedPlayers[idx];
      if (playerId && sortedSlots[slotIndex]) {
        assignments[sortedSlots[slotIndex].id] = playerId;
      }
    });
  });

  return assignments;
};

const orderSlotsForVisualSymmetry = (slots: SquadSlot[]): SquadSlot[] => {
  if (!slots.length) {
    return [];
  }
  const sortedByOrder = [...slots].sort((a, b) => a.order - b.order);
  const symmetricOrder = buildSymmetricIndexSequence(sortedByOrder.length);
  return symmetricOrder.map((index) => sortedByOrder[index]);
};

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
      const queue = teamMap[teamId];
      if (queue) {
        teamMap[teamId] = orderSlotsForVisualSymmetry(queue);
      }
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

type AutoAssignOptions = {
  allowRebalanceWhenAllAssigned?: boolean;
};

export const autoAssignPlayers = (
  players: Player[],
  slots: SquadSlot[] = FORMATION_SLOTS,
  options: AutoAssignOptions = {},
): AssignmentMap => {
  const { allowRebalanceWhenAllAssigned = false } = options;
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

  orderedSlots.forEach((slot) => {
    claimPlayer(slot, (player) => player.preferredPosition === slot.position);
  });

  const counts: Record<TeamId, number> = { "team-a": 0, "team-b": 0 };
  const slotMap = slots.reduce<Record<string, SquadSlot>>((acc, slot) => {
    acc[slot.id] = slot;
    return acc;
  }, {});

  Object.entries(assignments).forEach(([slotId, playerId]) => {
    if (!playerId) {
      return;
    }
    const slot = slotMap[slotId];
    if (slot) {
      counts[slot.teamId] += 1;
    }
  });

  const getDiff = () => Math.abs(counts["team-a"] - counts["team-b"]);
  const totalPlayersAssigned = counts["team-a"] + counts["team-b"];

  const findAssignedSlot = (teamId: TeamId) => {
    return [...orderedSlots].reverse().find((slot) => slot.teamId === teamId && assignments[slot.id]);
  };

  const findEmptySlot = (teamId: TeamId, position?: Position) => {
    return orderedSlots.find((slot) => {
      if (slot.teamId !== teamId || assignments[slot.id]) {
        return false;
      }
      if (position && slot.position !== position) {
        return false;
      }
      return true;
    });
  };

  const rebalanceTeamCounts = (fromTeam: TeamId, toTeam: TeamId): boolean => {
    const slotToAdjust = findAssignedSlot(fromTeam);
    if (!slotToAdjust) {
      return false;
    }
    const playerId = assignments[slotToAdjust.id];
    if (!playerId) {
      return false;
    }

    if (allowRebalanceWhenAllAssigned) {
      const emptySlot = findEmptySlot(toTeam, slotToAdjust.position);
      if (emptySlot) {
        assignments[emptySlot.id] = playerId;
        assignments[slotToAdjust.id] = null;
        counts[fromTeam] -= 1;
        counts[toTeam] += 1;
        return true;
      }
    }

    assignments[slotToAdjust.id] = null;
    counts[fromTeam] -= 1;
    return true;
  };

  // If all players are assigned, don't unassign to balance unless allowed
  if (totalPlayersAssigned === players.length && !allowRebalanceWhenAllAssigned) {
    return applyVisualSymmetryToAssignments(assignments, slots);
  }

  if (getDiff() <= 1) {
    return applyVisualSymmetryToAssignments(assignments, slots);
  }

  // If total players is even, aim for exact split
  if (totalPlayersAssigned % 2 === 0) {
    const targetPerTeam = totalPlayersAssigned / 2;
    while (counts["team-a"] > targetPerTeam) {
      if (!rebalanceTeamCounts("team-a", "team-b")) {
        break;
      }
    }
    while (counts["team-b"] > targetPerTeam) {
      if (!rebalanceTeamCounts("team-b", "team-a")) {
        break;
      }
    }
  } else {
    // If total players is odd, allow 1 player difference
    while (getDiff() > 1) {
      const majority: TeamId = counts["team-a"] > counts["team-b"] ? "team-a" : "team-b";
      const minority: TeamId = majority === "team-a" ? "team-b" : "team-a";
      if (!rebalanceTeamCounts(majority, minority)) {
        break;
      }
    }
  }

  return applyVisualSymmetryToAssignments(assignments, slots);
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
