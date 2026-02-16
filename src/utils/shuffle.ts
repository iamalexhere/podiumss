export interface ShufflableParticipant {
  id?: number;
  name: string;
  groupId?: number;
}

export interface ShuffledGroup {
  id: number | string;
  name: string;
  color?: string;
  participants: ShufflableParticipant[];
}

export function shuffleIntoGroups(
  names: string[],
  groupCount: number,
  existingGroups?: ShuffledGroup[]
): ShuffledGroup[] {
  const cleanNames = names
    .map((n) => n.trim())
    .filter((n) => n.length > 0);

  if (cleanNames.length === 0) {
    return existingGroups || [];
  }

  const shuffled = [...cleanNames];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const groups: ShuffledGroup[] = existingGroups?.length
    ? existingGroups.map((g) => ({ ...g, participants: [] }))
    : Array.from({ length: groupCount }, (_, i) => ({
        id: `temp-${i}`,
        name: `Team ${i + 1}`,
        participants: [] as ShufflableParticipant[],
      }));

  shuffled.forEach((name, index) => {
    const groupIndex = index % groups.length;
    groups[groupIndex].participants.push({ name });
  });

  return groups;
}

export function moveParticipantBetweenGroups(
  groups: ShuffledGroup[],
  participantName: string,
  fromGroupId: number | string,
  toGroupId: number | string
): ShuffledGroup[] {
  return groups.map((group) => {
    if (group.id === fromGroupId) {
      return {
        ...group,
        participants: group.participants.filter((p) => p.name !== participantName),
      };
    }
    if (group.id === toGroupId) {
      const participant = groups
        .find((g) => g.id === fromGroupId)
        ?.participants.find((p) => p.name === participantName);
      if (participant) {
        return {
          ...group,
          participants: [...group.participants, participant],
        };
      }
    }
    return group;
  });
}

export function generateGroupColors(count: number): string[] {
  const colors = [
    '#ef4444',
    '#f59e0b',
    '#22c55e',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#f97316',
  ];
  return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
}

export function parseNamesFromText(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}

export function validateGroupCount(nameCount: number, groupCount: number): boolean {
  return groupCount >= 1 && groupCount <= Math.max(1, nameCount);
}

export function calculateGroupSizes(totalParticipants: number, groupCount: number): number[] {
  if (groupCount === 0) return [];
  
  const baseSize = Math.floor(totalParticipants / groupCount);
  const remainder = totalParticipants % groupCount;
  
  const sizes: number[] = [];
  for (let i = 0; i < groupCount; i++) {
    sizes.push(baseSize + (i < remainder ? 1 : 0));
  }
  
  return sizes;
}