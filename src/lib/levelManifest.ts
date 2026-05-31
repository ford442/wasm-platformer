export type LevelManifestEntry = {
  id: string;
  file: string;
  name?: string;
  description?: string;
  author?: string;
  music?: string;
};

export const DEFAULT_LEVELS: LevelManifestEntry[] = [
  { id: 'test-1', file: 'test-1.json', name: 'Voltage Valley - First Steps' },
];

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isString = (value: unknown): value is string => typeof value === 'string';

export const normalizeLevelManifest = (manifest: unknown): LevelManifestEntry[] => {
  if (!isRecord(manifest) || !Array.isArray(manifest.levels)) return DEFAULT_LEVELS;

  const levels: LevelManifestEntry[] = [];
  for (const item of manifest.levels) {
    if (!isRecord(item)) continue;
    const id = isString(item.id) ? item.id.trim() : '';
    const file = isString(item.file) ? item.file.trim() : '';
    if (!id || !file) continue;

    levels.push({
      id,
      file,
      name: isString(item.name) ? item.name : undefined,
      description: isString(item.description) ? item.description : undefined,
      author: isString(item.author) ? item.author : undefined,
      music: isString(item.music) ? item.music : undefined,
    });
  }

  return levels.length > 0 ? levels : DEFAULT_LEVELS;
};

export const resolveLevelEntry = (levels: LevelManifestEntry[], levelId?: string): LevelManifestEntry => {
  if (levelId) {
    const match = levels.find((entry) => entry.id === levelId);
    if (match) return match;
  }

  return levels[0] ?? DEFAULT_LEVELS[0];
};
