# Board game sorter

Many board games have rather complicated or tedious scoring mechanisms. The concept for this project is to develop a tool to take a picture of a board game's end state and use computer vision to capture the state and automatically score.

## Games supported

To start, I will try this out on Harmonies. This has the added complication that scoring depends on a 3D board configuration.

## To do

### Collect more labelled board photos

The vision classifier is tuned and regression-tested against `resources/fixtures/`, which
currently holds **four boards from two phones** — three from one Pixel in daylight, one
from an iPhone under warm indoor light. That is a thin evidence base, and it is the main
thing limiting further accuracy work.

Why it matters: leave-one-photo-out testing shows swatches derived from three of the
boards score only 12–18/25 on the fourth, i.e. absolute reference colors do not transfer
across cameras at all. The per-photo illuminant normalization added in M4.6 is what makes
them transfer, but every threshold in it (the Minkowski exponent, the per-color weight
cap, the uncertainty bars) was chosen against four boards. A fifth and sixth would tell us
whether those numbers generalize or were fitted to noise.

**What would help most, roughly in order:**

1. **More photos from the iPhone.** Only one board in the set comes from it, and it is the
   camera the classifier finds hardest. It also saves Display P3 rather than sRGB, so it
   exercises the color-management path that nothing else in the set does.
2. **Boards containing brown trunk tokens.** There are exactly two brown cells across all
   four fixtures, and brown is where the one remaining known failure lives (see below).
   Brown appears whenever a trunk is placed without foliage on top, so an early- or
   mid-game board is more likely to show them than a finished one.
3. **A side A board with genuinely empty hexes.** Every side A photo we have is of a full
   board, so `EMPTY_TONES_RGB.A` in `games/harmonies/vision.ts` was measured from pedestal
   slivers between tokens rather than from real empty cells, and has never been validated.
   Side B's equivalent turned out to contain a bad tone that was silently voting occupied
   cells empty; side A very likely has the same problem and no way to prove it.
4. **The same board shot twice under different light** (e.g. daylight then a lamp). This is
   the single most direct test of whether normalization is doing its job — both photos
   should classify identically.
5. **A photo that needs rotating.** All four fixtures have `rotation: 0`, so the app's
   rotate buttons and the harness's rotation handling are only covered by unit tests, never
   against a real photo.
6. **Mid-game boards generally.** Every fixture is a full or nearly full board. A board that
   is mostly bare cream hexes stresses the illuminant estimate hardest, since the board's
   own printed cream can be mistaken for a color cast.

**Known open failure this would help with:** a lone brown trunk under warm tungsten
normalizes to within about 15 ΔE of an empty cream hex, and with an animal cube covering
half the sample patch it currently reads as empty. A reference tone close enough to catch
it would start reading genuinely empty hexes as brown, so it is left flagged for review
instead. More brown examples across more lighting would show whether the two are actually
separable or whether this is a real limit.

**How to add one** (about five minutes per board):

1. Photograph the board roughly top-down, with all four corner tiles of the hex grid
   visible. Keep the **original file** — do not re-save, re-crop or send it through a
   messaging app, which can change both the pixel dimensions and the color profile.
2. `npm run dev`, pick the board side, **Score from photo**, choose the file, tap the four
   corner tiles, **Read board**.
3. Fix anything misread, then expand **"Debug — per-cell vote results"** and press
   **Export labels**. It copies JSON to the clipboard and also shows it in a textarea.
4. Commit the photo to `resources/` and the JSON to `resources/fixtures/`, setting the
   JSON's `image` field to the committed filename. `games/harmonies/tests/real-photos.test.ts`
   picks up new fixtures automatically — no code change needed.
5. Run `npm test`. New fixtures are required to be 100% correct by default; add an entry to
   `MIN_CORRECT` only for a cell that is genuinely ambiguous, and say why.

Those thresholds are ratchets. Raise one when the pipeline earns it; never lower one to
make a run go green.
