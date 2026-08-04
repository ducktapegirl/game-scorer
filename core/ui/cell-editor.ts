// The cell editor extracted from the M2 entry screen so both it and the M5
// photo-correction phase share one editing surface (plan decision 2). Given a
// board and a cell, it renders a token picker (each button applies its
// default stack immediately) and, independently, a stack-choice picker for
// the cell's current top token — driven entirely by the game's stackChoices
// data, so color and height can be corrected in separate passes. Stateless:
// it owns no UI state of its own and reports each pick through onApply.
// Browser-default UI, no CSS.

import type { BoardState, CellId, GameModule, TokenId } from "../types";
import { button } from "./controls";
import { stackAt } from "./entry-state";

export interface CellEditorOptions<B extends BoardState> {
  module: Pick<GameModule<B, never>, "board" | "vision">;
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
        // Default to the game's raw-prediction stack for this token (e.g.
        // Harmonies proposes a building base for red, not bare red), falling
        // back to the first stack choice for games/tokens with no vision
        // data. Lets color be corrected without also committing to a height.
        const defaultStack =
          module.vision?.proposedStack(token.id) ?? module.board.stackChoices(token.id)[0]!.stack;
        onApply(defaultStack);
      }),
      " ",
    );
  }
  tokenButtons.append(button("Empty", () => onApply([])));
  root.append(tokenButtons);

  // The current top token's other stack choices (e.g. green's three
  // heights), shown regardless of which color button was just clicked, so
  // height can be corrected independently in its own pass.
  const topToken = current.at(-1);
  const heightChoices = topToken !== undefined ? module.board.stackChoices(topToken) : [];
  if (heightChoices.length > 1) {
    const heightButtons = document.createElement("p");
    for (const choice of heightChoices) {
      heightButtons.append(button(choice.label, () => onApply(choice.stack)), " ");
    }
    root.append(heightButtons);
  }

  const actions = document.createElement("p");
  if (flagged && onConfirm) actions.append(button("Confirm as-is", onConfirm), " ");
  if (onCancel) actions.append(button("Cancel", onCancel));
  if (actions.childNodes.length > 0) root.append(actions);

  return root;
}
