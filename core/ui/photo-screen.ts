// The photo-based board entry + correction flow (M4/M4.5 vision, M5
// correction): pick a photo → tap the four corner tiles → run core/vision's
// pipeline → CORRECT the proposal in place (tap a green/gray cell to cycle its
// height, long-press or right-click any cell for the full editor, with
// uncertain reads flagged "?") → accept into the entry screen, which scores.
// DOM glue only; all pipeline math lives in core/vision and the geometry in
// core/ui/photo-overlay. Browser-default UI, no CSS, per the plain-UI
// constraint. The debug table (now collapsed) remains the swatch-calibration
// readout.

import type { BoardState, CellId, GameModule, TokenId } from "../types";
import { isUncertain } from "../vision/classify";
import { applyHomography, type Point } from "../vision/homography";
import { proposeBoard, type CellDebug, type CornerTaps, type Proposal } from "../vision/propose";
import { cellLabel, renderBoard } from "./board-view";
import { renderCellEditor } from "./cell-editor";
import { stackAt, withStack } from "./entry-state";
import { cellPolygons, hitTest } from "./photo-overlay";
import { createPressGesture } from "./press-gesture";

// Photos are capped to this long side before sampling — plenty for a 5%-of-
// board-width sample patch, and keeps getImageData cheap on phones.
const MAX_CANVAS_SIDE = 1600;

const CORNER_PROMPTS = ["top-left", "top-right", "bottom-right", "bottom-left"] as const;

// The photo flow needs only the config-independent parts of the module.
type VisualGameModule<B extends BoardState> = Pick<GameModule<B, never>, "id" | "board" | "vision">;

export interface PhotoScreenOptions<B extends BoardState> {
  module: VisualGameModule<B>;
  variant: B["boardSide"];
  onAccept(board: BoardState<B["boardSide"]>): void;
  onCancel(): void;
  onChangeSide(): void;
}

