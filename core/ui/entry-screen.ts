// The manual board entry screen, assembled generically for any GameModule:
// blocking variant selector → tappable board → cell editor driven by the
// game's stackChoices data → live score table. This same screen becomes the
// M5 correction surface: the initial board can come from storage today or a
// vision proposal later, and the editing path is identical.

import { clearBoard, clearConfig, loadBoard, loadConfig, saveBoard, saveConfig } from "../storage";
import type { BoardState, CellId, ConfigFieldValue, GameModule, TokenId } from "../types";
import { renderBoard } from "./board-view";
import { renderConfig } from "./config-view";
import { emptyBoard, stackAt, validateSavedBoard, validateSavedConfig, withStack } from "./entry-state";
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
  let pendingToken: TokenId | null = null;
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
    pendingToken = null;
    render();
  }

  function button(label: string, onClick: () => void): HTMLButtonElement {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  }

  function renderVariantPrompt(): HTMLElement[] {
    const prompt = document.createElement("p");
    prompt.textContent =
      "Which side of the board are you playing? Scoring cannot run until this is answered.";
    const buttons = document.createElement("p");
    for (const variant of module.board.variants) {
      buttons.append(
        button(variant.label, () => {
          setBoard(emptyBoard<B>(variant.id));
          render();
        }),
        " ",
      );
    }
    return [prompt, buttons];
  }

  function renderControls(b: B): HTMLElement {
    const controls = document.createElement("p");
    const variant = module.board.variants.find((v) => v.id === b.boardSide);
    controls.append(`Board: ${variant?.label ?? b.boardSide} `);
    if (module.board.variants.length > 1) {
      controls.append(
        button("Change side", () => {
          if (!confirm("Changing the side clears the entered board. Continue?")) return;
          clearBoard(module.id);
          board = null;
          selected = null;
          pendingToken = null;
          render();
        }),
        " ",
      );
    }
    controls.append(
      button("Clear board", () => {
        if (!confirm("Remove all entered tokens?")) return;
        selected = null;
        pendingToken = null;
        setBoard(emptyBoard<B>(b.boardSide));
        render();
      }),
    );
    // Photo-based entry (M4) is offered only when the game supplies vision
    // data and calibration reference cells for this variant.
    if (module.vision && module.board.topology(b.boardSide).calibrationCells) {
      controls.append(
        " ",
        button("Score from photo", () => {
          photoMode = true;
          render();
        }),
      );
    }
    return controls;
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
        pendingToken = null;
        setBoard(proposed as B);
        render();
      },
      onCancel: () => {
        photoMode = false;
        render();
      },
    });
  }

  function renderEditor(b: B): HTMLElement {
    const editor = document.createElement("div");
    if (selected === null) {
      const hint = document.createElement("p");
      hint.textContent = "Tap a cell to edit it.";
      editor.append(hint);
      return editor;
    }

    const current = stackAt(b, selected);
    const heading = document.createElement("p");
    heading.textContent = `Cell ${selected} — current: ${
      current.length > 0 ? current.join(", ") + " (bottom to top)" : "empty"
    }`;
    editor.append(heading);

    const tokenButtons = document.createElement("p");
    for (const token of module.board.tokenVocabulary) {
      tokenButtons.append(
        button(token.label, () => {
          const choices = module.board.stackChoices(token.id);
          if (choices.length === 1) {
            applyStack(choices[0]!.stack);
          } else {
            pendingToken = token.id;
            render();
          }
        }),
        " ",
      );
    }
    tokenButtons.append(button("Empty", () => applyStack([])));
    editor.append(tokenButtons);

    if (pendingToken !== null) {
      const choiceButtons = document.createElement("p");
      for (const choice of module.board.stackChoices(pendingToken)) {
        choiceButtons.append(button(choice.label, () => applyStack(choice.stack)), " ");
      }
      editor.append(choiceButtons);
    }
    return editor;
  }

  function renderConfigSection(): HTMLElement {
    const section = document.createElement("div");
    section.append(
      renderConfig({
        schema: module.configSchema,
        config,
        onChange: setConfig,
      }),
    );
    const clear = document.createElement("p");
    clear.append(
      button("Clear cards", () => {
        if (!confirm("Remove all entered cards and options?")) return;
        clearConfig(module.id);
        config = module.emptyConfig;
        render();
      }),
    );
    section.append(clear);
    return section;
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
          pendingToken = null;
          render();
        },
      }),
      renderEditor(b),
      ...(module.configSchema.length > 0 ? [renderConfigSection()] : []),
      renderScore(module.score(b, config)),
    );
  }

  render();
}
