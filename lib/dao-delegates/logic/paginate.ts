export const DELEGATES_PAGE_SIZE = 50;

export interface Page<T> {
  items: T[];
  page: number;
  totalPages: number;
}

/** Slices one page; an out-of-range `page` is clamped to the nearest valid one. */
export function paginate<T>(items: T[], page: number, pageSize: number): Page<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page: current, totalPages };
}
