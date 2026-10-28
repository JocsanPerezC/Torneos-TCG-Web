import { describe, expect, it } from 'vitest';
import { manualParticipantNameConflicts } from './participantNameConflicts';

describe('manualParticipantNameConflicts', () => {
  it('detects a manual participant whose name matches a linked account', () => {
    const conflicts = manualParticipantNameConflicts([
      { id: 'manual', name: 'Ana', active: true, tieBreaker: 1 },
      { id: 'account', name: ' ana ', active: true, tieBreaker: 2, profileId: 'profile-1' },
    ]);

    expect(conflicts.map((player) => player.id)).toEqual(['manual']);
  });

  it('does not flag two different names', () => {
    const conflicts = manualParticipantNameConflicts([
      { id: 'manual', name: 'Ana', active: true, tieBreaker: 1 },
      { id: 'account', name: 'Bruno', active: true, tieBreaker: 2, profileId: 'profile-1' },
    ]);

    expect(conflicts).toEqual([]);
  });
});
