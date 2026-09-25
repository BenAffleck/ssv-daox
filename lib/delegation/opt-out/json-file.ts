import { promises as fs } from 'fs';
import path from 'path';

/**
 * A JSON document on disk with serialized read-modify-write updates.
 * Serialization is per process, which is all the single-instance mock needs.
 */
export function createJsonFile<T>(filePath: string, empty: () => T) {
  let queue: Promise<unknown> = Promise.resolve();

  async function read(): Promise<T> {
    try {
      return JSON.parse(await fs.readFile(filePath, 'utf-8')) as T;
    } catch {
      return empty();
    }
  }

  function update<R>(change: (data: T) => R): Promise<R> {
    const next = queue.then(async () => {
      const data = await read();
      const result = change(data);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return result;
    });
    queue = next.catch(() => undefined);
    return next;
  }

  return { read, update };
}