export function renderPhotoScreen<B extends BoardState>(
  opts: PhotoScreenOptions<B>,
): HTMLElement {
  const { module, variant, onAccept, onCancel, onChangeSide } = opts;
  const vision = module.vision;
  const topology = module.board.topology(variant);
  if (!vision || !topology.calibrationCells) {
    throw new Error(`${module.id} does not support photo entry`);
  }
  const depthTokens = new Set<TokenId>(vision.depthTokens ?? []);

  const root = document.createElement("div");
  let bitmap: ImageBitmap | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let corners: Point[] = [];
  // Quarter-turn clockwise rotations applied to the photo before anything
  // else (0/90/180/270). Some cameras store the raster sideways, and the
  // corner prompts assume the user sees the board upright.
  let rotation = 0;
  // Set once "Read board" runs; carries the homography + per-cell debug.
  let proposal: Proposal<B["boardSide"]> | null = null;
  // The board being corrected — starts as a copy of proposal.board, then the
  // user's edits mutate it. Kept separate so the debug data stays pristine.
  let workingBoard: BoardState<B["boardSide"]> | null = null;
  // Cells the classifier was unsure about; a "?" marks them until the user
  // touches or confirms them. Never blocks acceptance.
  let flags = new Set<CellId>();
  // The cell whose full editor is open (via long-press / right-click), if any.
  let editing: CellId | null = null;

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

  // --- correction actions ---------------------------------------------------

  // Tap on a depth token (green/gray): cycle its height through the game's
  // stackChoices (1 → 2 → 3 → 1). Any other cell ignores taps (long-press to
  // edit those). Touching a cell clears its uncertainty flag.
  function tapCell(id: CellId): void {
    if (!workingBoard) return;
    const stack = stackAt(workingBoard, id);
    const top = stack.at(-1);
    if (top === undefined || !depthTokens.has(top)) return;
    const choices = module.board.stackChoices(top);
    if (choices.length <= 1) return;
    const idx = choices.findIndex((c) => c.stack.join(",") === stack.join(","));
    const next = choices[(idx + 1) % choices.length]!;
    workingBoard = withStack(workingBoard, id, next.stack);
    flags.delete(id);
    editing = null;
    render();
  }

  function pressCell(id: CellId): void {
    if (!workingBoard) return;
    editing = id;
    render();
  }

  function applyEdit(stack: TokenId[]): void {
    if (editing === null || !workingBoard) return;
    workingBoard = withStack(workingBoard, editing, stack);
    flags.delete(editing);
    editing = null;
    render();
  }

  function confirmCell(): void {
    if (editing === null) return;
    flags.delete(editing);
    editing = null;
    render();
  }

  // --- gesture plumbing -----------------------------------------------------

  // Wire one tap surface (the photo canvas or the SVG board) to the shared
  // gesture discriminator. The cell under the pointer is resolved at press
  // start and remembered until the gesture resolves.
  function wireGestures(
    el: HTMLElement | SVGElement,
    resolveCell: (e: PointerEvent) => CellId | null,
  ): void {
    let cell: CellId | null = null;
    const gesture = createPressGesture({
      onGesture: (ev) => {
        if (cell === null) return;
        if (ev.type === "tap") tapCell(cell);
        else if (ev.type === "press") pressCell(cell);
      },
    });
    el.addEventListener("pointerdown", (e) => {
      cell = resolveCell(e as PointerEvent);
      gesture.pointerDown(e as PointerEvent);
    });
    el.addEventListener("pointermove", (e) => gesture.pointerMove(e as PointerEvent));
    el.addEventListener("pointerup", () => gesture.pointerUp());
    el.addEventListener("pointercancel", () => gesture.pointerUp());
    el.addEventListener("pointerleave", () => gesture.pointerUp());
    el.addEventListener("contextmenu", (e) => e.preventDefault());
    // Swallow the synthetic click a long press emits so it doesn't double-fire.
    el.addEventListener("click", (e) => {
      if (gesture.shouldSuppressClick()) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }

  function canvasCell(e: PointerEvent): CellId | null {
    if (!workingBoard || !proposal || !canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const point: Point = {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
    return hitTest(cellPolygons(topology, proposal.homography), point);
  }

  function svgCell(e: PointerEvent): CellId | null {
    const target = e.target as Element | null;
    const group = target?.closest("g[data-cell-id]") as SVGGElement | null;
    return group?.dataset.cellId ?? null;
  }

  // --- canvas drawing -------------------------------------------------------

  // Size the canvas for the current rotation and paint the (rotated) photo.
  // Everything downstream — taps, sampling, debug overlays — works in this
  // rotated canvas space, so the vision pipeline never sees the rotation.
  function paintPhoto(): CanvasRenderingContext2D {
    const scale = Math.min(1, MAX_CANVAS_SIDE / Math.max(bitmap!.width, bitmap!.height));
    const sideways = rotation % 180 !== 0;
    canvas!.width = Math.round((sideways ? bitmap!.height : bitmap!.width) * scale);
    canvas!.height = Math.round((sideways ? bitmap!.width : bitmap!.height) * scale);
    // On desktop-sized viewports, cap the displayed height so the photo and
    // the SVG grid both fit on screen; the buffer size above (and thus the
    // vision pipeline's sampling resolution) is untouched.
    const isDesktop = window.matchMedia("(min-width: 900px)").matches;
    canvas!.style.maxHeight = isDesktop ? `${Math.round(canvas!.height * 0.6)}px` : "";
    canvas!.style.width = isDesktop ? "auto" : "";
    const ctx = canvas!.getContext("2d")!;
    ctx.save();
    ctx.translate(canvas!.width / 2, canvas!.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    const drawW = sideways ? canvas!.height : canvas!.width;
    const drawH = sideways ? canvas!.width : canvas!.height;
    ctx.drawImage(bitmap!, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
    return ctx;
  }

  function rotate(quarterTurns: number): void {
    rotation = (rotation + quarterTurns * 90 + 360) % 360;
    // Taps are positions in the old orientation; the corner correspondence
    // changes with it, so restart the tapping step.
    corners = [];
    proposal = null;
    workingBoard = null;
    flags = new Set();
    editing = null;
    render();
  }

  function redrawCanvas(): void {
    if (!canvas || !bitmap) return;
    const ctx = paintPhoto();

    if (!proposal || !workingBoard) {
      // Corner-tap phase: number each tapped corner.
      const markerRadius = Math.max(4, canvas.width / 150);
      for (const [i, corner] of corners.entries()) {
        ctx.beginPath();
        ctx.arc(corner.x, corner.y, markerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = "black";
        ctx.fill();
        ctx.fillText(String(i + 1), corner.x + markerRadius + 2, corner.y);
      }
      return;
    }

    // Correction phase: draw each cell's outline mapped into photo space, its
    // token label, and a "?" on flagged cells (with a heavier outline).
    const polygons = cellPolygons(topology, proposal.homography);
    const stacks = new Map(workingBoard.cells.map((c) => [c.id, c.stack]));
    const baseLine = Math.max(1, canvas.width / 500);
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${Math.max(10, Math.round(canvas.width / 45))}px sans-serif`;
    for (const { cellId, polygon } of polygons) {
      const flagged = flags.has(cellId);
      ctx.beginPath();
      ctx.moveTo(polygon[0]!.x, polygon[0]!.y);
      for (const pt of polygon.slice(1)) ctx.lineTo(pt.x, pt.y);
      ctx.closePath();
      ctx.lineWidth = flagged ? baseLine * 3 : baseLine;
      ctx.stroke();

      const center = applyHomography(proposal.homography, topology.cellCenter(cellId));
      const label = cellLabel(stacks.get(cellId) ?? [], module.board.tokenVocabulary);
      const text = flagged ? (label ? `${label}?` : "?") : label;
      if (text) ctx.fillText(text, center.x, center.y);
    }
  }

  // --- lifecycle ------------------------------------------------------------

  async function loadFile(file: File): Promise<void> {
    bitmap = await createImageBitmap(file);
    canvas = document.createElement("canvas");
    canvas.addEventListener("click", (event) => {
      // Corner-tap capture — inert once four corners are down (result phase).
      if (corners.length >= 4 || !canvas || proposal) return;
      const rect = canvas.getBoundingClientRect();
      corners.push({
        x: ((event.clientX - rect.left) / rect.width) * canvas.width,
        y: ((event.clientY - rect.top) / rect.height) * canvas.height,
      });
      render();
    });
    // The canvas persists across renders, so its gesture listeners are wired
    // once; they no-op until the correction phase (canvasCell returns null).
    wireGestures(canvas, canvasCell);
    corners = [];
    rotation = 0;
    proposal = null;
    workingBoard = null;
    flags = new Set();
    editing = null;
    render();
  }

  function readBoard(): void {
    // Repaint the clean photo first so sampling never reads marker overlays.
    const ctx = paintPhoto();
    const image = ctx.getImageData(0, 0, canvas!.width, canvas!.height);
    proposal = proposeBoard({
      image,
      taps: corners as unknown as CornerTaps,
      topology,
      vocabulary: module.board.tokenVocabulary,
      vision: vision!,
      variant,
    });
    workingBoard = {
      boardSide: proposal.board.boardSide,
      cells: proposal.board.cells.map((c) => ({ id: c.id, stack: [...c.stack] })),
    };
    flags = new Set(
      proposal.debug.filter((d) => isUncertain(d.classification)).map((d) => d.cellId),
    );
    editing = null;
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

  // --- render ---------------------------------------------------------------

  function renderCornerPhase(): void {
    const rotateControls = document.createElement("p");
    rotateControls.append(
      button("Rotate left", () => rotate(-1)),
      " ",
      button("Rotate right", () => rotate(1)),
      " (rotating restarts the corner taps)",
    );
    root.append(rotateControls);

    if (corners.length < 4) {
      root.append(
        p(
          `Rotate the photo until the board is upright, then tap the center of the ` +
            `${CORNER_PROMPTS[corners.length]!} corner tile of the hex grid — the tile ` +
            `itself, or the token sitting on it (${corners.length} of 4 tapped).`,
        ),
      );
    }
    const tapControls = document.createElement("p");
    if (corners.length > 0) {
      tapControls.append(
        button("Undo tap", () => {
          corners.pop();
          render();
        }),
        " ",
        button("Start over", () => {
          corners = [];
          render();
        }),
        " ",
      );
    }
    if (corners.length === 4) {
      tapControls.append(button("Read board", readBoard));
    }
    root.append(tapControls, canvas!);
    redrawCanvas();
  }

  function renderCorrectionPhase(proposed: Proposal<B["boardSide"]>): void {
    root.append(
      p(
        "Correct the board — tap a green or gray cell to cycle its height; " +
          "long-press or right-click any cell to change its color or mark it empty. " +
          'Cells marked "?" were uncertain reads worth a check.',
      ),
    );
    root.append(canvas!);
    redrawCanvas();

    const flagged = [...flags].sort();
    root.append(
      p(flagged.length > 0 ? `Check these cells: ${flagged.join(" · ")}` : "No cells flagged."),
    );

    const svg = renderBoard({
      topology,
      tokens: module.board.tokenVocabulary,
      board: workingBoard!,
      selected: editing,
      onTap: () => {}, // taps handled by the gesture wiring below
    });
    wireGestures(svg, svgCell);
    root.append(svg);

    if (editing !== null) {
      root.append(
        renderCellEditor<BoardState<B["boardSide"]>>({
          module,
          board: workingBoard!,
          cellId: editing,
          flagged: flags.has(editing),
          onApply: applyEdit,
          onConfirm: confirmCell,
          onCancel: () => {
            editing = null;
            render();
          },
        }),
      );
    }

    const accept = document.createElement("p");
    accept.append(button("Use this board", () => onAccept(workingBoard!)));
    root.append(accept);

    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent =
      "Debug — per-cell vote results (Mean RGB feeds swatch recalibration)";
    details.append(summary, renderDebugTable(proposed.debug));
    root.append(details);
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
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (file) void loadFile(file);
    });
    controls.append(input, " ", button("Cancel", onCancel));
    root.append(controls);

    if (!canvas) return;

    if (module.board.variants.length > 1) {
      const sideControls = document.createElement("p");
      sideControls.append(button("Change side", onChangeSide));
      root.append(sideControls);
    }

    if (proposal && workingBoard) {
      renderCorrectionPhase(proposal);
    } else {
      renderCornerPhase();
    }
  }

  render();
  return root;
}
