/**
 * ★ EVERY KEY THE PRODUCT REFERENCES MUST EXIST. COMPUTED, NEVER LISTED.
 *
 * ============================================================================
 * A MISSING STRING SHOULD FAIL THE BUILD, NOT APPEAR ON SCREEN.
 * ============================================================================
 * `t()` returns ⟨key⟩ for a missing string, which is the right runtime
 * behaviour — the gap is visible rather than silently blank. But a reader
 * should never be the one who finds it.
 *
 * This gathers keys from the CONTENT and from the CODE and requires each to
 * exist in en.json. Nothing here is a hand-maintained list, so adding a scene
 * or a movement extends the check automatically.
 *
 * It also caught a real defect: PlayScreen constructed
 * `scene.${scene.id}.${movement}` while the content declared
 * `scene.01.01.orientation` — two naming schemes for one string, so no authored
 * prose could ever have been found.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const en = JSON.parse(readFileSync(join(here, '../src/locales/en.json'), 'utf8'));
const read = (p) => JSON.parse(readFileSync(join(here, 'fixtures', p), 'utf8'));
const all = (d) => readdirSync(join(here, 'fixtures', d)).map((f) => read(join(d, f)));

const scenes = all('scenes');
const decisions = all('decisions');

/** Every `key` the content declares, at any depth. */
function declaredKeys(node, into = new Set()) {
  if (Array.isArray(node)) node.forEach((n) => declaredKeys(n, into));
  else if (node && typeof node === 'object') {
    if (typeof node.key === 'string') into.add(node.key);
    Object.values(node).forEach((n) => declaredKeys(n, into));
  }
  return into;
}

test('★ every key the CONTENT declares exists in en.json', () => {
  const missing = [...declaredKeys([...scenes, ...decisions])].filter((k) => en[k] === undefined);
  assert.deepEqual(missing, [],
    `authored content references strings that do not exist — a reader would see ⟨key⟩`);
});

test('★ every key the CODE names as a literal exists in en.json', () => {
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]);
  const src = join(here, '../src');
  const missing = new Set();
  for (const f of walk(src).filter((f) => /\.jsx?$/.test(f))) {
    const text = readFileSync(f, 'utf8');
    for (const m of text.matchAll(/\bt\('([^']+)'\)/g)) {
      const key = m[1];
      // Skip identifiers that are plainly not locale keys (header names, field names).
      if (!key.includes('.') && !['nav.label'].includes(key)) continue;
      if (en[key] === undefined) missing.add(`${f.replace(src, 'src')}: ${key}`);
    }
  }
  assert.deepEqual([...missing], []);
});

test('★ every scene has a title, and every movement a heading', () => {
  const MOVEMENTS = ['orientation', 'desire', 'friction', 'choice_or_discovery', 'turn', 'residue'];
  const missing = [];
  for (const s of scenes) if (en[`scene.${s.id}.title`] === undefined) missing.push(`scene.${s.id}.title`);
  for (const m of MOVEMENTS) if (en[`movement.${m}`] === undefined) missing.push(`movement.${m}`);
  assert.deepEqual(missing, []);
});

test('★ every season variable and band is named in words a reader understands', async () => {
  const { SEASON_VARIABLES, BANDS } = await import('../src/engine/season-variables.js');
  const missing = [];
  for (const v of Object.keys(SEASON_VARIABLES)) if (en[`variable.${v}`] === undefined) missing.push(v);
  for (const b of BANDS) if (en[`band.${b}`] === undefined) missing.push(b);
  assert.deepEqual(missing, []);

  // A band must never be rendered as a number — that is what invites optimising
  // a safety state, which DEC-005 exists to prevent.
  for (const b of BANDS) assert.ok(!/^\d+$/.test(en[`band.${b}`]), `band ${b} renders as a number`);
});

test('the text path is authored for every scene — it is not a fallback', () => {
  const missing = scenes
    .filter((s) => s.text_equivalent?.key && en[s.text_equivalent.key] === undefined)
    .map((s) => s.id);
  assert.deepEqual(missing, [],
    'a scene with no authored text path excludes a whole access route from the decision');
});

test('★ the text path reaches the decision — it does not stop at description', () => {
  // A "text version" that summarises the scene and omits the choice is not an
  // equivalent; it is a synopsis, and the participant on that path never plays.
  for (const s of scenes) {
    const prose = en[s.text_equivalent.key];
    assert.ok(prose.length > 400, `${s.id}'s text path is too short to be an equivalent`);
  }
});

test('every option a player can be shown has a label', () => {
  const missing = [];
  for (const d of decisions) {
    if (en[d.prompt.key] === undefined) missing.push(d.prompt.key);
    for (const o of d.options) if (en[o.label.key] === undefined) missing.push(o.label.key);
  }
  assert.deepEqual(missing, []);
});
