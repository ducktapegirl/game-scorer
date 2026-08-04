// The one test that exercises the vision pipeline against real photographs.
// Everything else in the vision suite paints synthetic boards using the same
// swatches it then asserts, which cannot catch a swatch that is wrong for a
// real camera under real light — the exact failure this fixture set exists to
// pin down.
//
// Fixtures are ground truth exported from the correction screen (see
// core/vision/labels.ts). Adding a photo means committing the JPEG to
// resources/ and its labels to resources/fixtures/; no code change.

import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isUncertain } from "../../../core/vision/classify";
import { proposeBoard } from "../../../core/vision/propose";
import { harmonies } from "../index";
import { topology, type BoardSide } from "../topology";
import { loadFixture } from "./photo-fixture";

const PHOTO_DIR = "resources";
const FIXTURE_DIR = "resources/fixtures";

const fixtures = readdirSync(FIXTURE_DIR)
  .filter((name) => name.endsWith(".json"))
  .sort();

// Per-photo minimum. Kept explicit rather than a blanket 100% so a genuinely
// ambiguous cell can be documented instead of silently lowering the bar for
// every photo. These are ratchets: raise one when the pipeline earns it, never
// lower one to make a run go green.
const MIN_CORRECT: Record<string, number> = {
  // The one cell the pipeline still misses anywhere: a lone brown token under
  // warm tungsten, which normalizes to within ~15 ΔE of an empty cream hex and
  // has an animal cube over half of it. A swatch close enough to catch it
  // would start reading genuinely empty hexes as brown, so it is left to the
  // correction UI — `flags every cell it gets wrong` below is what holds that
  // line. This photo scored 18/25 before the illuminant normalization went in
  // (17/25 driving the real app in a browser), with five of the seven misses
  // unflagged.
  "islands3.json": 24,
};

interface Miss {
  cellId: string;
  expected: string;
  actual: string;
}

describe("vision against real photos", () => {
  it("has fixtures to run", () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  for (const name of fixtures) {
    it(`reads ${name} correctly`, () => {
      const { labels, image, taps } = loadFixture(`${FIXTURE_DIR}/${name}`, PHOTO_DIR);
      const side = labels.boardSide as BoardSide;
      const topo = topology(side);

      const { board, debug } = proposeBoard({
        image,
        taps,
        topology: topo,
        vocabulary: harmonies.board.tokenVocabulary,
        vision: harmonies.vision!,
        variant: side,
      });

      const tops = new Map(board.cells.map((c) => [c.id, c.stack.at(-1)!]));
      const misses: Miss[] = [];
      for (const id of topo.cells) {
        const expected = labels.cells[id] ?? "(empty)";
        const actual = tops.get(id) ?? "(empty)";
        if (actual !== expected) misses.push({ cellId: id, expected, actual });
      }

      const correct = topo.cells.length - misses.length;
      const required = MIN_CORRECT[name] ?? topo.cells.length;
      const report = misses
        .map((m) => `  ${m.cellId}: expected ${m.expected}, read ${m.actual}`)
        .join("\n");

      expect(
        correct,
        `${name}: ${correct}/${topo.cells.length} cells correct, needed ${required}\n${report}`,
      ).toBeGreaterThanOrEqual(required);

      // Whatever the classifier gets wrong, the user must at least be pointed
      // at it. A silent miss is worse than a flagged one — it is the only kind
      // that can reach the score sheet unnoticed.
      const flagged = new Set(
        debug.filter((d) => isUncertain(d.classification)).map((d) => d.cellId),
      );
      const unflagged = misses.filter((m) => !flagged.has(m.cellId)).map((m) => m.cellId);
      expect(unflagged, `${name}: wrong cells that were NOT flagged for review`).toEqual([]);
    });
  }
});
