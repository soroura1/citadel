/**
 * The stylesheet, checked mechanically.
 *
 * ============================================================================
 * RTL BY CONSTRUCTION IS A PROPERTY OF THE CSS, NOT A PROMISE ABOUT IT.
 * ============================================================================
 * accessibility.test.js asserts that the LOCALE layer sets `dir` — necessary,
 * and not sufficient. Setting `dir="rtl"` mirrors nothing if the stylesheet
 * says `margin-left`.
 *
 * DEC-012 commits to mirroring "by construction, not a patched stylesheet".
 * A physical property is the first step toward the patched one: someone adds
 * `margin-left`, Arabic looks wrong, and the fix is a second stylesheet that
 * drifts from the first — invisibly, to anyone who does not read Arabic.
 *
 * So a physical property is refused here, by name.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '../src/styles.css'), 'utf8');
// Strip comments — they explain the physical properties they forbid.
const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');

test('★ no PHYSICAL direction property — RTL mirrors itself or it does not mirror', () => {
  const physical = [
    'margin-left', 'margin-right', 'padding-left', 'padding-right',
    'border-left', 'border-right', 'text-align: left', 'text-align: right',
    'left:', 'right:', 'float: left', 'float: right',
  ];
  const found = physical.filter((p) => rules.includes(p));
  assert.deepEqual(found, [],
    `use logical properties: margin-inline-start, padding-block, border-inline-start, text-align: start`);
});

test('★ focus is never removed', () => {
  assert.ok(!/outline:\s*(none|0)/.test(rules),
    'a keyboard user who cannot see where they are cannot use the page at all');
  assert.match(rules, /:focus-visible/, 'a visible focus style must exist');
});

test('★ reduced motion is honoured', () => {
  assert.match(rules, /prefers-reduced-motion/, 'DEC-012 requires the escape hatch');
});

test('the page does not depend on a downloaded font or image', () => {
  assert.ok(!/@import|@font-face/.test(rules), 'no webfont — the audience is on slow connections');
  assert.ok(!/url\(/.test(rules), 'no images in CSS: art is additive, and this is the floor');
});

test('type and spacing scale with the reader — 200% zoom must enlarge the page', () => {
  // px on a font-size defeats browser zoom and user font preferences.
  const fontSizes = [...rules.matchAll(/font-size:\s*([^;]+);/g)].map((m) => m[1].trim());
  const pxSizes = fontSizes.filter((v) => /\d px|\dpx/.test(v));
  assert.deepEqual(pxSizes, [], 'font sizes must be rem-based, never px');
});

test('★ there is a readable measure — prose is not full-bleed on a wide screen', () => {
  assert.match(rules, /--measure:\s*\d+ch/, 'a line length in ch, set once');
  assert.match(rules, /max-inline-size:\s*var\(--measure\)/);
});

test('state is described, never scored — no bars, no ranking colours', () => {
  // DEC-005: gamify the learning behaviour, never the safety state.
  assert.ok(!/progress|meter|--score|\.bar\b/.test(rules),
    'a bar or a meter turns a resilience state into something to optimise');
});
