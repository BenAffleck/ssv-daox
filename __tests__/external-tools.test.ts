import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { externalTools, getExternalToolsSorted } from '@/lib/data/external-tools';
import { ExternalToolCategory } from '@/lib/types';
import { externalToolSchema, parseExternalTool } from '@/lib/external-tool.schema';

const DATA_DIR = join(process.cwd(), 'data', 'external-tools');
const toolFiles = readdirSync(DATA_DIR)
  .filter((f) => f.endsWith('.json'))
  .sort();

describe('external-tools JSON sources', () => {
  it('has at least one tool JSON file', () => {
    expect(toolFiles.length).toBeGreaterThan(0);
  });

  it('every JSON file passes the zod schema', () => {
    toolFiles.forEach((file) => {
      const raw = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8'));
      const result = externalToolSchema.safeParse(raw);
      expect(result.success, `${file}: ${result.error?.toString()}`).toBe(true);
    });
  });

  it('every filename matches its id', () => {
    toolFiles.forEach((file) => {
      const raw = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8'));
      expect(file).toBe(`${raw.id}.json`);
    });
  });

  it('the generated catalog is in sync with the JSON sources (run `npm run gen:tools`)', () => {
    const fromJson = toolFiles.map((file, index) =>
      parseExternalTool(JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8')), index),
    );
    const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);
    expect([...externalTools].sort(byId)).toEqual([...fromJson].sort(byId));
  });
});

describe('external-tools data', () => {
  describe('externalTools array', () => {
    it('contains at least one tool', () => {
      expect(externalTools.length).toBeGreaterThan(0);
    });

    it('all tools have required fields', () => {
      externalTools.forEach((tool) => {
        expect(tool.id).toBeTruthy();
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.host).toBeTruthy();
        expect(tool.url).toBeTruthy();
        expect(tool.inputs).toBeTruthy();
        expect(tool.outputs).toBeTruthy();
        expect(Array.isArray(tool.categories)).toBe(true);
        expect(tool.categories.length).toBeGreaterThan(0);
        expect(typeof tool.sortOrder).toBe('number');
      });
    });

    it('all tools have valid URLs', () => {
      externalTools.forEach((tool) => {
        expect(() => new URL(tool.url)).not.toThrow();
      });
    });

    it('all tools have unique IDs', () => {
      const ids = externalTools.map((tool) => tool.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('all categories are valid enum members', () => {
      const allowed = new Set(Object.values(ExternalToolCategory));
      externalTools.forEach((tool) => {
        tool.categories.forEach((cat) => {
          expect(allowed.has(cat)).toBe(true);
        });
      });
    });
  });

  describe('getExternalToolsSorted', () => {
    it('returns a copy of the array', () => {
      const sorted = getExternalToolsSorted();
      expect(sorted).not.toBe(externalTools);
    });

    it('does not mutate the original array', () => {
      const originalIds = externalTools.map((t) => t.id);
      getExternalToolsSorted();
      expect(externalTools.map((t) => t.id)).toEqual(originalIds);
    });

    it('pins featured tools to the top regardless of sortOrder', () => {
      const sorted = getExternalToolsSorted();
      const firstNonFeaturedIdx = sorted.findIndex((t) => !t.featured);
      // every featured tool appears before any non-featured one
      sorted.forEach((tool, idx) => {
        if (tool.featured) {
          expect(idx).toBeLessThan(firstNonFeaturedIdx === -1 ? sorted.length : firstNonFeaturedIdx);
        }
      });
    });

    it('orders by sortOrder ascending within the featured and non-featured groups', () => {
      const sorted = getExternalToolsSorted();
      const featured = sorted.filter((t) => t.featured);
      const rest = sorted.filter((t) => !t.featured);

      for (let i = 1; i < featured.length; i++) {
        expect(featured[i].sortOrder).toBeGreaterThanOrEqual(featured[i - 1].sortOrder);
      }
      for (let i = 1; i < rest.length; i++) {
        expect(rest[i].sortOrder).toBeGreaterThanOrEqual(rest[i - 1].sortOrder);
      }
    });
  });
});
