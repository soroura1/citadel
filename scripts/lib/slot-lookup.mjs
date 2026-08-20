#!/usr/bin/env node
/**
 * Look a declared slot up and print `<max_bytes> <target-path> <alt_key>`.
 *
 * ★ THE SLOT IS THE AUTHORITY. `derive-asset.sh` never takes a budget on the
 * command line, because a budget that can be passed in is a budget the person
 * in a hurry chooses. This reads the one the content declares.
 *
 * Every declared slot in the project is searched — the scenes' and the place
 * model's plan slot — because there is ONE slot shape and they should be
 * looked up the same way. Two lookups would be the defect EVS-5 corrected,
 * rebuilt in a script.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const wanted = process.argv[2];
if (!wanted) { console.error('usage: slot-lookup.mjs <slot-id>'); process.exit(2); }

const slots = [];
const places = JSON.parse(readFileSync(join(root, 'src/content/places.json'), 'utf8'));
if (places.plan_slot) slots.push(places.plan_slot);
for (const f of readdirSync(join(root, 'src/content/scenes'))) {
  const scene = JSON.parse(readFileSync(join(root, 'src/content/scenes', f), 'utf8'));
  for (const slot of scene.asset_slots ?? []) slots.push(slot);
}

const slot = slots.find((s) => s.id === wanted);
if (!slot) {
  console.error(`no slot declares itself as ${wanted}`);
  console.error('declared slots:');
  for (const s of slots) console.error(`  ${s.id}`);
  process.exit(3);
}

const name = slot.id.split('.').at(-1);
console.log(`${slot.max_bytes} public/scenes/${name}.jpg ${slot.alt_key}`);
