import { describe, expect, it } from 'vitest';
import { DEFAULT_LEVELS, normalizeLevelManifest, resolveLevelEntry } from '../../src/lib/levelManifest';

describe('levelManifest helpers', () => {
  it('falls back to the default level list', () => {
    expect(normalizeLevelManifest(null)).toEqual(DEFAULT_LEVELS);
  });

  it('normalizes valid manifest entries', () => {
    expect(normalizeLevelManifest({
      levels: [
        { id: 'alpha', file: 'alpha.json', name: 'Alpha', description: 'First', author: 'Team' },
        { id: '', file: 'skip.json' },
      ],
    })).toEqual([
      { id: 'alpha', file: 'alpha.json', name: 'Alpha', description: 'First', author: 'Team', music: undefined },
    ]);
  });

  it('resolves the requested level or falls back to the first entry', () => {
    const levels = normalizeLevelManifest({
      levels: [
        { id: 'alpha', file: 'alpha.json' },
        { id: 'beta', file: 'beta.json' },
      ],
    });

    expect(resolveLevelEntry(levels, 'beta')).toEqual({ id: 'beta', file: 'beta.json', name: undefined, description: undefined, author: undefined, music: undefined });
    expect(resolveLevelEntry(levels, 'missing')).toEqual({ id: 'alpha', file: 'alpha.json', name: undefined, description: undefined, author: undefined, music: undefined });
  });
});
