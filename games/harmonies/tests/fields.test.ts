import { categoryCells, points, scoreBoard } from "./helpers";

describe("fields", () => {
  it("a lone yellow scores 0", () => {
    const breakdown = scoreBoard("A", [[2, 1, "yellow"]]);
    expect(points(breakdown, "fields")).toBe(0);
    expect(categoryCells(breakdown, "fields")).toEqual([]);
  });

  it("a contiguous pair scores 5", () => {
    expect(
      points(
        scoreBoard("A", [
          [0, 0, "yellow"],
          [0, 1, "yellow"],
        ]),
        "fields",
      ),
    ).toBe(5);
  });

  it("group size beyond 2 does not matter: a group of 5 still scores 5", () => {
    const breakdown = scoreBoard("A", [
      [0, 0, "yellow"],
      [0, 1, "yellow"],
      [0, 2, "yellow"],
      [0, 3, "yellow"],
      [0, 4, "yellow"],
    ]);
    expect(points(breakdown, "fields")).toBe(5);
    expect(categoryCells(breakdown, "fields")).toEqual(["0,0", "0,1", "0,2", "0,3", "0,4"]);
  });

  it("two separate groups score 5 each", () => {
    expect(
      points(
        scoreBoard("A", [
          [0, 0, "yellow"],
          [0, 1, "yellow"],
          [4, 0, "yellow"],
          [4, 1, "yellow"],
        ]),
        "fields",
      ),
    ).toBe(10);
  });

  it("joining two groups with a connecting yellow merges them into one 5", () => {
    const separated = scoreBoard("A", [
      [0, 0, "yellow"],
      [0, 1, "yellow"],
      [0, 3, "yellow"],
      [0, 4, "yellow"],
    ]);
    expect(points(separated, "fields")).toBe(10);

    const merged = scoreBoard("A", [
      [0, 0, "yellow"],
      [0, 1, "yellow"],
      [0, 2, "yellow"],
      [0, 3, "yellow"],
      [0, 4, "yellow"],
    ]);
    expect(points(merged, "fields")).toBe(5);
  });
});
