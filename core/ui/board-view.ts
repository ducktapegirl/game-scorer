// Generic, stateless SVG board renderer. Draws whatever topology a game
// module declares — cells and layout come from BoardTopology, token colors
// from the token vocabulary. SVG geometry attributes only; no stylesheets.

import type { BoardState, BoardTopology, CellId, TokenDef } from "../types";

export interface Point {
  x: number;
  y: number;
}

// Flat-top hexagon corners for a cell whose center-to-corner distance is
// `size`, matching cellCenter's layout units (1.5 per column, √3 per row).
export function hexCorners(center: Point, size = 1): Point[] {
  const corners: Point[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    corners.push({ x: center.x + size * Math.cos(angle), y: center.y + size * Math.sin(angle) });
  }
  return corners;
}

export function squareCorners(center: Point, size = 0.5): Point[] {
  return [
    { x: center.x - size, y: center.y - size },
    { x: center.x + size, y: center.y - size },
    { x: center.x + size, y: center.y + size },
    { x: center.x - size, y: center.y + size },
  ];
}

export function cellCorners(shape: BoardTopology["shape"], center: Point): Point[] {
  // "custom" topologies (irregular region maps) will need game-supplied
  // outlines; no such game exists yet, so a square placeholder marks the
  // region's center rather than guessing a shape.
  return shape === "hex" ? hexCorners(center) : squareCorners(center);
}

const SVG_NS = "http://www.w3.org/2000/svg";
const PX_PER_UNIT = 36;

export interface BoardViewOptions {
  topology: BoardTopology;
  tokens: TokenDef[];
  board: BoardState;
  selected: CellId | null;
  onTap(id: CellId): void;
}

export function renderBoard(opts: BoardViewOptions): SVGSVGElement {
  const { topology, tokens, board, selected, onTap } = opts;
  const tokenById = new Map(tokens.map((t) => [t.id, t]));
  const stacks = new Map(board.cells.map((c) => [c.id, c.stack]));

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const cellShapes = topology.cells.map((id) => {
    const center = topology.cellCenter(id);
    const corners = cellCorners(topology.shape, center);
    for (const p of corners) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    return { id, center, corners };
  });

  const margin = 0.15;
  const svg = document.createElementNS(SVG_NS, "svg");
  const width = maxX - minX + 2 * margin;
  const height = maxY - minY + 2 * margin;
  svg.setAttribute("viewBox", `${minX - margin} ${minY - margin} ${width} ${height}`);
  svg.setAttribute("width", String(Math.round(width * PX_PER_UNIT)));
  svg.setAttribute("height", String(Math.round(height * PX_PER_UNIT)));

  for (const { id, center, corners } of cellShapes) {
    const stack = stacks.get(id) ?? [];
    const top = stack.length > 0 ? tokenById.get(stack[stack.length - 1]!) : undefined;

    const group = document.createElementNS(SVG_NS, "g");
    group.dataset.cellId = id;
    group.addEventListener("click", () => onTap(id));

    const polygon = document.createElementNS(SVG_NS, "polygon");
    polygon.setAttribute("points", corners.map((p) => `${p.x},${p.y}`).join(" "));
    polygon.setAttribute("fill", top?.displayColor ?? "white");
    polygon.setAttribute("stroke", "black");
    polygon.setAttribute("stroke-width", id === selected ? "0.12" : "0.03");
    group.append(polygon);

    if (top) {
      // e.g. "Gn3" = a green-topped stack of height 3; height shown only
      // when the stack is taller than one token.
      const text = document.createElementNS(SVG_NS, "text");
      text.setAttribute("x", String(center.x));
      text.setAttribute("y", String(center.y));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "central");
      text.setAttribute("font-size", "0.7");
      text.textContent = cellLabel(stack, tokens);
      group.append(text);
    }

    svg.append(group);
  }
  return svg;
}

export function cellLabel(stack: readonly string[], tokens: TokenDef[]): string {
  if (stack.length === 0) return "";
  const topId = stack[stack.length - 1]!;
  const abbr = tokens.find((t) => t.id === topId)?.abbr ?? topId.charAt(0).toUpperCase();
  return stack.length > 1 ? `${abbr}${stack.length}` : abbr;
}
