// The photo-based board entry flow (M4): pick a photo → tap the four board
// corners → run core/vision's pipeline → review the proposal + per-cell
// debug data → accept into the entry screen. DOM glue only — all pipeline
// math lives in core/vision. Browser-default UI, no CSS, per the plain-UI
// constraint. The always-visible debug section is deliberate: it is the
// calibration tool for tuning the game's placeholder swatches and margins
// against real photos.

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
  if (!vision || !topology.cellCenterNorm) {
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
      corners: corners as unknown as CornerTaps,
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
    for (const label of ["Cell", "Sampled RGB", "Sampled Lab", "Match", "ΔE", "Runner-up", "ΔE"]) {
      const th = document.createElement("th");
      th.textContent = label;
      header.append(th);
    }
    const fmt = (n: number): string => n.toFixed(1);
    for (const cell of debug) {
      const row = table.insertRow();
      const { rgb, lab, classification } = cell;
      const cells = [
        cell.cellId,
        `${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}`,
        `${fmt(lab.L)}, ${fmt(lab.a)}, ${fmt(lab.b)}`,
        classification.token ?? "(empty)",
        fmt(classification.distance),
        classification.runnerUp ? (classification.runnerUp.token ?? "(empty)") : "—",
        classification.runnerUp ? fmt(classification.runnerUp.distance) : "—",
      ];
      for (const text of cells) {
        row.insertCell().textContent = text;
      }
    }
    return table;
  }

  function render(): void {
    root.replaceChildren();
    root.append(p("Score from photo — pick a photo of the board, then tap its four corners."));
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
          `Tap the ${CORNER_PROMPTS[corners.length]!} corner of the board ` +
            `(${corners.length} of 4 tapped).`,
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
          "Debug — per-cell samples (circles on the photo mark the sample points; " +
            "use this to calibrate swatches and board margins):",
        ),
      );
      root.append(renderDebugTable(proposal.debug));
    }
    return;
  }

  render();
  return root;
}
