// The photo-based board entry flow (M4, hardened M4.5): pick a photo → tap
// the centers of the grid's four CORNER TILES → run core/vision's pipeline
// → review the proposal + per-cell debug data → accept into the entry
// screen. DOM glue only — all pipeline math lives in core/vision.
// Browser-default UI, no CSS, per the plain-UI constraint. The
// always-visible debug section is deliberate: it is the calibration tool
// for tuning the game's swatches against real photos.

import type { BoardState, GameModule } from "../types";
import { proposeBoard, type CellDebug, type CornerTaps } from "../vision/propose";
import type { Point } from "../vision/homography";
import { renderBoard } from "./board-view";

// Photos are capped to this long side before sampling — plenty for a 5%-of-
// board-width sample patch, and keeps getImageData cheap on phones.
const MAX_CANVAS_SIDE = 1600;

const CORNER_PROMPTS = [
  "top-left",
  "top-right",
  "bottom-right",
  "bottom-left",
] as const;

// The photo flow needs only the config-independent parts of the module.
type VisualGameModule<B extends BoardState> = Pick<GameModule<B, never>, "id" | "board" | "vision">;

export interface PhotoScreenOptions<B extends BoardState> {
  module: VisualGameModule<B>;
  variant: B["boardSide"];
  onAccept(board: BoardState<B["boardSide"]>): void;
  onCancel(): void;
}

export function renderPhotoScreen<B extends BoardState>(
  opts: PhotoScreenOptions<B>,
): HTMLElement {
  const { module, variant, onAccept, onCancel } = opts;
  const vision = module.vision;
  const topology = module.board.topology(variant);
  if (!vision || !topology.calibrationCells) {
    throw new Error(`${module.id} does not support photo entry`);
  }

  const root = document.createElement("div");
  let bitmap: ImageBitmap | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let corners: Point[] = [];
  let result: { board: BoardState<B["boardSide"]>; debug: CellDebug[] } | null = null;

  function button(label: string, onClick: () => void): HTMLButtonElement {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  }

  function p(text: string): HTMLParagraphElement {
    const el = document.createElement("p");
    el.textContent = text;
    return el;
  }

  function redrawCanvas(): void {
    if (!canvas || !bitmap) return;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const markerRadius = Math.max(4, canvas.width / 150);
    for (const [i, corner] of corners.entries()) {
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, markerRadius, 0, 2 * Math.PI);
      ctx.fillStyle = "black";
      ctx.fill();
      ctx.fillText(String(i + 1), corner.x + markerRadius + 2, corner.y);
    }
    if (result) {
      // Sample-point overlay: where each cell was read — the debug view for
      // tuning the game's margin geometry.
      ctx.strokeStyle = "black";
      for (const cell of result.debug) {
        ctx.beginPath();
        ctx.arc(cell.point.x, cell.point.y, cell.radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  }

  async function loadFile(file: File): Promise<void> {
    bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_CANVAS_SIDE / Math.max(bitmap.width, bitmap.height));
    canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.addEventListener("click", (event) => {
      if (corners.length >= 4 || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      corners.push({
        x: ((event.clientX - rect.left) / rect.width) * canvas.width,
        y: ((event.clientY - rect.top) / rect.height) * canvas.height,
      });
      result = null;
      render();
    });
    corners = [];
    result = null;
    render();
  }

  function readBoard(): void {
    // Repaint the clean photo first so sampling never reads marker overlays.
    const ctx = canvas!.getContext("2d")!;
    ctx.drawImage(bitmap!, 0, 0, canvas!.width, canvas!.height);
    const image = ctx.getImageData(0, 0, canvas!.width, canvas!.height);
    result = proposeBoard({
      image,
      taps: corners as unknown as CornerTaps,
      topology,
      vocabulary: module.board.tokenVocabulary,
      vision: vision!,
      variant,
    });
    render();
  }

  function renderDebugTable(debug: CellDebug[]): HTMLTableElement {
    const table = document.createElement("table");
    table.border = "1";
    const header = table.insertRow();
    const headings = ["Cell", "Match", "Vote %", "Cube %", "Runner-up", "RU %", "Mean RGB", "ΔE"];
    for (const label of headings) {
      const th = document.createElement("th");
      th.textContent = label;
      header.append(th);
    }
    const pct = (n: number): string => `${Math.round(n * 100)}%`;
    for (const cell of debug) {
      const row = table.insertRow();
      const c = cell.classification;
      const cells = [
        cell.cellId,
        c.token ?? "(empty)",
        pct(c.voteShare),
        pct(c.ignoredShare),
        c.runnerUp ? (c.runnerUp.token ?? "(empty)") : "—",
        c.runnerUp ? pct(c.runnerUp.voteShare) : "—",
        `${Math.round(c.meanRgb.r)}, ${Math.round(c.meanRgb.g)}, ${Math.round(c.meanRgb.b)}`,
        c.meanDeltaE.toFixed(1),
      ];
      for (const text of cells) {
        row.insertCell().textContent = text;
      }
    }
    return table;
  }

  function render(): void {
    root.replaceChildren();
    root.append(
      p("Score from photo — pick a photo of the board, then tap the four corner tiles of the hex grid."),
    );
    const controls = document.createElement("p");
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.setAttribute("capture", "environment");
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (file) void loadFile(file);
    });
    controls.append(input, " ", button("Cancel", onCancel));
    root.append(controls);

    if (!canvas) return;

    if (corners.length < 4) {
      root.append(
        p(
          `Tap the center of the ${CORNER_PROMPTS[corners.length]!} corner tile of the hex ` +
            `grid — the tile itself, or the token sitting on it (${corners.length} of 4 tapped).`,
        ),
      );
    }
    const tapControls = document.createElement("p");
    if (corners.length > 0) {
      tapControls.append(
        button("Undo tap", () => {
          corners.pop();
          result = null;
          render();
        }),
        " ",
        button("Start over", () => {
          corners = [];
          result = null;
          render();
        }),
        " ",
      );
    }
    if (corners.length === 4 && !result) {
      tapControls.append(button("Read board", readBoard));
    }
    root.append(tapControls, canvas);
    redrawCanvas();

    if (result) {
      const proposal = result;
      root.append(p(`Proposed board — ${proposal.board.cells.length} cells with tokens:`));
      root.append(
        renderBoard({
          topology,
          tokens: module.board.tokenVocabulary,
          board: proposal.board,
          selected: null,
          onTap: () => {},
        }),
      );
      const accept = document.createElement("p");
      accept.append(button("Use this board", () => onAccept(proposal.board)));
      root.append(accept);
      root.append(
        p(
          "Debug — per-cell vote results (circles on the photo mark the sample patches; " +
            "low Vote % or a close runner-up means an uncertain cell; Mean RGB feeds " +
            "swatch recalibration):",
        ),
      );
      root.append(renderDebugTable(proposal.debug));
    }
    return;
  }

  render();
  return root;
}
