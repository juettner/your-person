#!/usr/bin/env node
/**
 * Turns the HandDrawnFont stroke artwork (Grug Hand, by Jip van der Velde and
 * Michel Elings) into the compact JSON the app ships in
 * `src/handwriting/grug-hand.json`.
 *
 * Why a build step: the upstream file is ~480 KB of UUIDs and 16-digit floats.
 * We drop the ids, store points as integers in a 0..1000 grid, and simplify
 * each stroke with Ramer-Douglas-Peucker. The result is ~10x smaller and
 * draws identically at phone sizes.
 *
 * Usage:
 *   git clone https://github.com/jipvandervelde/HandDrawnFont /tmp/HandDrawnFont
 *   node scripts/build-typeface.mjs /tmp/HandDrawnFont/Sources/HandDrawnFont/Resources/hand-drawn-typeface.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const GRID = 1000; // points are stored as integers on a 1000 x 1000 grid
const EPSILON = 1.5; // RDP tolerance in grid units (~0.6 canvas px of a 400-wide canvas)

const [, , sourcePath] = process.argv;
if (!sourcePath) {
  console.error('usage: build-typeface.mjs <hand-drawn-typeface.json>');
  process.exit(1);
}

const source = JSON.parse(readFileSync(sourcePath, 'utf8'));

/** Ramer-Douglas-Peucker: keep the points that matter, drop the ones on a straight-ish line. */
function simplify(points, epsilon) {
  if (points.length < 3) return points;
  const [first] = points;
  const last = points[points.length - 1];
  let maxDistance = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const d = perpendicularDistance(points[i], first, last);
    if (d > maxDistance) {
      maxDistance = d;
      index = i;
    }
  }
  if (maxDistance <= epsilon) return [first, last];
  const left = simplify(points.slice(0, index + 1), epsilon);
  const right = simplify(points.slice(index), epsilon);
  return [...left.slice(0, -1), ...right];
}

function perpendicularDistance(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / length;
}

const round = (v) => Math.round(v * GRID);

const glyphs = source.glyphs
  .filter((g) => g.key.length === 1) // letters, digits, punctuation; skip named icons
  .map((g) => {
    const m = g.metrics;
    const strokes = g.strokes
      .map((s) => simplify(s.points.map((p) => ({ x: round(p.x), y: round(p.y) })), EPSILON))
      .filter((pts) => pts.length > 1)
      .map((pts) => pts.flatMap((p) => [p.x, p.y]));
    return {
      k: g.key,
      v: g.variationIndex,
      b: [round(m.boundsX), round(m.boundsY), round(m.boundsWidth), round(m.boundsHeight)],
      bl: round(m.boundsY + m.baselineY), // baseline as an absolute canvas position
      xh: round(m.boundsY + m.xHeightY), // x-height, same
      s: strokes,
    };
  })
  .sort((a, b) => (a.k === b.k ? a.v - b.v : a.k < b.k ? -1 : 1));

const canvas = source.glyphs[0];
const out = {
  attribution: 'Grug Hand drawings by Jip van der Velde and Michel Elings at Ocho. https://handdrawn.software',
  license: 'Apache-2.0 with Commons Clause. See assets/fonts/LICENSE and NOTICE.',
  grid: GRID,
  canvas: [canvas.canvasWidth, canvas.canvasHeight],
  glyphs,
};

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, '../src/handwriting/grug-hand.json');
writeFileSync(target, JSON.stringify(out));

const points = glyphs.reduce((n, g) => n + g.s.reduce((m, s) => m + s.length / 2, 0), 0);
console.log(`wrote ${target}: ${glyphs.length} glyphs, ${points} points, ${(JSON.stringify(out).length / 1024).toFixed(0)} KB`);
