#!/usr/bin/env node
/**
 * Turns a single-line SVG font into the compact JSON the app ships in
 * `YourPerson/Resources/typeface.json`.
 *
 * A single-line (or "stroke") font is a font where each glyph is the path a
 * pen takes, not the outline of a filled shape. They were made for pen
 * plotters and engravers, which is exactly what we need: to animate a letter
 * being written you draw its path from the start up to a growing length.
 *
 * The app uses EMS Allure, a single-line version of Allura (Rob Leuschke)
 * made by Sheldon B. Michaels and Windell H. Oskay, SIL Open Font License.
 * It ships with Inkscape's Hershey Text extension:
 *   https://gitlab.com/inkscape/extensions/-/tree/master/svg_fonts
 *
 * Usage:
 *   node scripts/build-typeface.mjs /path/to/EMSAllure.svg
 *
 * What it does: parses each <glyph>, flattens curves into short line
 * segments, flips y so it points down like on screen, rounds to integers in
 * font units, and simplifies each stroke with Ramer-Douglas-Peucker.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const EPSILON = 1.5; // RDP tolerance in font units (1000 per em)
const CURVE_STEPS = 10;

const [, , sourcePath] = process.argv;
if (!sourcePath) {
  console.error('usage: build-typeface.mjs <font.svg>');
  process.exit(1);
}
const svg = readFileSync(sourcePath, 'utf8');

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : undefined;
};
const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const fontTag = svg.match(/<font\b[^>]*>/)[0];
const faceTag = svg.match(/<font-face\b[^>]*>/)[0];
const name = attr(faceTag, 'font-family');
const upm = Number(attr(faceTag, 'units-per-em') ?? 1000);
const ascent = Number(attr(faceTag, 'ascent') ?? 800);
const descent = Number(attr(faceTag, 'descent') ?? -200);
const xHeight = Number(attr(faceTag, 'x-height') ?? 500);
const capHeight = Number(attr(faceTag, 'cap-height') ?? 700);
const defaultAdvance = Number(attr(fontTag, 'horiz-adv-x') ?? upm / 2);

/** Parses SVG path data (M/L/C/Q/Z, absolute or relative) into polylines, one per pen-down. */
function pathToStrokes(d) {
  const tokens = d.match(/[MLHVCSQTAZmlhvcsqtaz]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const strokes = [];
  let current = null;
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let cmd = '';
  let i = 0;
  const num = () => Number(tokens[i++]);
  const begin = (px, py) => {
    current = [px, py];
    strokes.push(current);
    startX = px;
    startY = py;
  };
  const line = (px, py) => {
    if (!current) begin(x, y);
    current.push(px, py);
  };
  const cubic = (x1, y1, x2, y2, px, py) => {
    for (let s = 1; s <= CURVE_STEPS; s += 1) {
      const t = s / CURVE_STEPS;
      const mt = 1 - t;
      line(
        mt * mt * mt * x + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * px,
        mt * mt * mt * y + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * py,
      );
    }
  };
  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase();
    const dx = rel ? x : 0;
    const dy = rel ? y : 0;
    switch (cmd.toUpperCase()) {
      case 'M': {
        x = num() + dx;
        y = num() + dy;
        begin(x, y);
        cmd = rel ? 'l' : 'L'; // further pairs after M are implicit lineto
        break;
      }
      case 'L': {
        x = num() + dx;
        y = num() + dy;
        line(x, y);
        break;
      }
      case 'H': {
        x = num() + dx;
        line(x, y);
        break;
      }
      case 'V': {
        y = num() + dy;
        line(x, y);
        break;
      }
      case 'C': {
        const x1 = num() + dx, y1 = num() + dy, x2 = num() + dx, y2 = num() + dy, px = num() + dx, py = num() + dy;
        cubic(x1, y1, x2, y2, px, py);
        x = px;
        y = py;
        break;
      }
      case 'Q': {
        const qx = num() + dx, qy = num() + dy, px = num() + dx, py = num() + dy;
        cubic(x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y), px + (2 / 3) * (qx - px), py + (2 / 3) * (qy - py), px, py);
        x = px;
        y = py;
        break;
      }
      case 'Z': {
        line(startX, startY);
        x = startX;
        y = startY;
        current = null;
        break;
      }
      default:
        throw new Error(`unsupported path command ${cmd}`);
    }
  }
  return strokes;
}

function simplify(points, epsilon) {
  if (points.length < 3) return points;
  const first = points[0];
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
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.hypot(dx, dy);
  if (length === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / length;
}

const glyphs = {};
for (const tag of svg.match(/<glyph\b[^>]*\/?>/g) ?? []) {
  const unicode = attr(tag, 'unicode');
  if (unicode === undefined) continue;
  const key = decode(unicode);
  if ([...key].length !== 1) continue;
  const adv = Math.round(Number(attr(tag, 'horiz-adv-x') ?? defaultAdvance));
  const d = attr(tag, 'd');
  const strokes = d
    ? pathToStrokes(decode(d))
        .map((flat) => {
          const pts = [];
          for (let i = 0; i < flat.length; i += 2) pts.push([Math.round(flat[i]), Math.round(-flat[i + 1])]); // y down
          return simplify(pts, EPSILON);
        })
        .filter((pts) => pts.length > 1)
        .map((pts) => pts.flat())
    : [];
  glyphs[key] = { adv, s: strokes };
}

const out = {
  name,
  license: 'SIL Open Font License 1.1. See Resources/OFL.txt.',
  source: 'EMS Allure (single-line Allura) from the Inkscape Hershey Text extension',
  upm,
  ascent,
  descent,
  xHeight,
  capHeight,
  glyphs,
};

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, '../YourPerson/Resources/typeface.json');
writeFileSync(target, JSON.stringify(out));
const count = Object.keys(glyphs).length;
const points = Object.values(glyphs).reduce((n, g) => n + g.s.reduce((m, s) => m + s.length / 2, 0), 0);
console.log(`wrote ${target}: ${name}, ${count} glyphs, ${points} points, ${(JSON.stringify(out).length / 1024).toFixed(0)} KB`);
