// Pure graph helpers over (cells, neighbors). Game-agnostic: fields,
// mountain adjacency, islands, and rivers are all connected-component
// problems on whatever adjacency a game's topology defines.

import type { CellId } from "./types";

export type Neighbors = (id: CellId) => CellId[];

/**
 * Connected components of `cells` under `neighbors`, restricted to `cells`
 * (neighbors outside the given set are ignored).
 */
export function connectedComponents(cells: CellId[], neighbors: Neighbors): CellId[][] {
  const inSet = new Set(cells);
  const seen = new Set<CellId>();
  const components: CellId[][] = [];

  for (const start of cells) {
    if (seen.has(start)) continue;
    const component: CellId[] = [];
    const queue: CellId[] = [start];
    seen.add(start);
    while (queue.length > 0) {
      const cell = queue.shift()!;
      component.push(cell);
      for (const n of neighbors(cell)) {
        if (inSet.has(n) && !seen.has(n)) {
          seen.add(n);
          queue.push(n);
        }
      }
    }
    components.push(component);
  }
  return components;
}

/**
 * BFS shortest-path distances (in edges) from `start` to every reachable
 * cell of `cells`.
 */
export function shortestPathDistances(
  start: CellId,
  cells: CellId[],
  neighbors: Neighbors,
): Map<CellId, number> {
  const inSet = new Set(cells);
  const dist = new Map<CellId, number>([[start, 0]]);
  const queue: CellId[] = [start];
  while (queue.length > 0) {
    const cell = queue.shift()!;
    const d = dist.get(cell)!;
    for (const n of neighbors(cell)) {
      if (inSet.has(n) && !dist.has(n)) {
        dist.set(n, d + 1);
        queue.push(n);
      }
    }
  }
  return dist;
}

/**
 * The component's "token diameter": the number of cells along the longest
 * shortest path between any two cells of the component (nodes, not edges).
 * A single cell has diameter 1. This is the river-length rule: a branching
 * or looping river is measured end-to-end, not by token count.
 */
export function componentTokenDiameter(component: CellId[], neighbors: Neighbors): number {
  let best = 0;
  for (const start of component) {
    const dist = shortestPathDistances(start, component, neighbors);
    for (const d of dist.values()) {
      if (d > best) best = d;
    }
  }
  return best + 1;
}
