#!/usr/bin/env node
/**
 * R0-C05A — DERIVE RUNTIME PORTRAITS FROM THE ACCEPTED V05B MASTERS.
 *
 * ⚠️ THE GEOMETRY IS READ FROM `src/projections/slots.js`, NOT RESTATED HERE.
 * A crop written twice is a crop that drifts, and this repository has already
 * shipped a surface holding a hardcoded map of filenames beside a computed
 * manifest. The slot declares the focal aspect, the vertical bias, the output
 * pixels and the byte ceilings; this script obeys them.
 *
 * ⛔ IT GENERATES NO ART. It crops and downscales six accepted candidate
 * masters (`VA-018`–`VA-023`, visual bible § 22.1). New character generation is
 * forbidden in C05A by name.
 *
 * ⛔ AND IT NEVER RAISES A CEILING. If a derivative overflows its declared
 * budget the script lowers quality and tries again; if it still overflows it
 * fails. Editing the budget to fit the file is how a budget stops meaning
 * anything.
 *
 * Usage:  node scripts/derive-portraits.mjs [--story ../../resilience-citadel-story]
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync, existsSync } from 'node:fs';
import { PORTRAIT_SLOTS } from '../src/projections/slots.js';

const arg = process.argv.indexOf('--story');
const STORY = arg > -1 ? process.argv[arg + 1] : '../../resilience-citadel-story';

const run = (bin, args) => execFileSync(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();

/** Intrinsic size of a master, asked of the file rather than assumed. */
function sizeOf(path) {
  const out = run('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', path]).trim();
  const [width, height] = out.split('x').map(Number);
  return { width, height };
}

/**
 * ★ THE FOCAL WINDOW. The wider dimension is trimmed to the declared aspect;
 * when the master is TALLER than the window, the window sits `vertical` of the
 * way down the slack rather than in the middle — a centred bust crop of a
 * standing figure returns a torso.
 */
function cropWindow({ width, height }, { aspect: [aw, ah], vertical }) {
  const target = aw / ah;
  if (width / height > target) {
    const w = Math.floor(height * target);
    return { w, h: height, x: Math.floor((width - w) / 2), y: 0 };
  }
  const h = Math.floor(width / target);
  return { w: width, h, x: 0, y: Math.floor((height - h) * vertical) };
}

function derive(master, out, box, [pw, ph], quality) {
  mkdirSync(out.replace(/\/[^/]+$/, ''), { recursive: true });
  run('ffmpeg', ['-y', '-loglevel', 'error', '-i', master,
    '-vf', `crop=${box.w}:${box.h}:${box.x}:${box.y},scale=${pw}:${ph}:flags=lanczos`,
    '-q:v', String(quality), out]);
  return statSync(out).size;
}

/** Fit inside a declared ceiling by lowering quality — never by raising it. */
function fit(master, out, box, pixels, ceiling, label) {
  for (const quality of [3, 4, 5, 6, 7, 8]) {
    const bytes = derive(master, out, box, pixels, quality);
    if (bytes <= ceiling) return { bytes, quality };
  }
  throw new Error(`${label}: cannot reach the declared ceiling of ${ceiling} bytes. `
    + `Recrop or resize the derivative — do NOT raise the budget.`);
}

let failed = false;
for (const slot of PORTRAIT_SLOTS) {
  const master = `${STORY}/${slot.master}`;
  if (!existsSync(master)) { console.error(`MISSING MASTER ${slot.id}: ${master}`); failed = true; continue; }
  const box = cropWindow(sizeOf(master), slot.focal);
  const std = fit(master, `public${slot.file}`, box, slot.pixels.standard, slot.maxBytes, slot.id);
  const low = fit(master, `public${slot.lowBandwidth}`, box, slot.pixels.lowBandwidth, slot.lowBandwidthMaxBytes, `${slot.id} low-bandwidth`);
  console.log(`${slot.id} ${slot.candidateRef}  crop ${box.w}x${box.h}+${box.x}+${box.y}  `
    + `standard ${std.bytes}/${slot.maxBytes} (q${std.quality})  `
    + `low ${low.bytes}/${slot.lowBandwidthMaxBytes} (q${low.quality})`);
}
process.exit(failed ? 1 : 0);
