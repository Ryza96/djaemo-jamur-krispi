export interface Rankable {
  name: string;
}

export function rankSearch<T extends Rankable>(
  items: T[],
  query: string,
  maxResults: number = 8,
): T[] {
  const q = query.toLowerCase().trim();
  if (!q) return items.slice(0, maxResults);

  const scored = items.map((item) => {
    const name = item.name.toLowerCase();
    let score = 0;

    if (name === q || name.startsWith(q)) {
      score = 100;
    } else if (name.includes(` ${q}`)) {
      score = 80;
    } else if (name.includes(q)) {
      score = 60;
    } else if (q.length >= 3) {
      const prefix3 = q.slice(0, 3);
      if (name.includes(prefix3)) {
        score = 20;
      }
    }

    return { item, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .slice(0, maxResults)
    .map((s) => s.item);
}
