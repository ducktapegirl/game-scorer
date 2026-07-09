// The manual board entry screen, assembled generically for any GameModule:
// blocking variant selector → tappable board → cell editor driven by the
// game's stackChoices data → live score table. This same screen becomes the
// M5 correction surface: the initial board can come from storage today or a
// vision proposal later, and the editing path is identical.

import { clearBoard, clearConfig, loadBoard, loadConfig, saveBoard, saveConfig } from "../storage";
import type { BoardState, CellId, ConfigFieldValue, GameModule, TokenId } from "../types";
import { renderBoard } from "./board-view";
import { renderCellEditor } from "./cell-editor";
import { renderConfig } from "./config-view";
import { button } from "./controls";
import { emptyBoard, validateSavedBoard, validateSavedConfig, withStack } from "./entry-state";
import { renderPhotoScreen } from "./photo-screen";
import { renderScore } from "./score-view";

export function mountEntryScreen<B extends BoardState, C extends Record<string, ConfigFieldValue>>(
  root: HTMLElement,
  module: GameModule<B, C>,
): void {
  let board: B | null = validateSavedBoard<B>(loadBoard(module.id), module.board);
  let config: C =
    validateSavedConfig<C>(loadConfig(module.id), module.configSchema) ?? module.emptyConfig;
  let selected: CellId | null = null;
  let photoMode = false;

  // A single-variant game has nothing to ask; multi-variant games (Harmonies
  // side A / side B) block everything — including score() — on the answer.
  if (board === null && module.board.variants.length === 1) {
    board = emptyBoard<B>(module.board.variants[0]!.id);
  }

  function setBoard(next: B): void {
    board = next;
    saveBoard(module.id, next);
  }

  function setConfig(next: C): void {
    config = next;
    saveConfig(module.id, next);
    render();
  }

  function applyStack(stack: TokenId[]): void {
    setBoard(withStack(board!, selected!, stack));
    selected = null;
    render();
  }

  // Wrap a block of children in a cream card surface.
  function card(...children: (Node | string)[]): HTMLElement {
    const el = document.createElement("div");
    el.className = "card";
    el.append(...children);
    return el;
  }

  function renderVariantPrompt(): HTMLElement[] {
    const prompt = document.createElement("p");
    prompt.textContent =
      "Which side of the board are you playing? Scoring cannot run until this is answered.";
    const buttons = document.createElement("div");
    buttons.className = "row";
    for (const variant of module.board.variants) {
      buttons.append(
        button(
          variant.label,
          () => {
            setBoard(emptyBoard<B>(variant.id));
            render();
          },
          "primary",
        ),
      );
    }
    return [card(prompt, buttons)];
  }

  function renderControls(b: B): HTMLElement {
    const variant = module.board.variants.find((v) => v.id === b.boardSide);
    const heading = document.createElement("p");
    heading.textContent = `Board: ${variant?.label ?? b.boardSide}`;
    const controls = document.createElement("div");
    controls.className = "row";
    if (module.board.variants.length > 1) {
      controls.append(
        button("Change side", () => {
          if (!confirm("Changing the side clears the entered board. Continue?")) return;
          clearBoard(module.id);
          board = null;
          selected = null;
          render();
        }),
      );
    }
    controls.append(
      button("Clear board", () => {
        if (!confirm("Remove all entered tokens?")) return;
        selected = null;
        setBoard(emptyBoard<B>(b.boardSide));
        render();
      }),
    );
    // Photo-based entry (M4) is offered only when the game supplies vision
    // data and calibration reference cells for this variant.
    if (module.vision && module.board.topology(b.boardSide).calibrationCells) {
      controls.append(
        button(
          "Score from photo",
          () => {
            photoMode = true;
            render();
          },
          "primary",
        ),
      );
    }
    return card(heading, controls);
  }

  function renderPhotoMode(b: B): HTMLElement {
    return renderPhotoScreen<B>({
      module,
      variant: b.boardSide,
      onAccept: (proposed) => {
        if (
          b.cells.length > 0 &&
          !confirm("Replace the current board with the photo proposal?")
        ) {
          return;
        }
        photoMode = false;
        selected = null;
        setBoard(proposed as B);
        render();
      },
      onCancel: () => {
        photoMode = false;
        render();
      },
      onChangeSide: () => {
        if (!confirm("Changing the side clears the entered board. Continue?")) return;
        clearBoard(module.id);
        board = null;
        selected = null;
        photoMode = false;
        render();
      },
    });
  }

  function renderEditor(b: B): HTMLElement {
    if (selected === null) {
      const editor = document.createElement("div");
      const hint = document.createElement("p");
      hint.textContent = "Tap a cell to edit it.";
      editor.append(hint);
      return editor;
    }
    return renderCellEditor<B>({
      module,
      board: b,
      cellId: selected,
      onApply: applyStack,
    });
  }

  function renderConfigSection(): HTMLElement {
    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "btn btn--ghost btn--sm";
    clearBtn.textContent = "Clear cards";
    clearBtn.addEventListener("click", () => {
      if (!confirm("Remove all entered cards and options?")) return;
      clearConfig(module.id);
      config = module.emptyConfig;
      render();
    });
    const clear = document.createElement("div");
    clear.className = "row";
    clear.append(clearBtn);
    return card(
      renderConfig({
        schema: module.configSchema,
        config,
        onChange: setConfig,
      }),
      clear,
    );
  }

  function render(): void {
    if (board === null) {
      root.replaceChildren(...renderVariantPrompt());
      return;
    }
    const b = board;
    if (photoMode) {
      root.replaceChildren(renderPhotoMode(b));
      return;
    }
    root.replaceChildren(
      renderControls(b),
      renderBoard({
        topology: module.board.topology(b.boardSide),
        tokens: module.board.tokenVocabulary,
        board: b,
        selected,
        onTap: (id) => {
          selected = id;
          render();
        },
      }),
      renderEditor(b),
      ...(module.configSchema.length > 0 ? [renderConfigSection()] : []),
      card(renderScore(module.score(b, config))),
    );
  }

  render();
}
