// The cell editor extracted from the M2 entry screen so both it and the M5
// photo-correction phase share one editing surface (plan decision 2). Given a
// board and a cell, it renders the token picker → stack-choice picker → apply,
// driven entirely by the game's stackChoices data. Stateless from the caller's
// side: it owns only the transient "which token is mid-pick" state internally
// and reports the final stack through onApply. Browser-default UI, no CSS.

import type { BoardState, CellId, GameModule, TokenId } from "../types";
import { stackAt } from "./entry-state";

export interface CellEditorOptions<B extends BoardState> {
  module: Pick<GameModule<B, never>, "board">;
  board: B;
  cellId: CellId;
  // A vision-flagged uncertain cell; adds a "Confirm as-is" action.
  flagged?: boolean;
  // Apply a final stack (empty array = clear the cell).
  onApply(stack: TokenId[]): void;
  // Accept a flagged cell unchanged, clearing its flag. Shown only when flagged.
  onConfirm?(): void;
  // Optional back-out without changes; shown as "Cancel" when provided.
  onCancel?(): void;
}

export function renderCellEditor<B extends BoardState>(opts: CellEditorOptions<B>): HTMLElement {
  const { module, board, cellId, flagged, onApply, onConfirm, onCancel } = opts;
  const root = document.createElement("div");
  // Which token the user picked when it offers more than one stack choice
  // (e.g. green heights); null until then. Local because it's mid-gesture UI
  // state, not board state.
  let pendingToken: TokenId | null = null;

  function button(label: string, onClick: () => void): HTMLButtonElement {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  }

  function render(): void {
    root.replaceChildren();

    const current = stackAt(board, cellId);
    const heading = document.createElement("p");
    heading.textContent = `Cell ${cellId} — current: ${
      current.length > 0 ? current.join(", ") + " (bottom to top)" : "empty"
    }`;
    root.append(heading);

    const tokenButtons = document.createElement("p");
    for (const token of module.board.tokenVocabulary) {
      tokenButtons.append(
        button(token.label, () => {
          const choices = module.board.stackChoices(token.id);
          if (choices.length === 1) {
            onApply(choices[0]!.stack);
          } else {
            pendingToken = token.id;
            render();
          }
        }),
        " ",
      );
    }
    tokenButtons.append(button("Empty", () => onApply([])));
    root.append(tokenButtons);

    if (pendingToken !== null) {
      const choiceButtons = document.createElement("p");
      for (const choice of module.board.stackChoices(pendingToken)) {
        choiceButtons.append(button(choice.label, () => onApply(choice.stack)), " ");
      }
      root.append(choiceButtons);
    }

    const actions = document.createElement("p");
    if (flagged && onConfirm) actions.append(button("Confirm as-is", onConfirm), " ");
    if (onCancel) actions.append(button("Cancel", onCancel));
    if (actions.childNodes.length > 0) root.append(actions);
  }

  render();
  return root;
}
