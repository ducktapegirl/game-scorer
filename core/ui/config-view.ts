// Generic, stateless config form: renders whatever field types a game
// declares in its ConfigSchema and reports edits through onChange. The game
// module supplies only data (schema + catalogs); no game writes UI code.
// Plain browser-default HTML throughout — no CSS.

import type { ConfigFieldValue, ConfigSchema, CounterEntry } from "../types";

export interface ConfigViewProps<C extends Record<string, ConfigFieldValue>> {
  schema: ConfigSchema;
  config: C;
  onChange(next: C): void;
}

export function renderConfig<C extends Record<string, ConfigFieldValue>>(
  props: ConfigViewProps<C>,
): HTMLElement {
  const { schema, config, onChange } = props;
  const root = document.createElement("div");
  const set = (id: string, value: ConfigFieldValue) => onChange({ ...config, [id]: value });

  for (const field of schema) {
    if (field.type === "picker") {
      const p = document.createElement("p");
      const label = document.createElement("label");
      label.append(`${field.label}: `);
      const select = document.createElement("select");
      select.className = "select";
      for (const option of field.options) {
        const o = document.createElement("option");
        o.value = option.id;
        o.textContent = option.label;
        select.append(o);
      }
      select.value = config[field.id] as string;
      select.addEventListener("change", () => set(field.id, select.value));
      label.append(select);
      p.append(label);
      root.append(p);
    } else if (field.type === "counterList") {
      root.append(renderCounterList(field, (config[field.id] as CounterEntry[]) ?? [], set));
    } else {
      const p = document.createElement("p");
      const label = document.createElement("label");
      label.className = "checkbox";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = config[field.id] === true;
      checkbox.addEventListener("change", () => set(field.id, checkbox.checked));
      label.append(checkbox, ` ${field.label}`);
      p.append(label);
      root.append(p);
    }
  }
  return root;
}

// An add-from-catalog list: a select of not-yet-added items + "Add", then one
// row per added entry with −/+ count buttons (clamped to 0..max) and Remove.
function renderCounterList(
  field: Extract<ConfigSchema[number], { type: "counterList" }>,
  entries: CounterEntry[],
  set: (id: string, value: ConfigFieldValue) => void,
): HTMLElement {
  const container = document.createElement("div");
  const heading = document.createElement("p");
  heading.textContent = `${field.label}:`;
  container.append(heading);

  const items = new Map(field.items.map((i) => [i.id, i]));
  const update = (next: CounterEntry[]) => set(field.id, next);

  const list = document.createElement("ul");
  for (const entry of entries) {
    const item = items.get(entry.id);
    const li = document.createElement("li");
    li.append(`${item?.label ?? entry.id} — cubes: `);

    const minus = document.createElement("button");
    minus.type = "button";
    minus.className = "btn btn--ghost btn--sm";
    minus.textContent = "−";
    minus.disabled = entry.count <= 0;
    minus.addEventListener("click", () =>
      update(entries.map((e) => (e.id === entry.id ? { ...e, count: e.count - 1 } : e))),
    );

    const plus = document.createElement("button");
    plus.type = "button";
    plus.className = "btn btn--ghost btn--sm";
    plus.textContent = "+";
    plus.disabled = item?.max !== undefined && entry.count >= item.max;
    plus.addEventListener("click", () =>
      update(entries.map((e) => (e.id === entry.id ? { ...e, count: e.count + 1 } : e))),
    );

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn btn--ghost btn--sm";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => update(entries.filter((e) => e.id !== entry.id)));

    li.append(minus, ` ${entry.count} `, plus, " ", remove);
    list.append(li);
  }
  container.append(list);

  // Checkbox-grid adder: tick any number of not-yet-added items and "Add
  // selected" adds them all at once (each starting at count 0; counts are then
  // set per row above). The grid lays checkboxes across the available width.
  const available = field.items.filter((i) => !entries.some((e) => e.id === i.id));
  const adder = document.createElement("div");

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(12em, 1fr))";
  const boxes: HTMLInputElement[] = [];
  for (const item of available) {
    const label = document.createElement("label");
    label.className = "checkbox";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = item.id;
    label.append(checkbox, ` ${item.label}`);
    grid.append(label);
    boxes.push(checkbox);
  }
  container.append(grid);

  const buttonRow = document.createElement("div");
  buttonRow.className = "button-group";
  const add = document.createElement("button");
  add.type = "button";
  add.className = "btn btn--ghost btn--block";
  add.textContent = "Add selected";
  add.disabled = available.length === 0;
  add.addEventListener("click", () => {
    const chosen = boxes.filter((b) => b.checked).map((b) => b.value);
    if (chosen.length > 0) {
      update([...entries, ...chosen.map((id) => ({ id, count: 0 }))]);
    }
  });
  buttonRow.append(add);
  adder.append(grid, buttonRow);
  container.append(adder);

  return container;
}
