// Renders a ScoreBreakdown as a plain, browser-default table.

import type { ScoreBreakdown } from "../types";

export function renderScore(breakdown: ScoreBreakdown): HTMLTableElement {
  const table = document.createElement("table");
  table.className = "score-table";
  const body = table.createTBody();
  for (const category of breakdown.categories) {
    const row = body.insertRow();
    row.insertCell().textContent = category.label;
    row.insertCell().textContent = String(category.points);
  }
  const totalRow = table.createTFoot().insertRow();
  const totalLabel = document.createElement("th");
  totalLabel.textContent = "Total";
  totalRow.append(totalLabel);
  const totalCell = document.createElement("th");
  totalCell.textContent = String(breakdown.total);
  totalRow.append(totalCell);
  return table;
}
