/**
 * Accessibility invariants — F8–F11, per DEC-012.
 *
 * These run without a browser. They catch the things that are cheap to assert now and expensive to
 * retrofit — which is the whole reason the accessibility policy was a blocking R0 decision rather
 * than a later concern.
 *
 * The browser-dependent checks (screen reader, 200% zoom on a real device) are HUMAN gates with a
 * named reviewer — Q11, which blocks R2.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'src');

function sources(dir = srcDir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) sources(p, out);
    else if (/\.(js|jsx)$/.test(e)) out.push(p);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Localisation — no user-visible string is ever a literal
// ---------------------------------------------------------------------------
describe('localisation', () => {
  test('every locale catalogue parses and shares the English key set as its ceiling', () => {
    const dir = join(srcDir, 'locales');
    const en = JSON.parse(readFileSync(join(dir, 'en.json'), 'utf8'));
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      const cat = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      const extra = Object.keys(cat).filter((k) => !(k in en));
      assert.equal(
        extra.length,
        0,
        `${f} has keys English does not: ${extra.join(', ')} — English is the key set`,
      );
    }
  });

  test('a SECOND locale exists and loads', () => {
    const dir = join(srcDir, 'locales');
    const locales = readdirSync(dir).filter((f) => f.endsWith('.json'));
    assert.ok(
      locales.length >= 2,
      'Localisation that has never been exercised is a claim, not a property. A second locale ' +
        'must exist from R0 — the prior attempt shipped a substantially bilingual CONTENT corpus ' +
        'onto a platform that was not localised at all.',
    );
  });

  test('right-to-left is handled as a layout MODE, not a patched stylesheet', () => {
    const src = readFileSync(join(srcDir, 'locales/index.js'), 'utf8');
    assert.match(src, /RTL_LOCALES/, 'RTL locales must be declared');
    assert.match(src, /directionFor/, 'direction must be derived from the locale');
    assert.match(src, /document\.documentElement\.dir/, 'the document direction must be set');
  });

  test('no user-visible string is a literal in a component', () => {
    const offenders = [];
    for (const file of sources()) {
      if (file.includes('/locales/')) continue;
      const text = readFileSync(file, 'utf8');
      // JSX text nodes containing letters, that are not a t(...) call
      for (const m of text.matchAll(/>\s*([A-Za-z][A-Za-z ,.'!?]{4,})\s*</g)) {
        offenders.push(`${relative(root, file)}: "${m[1].trim()}"`);
      }
    }
    assert.equal(
      offenders.length,
      0,
      `User-visible literals found — every one must be a locale key:\n  ${offenders.join('\n  ')}`,
    );
  });
});

// ---------------------------------------------------------------------------
// DEC-014 — timers are permitted; SPEED IS NEVER SCORED
//
// This check was NARROWED deliberately. An earlier version asserted "no
// countdown exists in any surface", which would have made facilitated exercises
// — where timed injects are how the practice actually works — impossible to
// model. The real rule is about scoring, not about timers.
// ---------------------------------------------------------------------------
describe('DEC-014 — time', () => {
  test('no scoring path reads elapsed time', () => {
    const offenders = [];
    for (const file of sources()) {
      const text = readFileSync(file, 'utf8');
      // elapsed-time arithmetic in the same file as scoring vocabulary
      const readsElapsed = /Date\.now\(\)\s*-|performance\.now\(\)\s*-|elapsed/i.test(text);
      const scores = /\b(score|standing|practiceLevel|mark|ranking)\b/i.test(text);
      if (readsElapsed && scores) offenders.push(relative(root, file));
    }
    assert.equal(
      offenders.length,
      0,
      `Elapsed time appears alongside scoring in: ${offenders.join(', ')}. ` +
        `Timers may create pressure; they may never create standing. ` +
        `Resilience often requires consultation and verification — rewarding speed teaches the opposite.`,
    );
  });

  test('any timer is pausable and dismissible', () => {
    for (const file of sources()) {
      const text = readFileSync(file, 'utf8');
      if (!/setInterval|countdown|timer/i.test(text)) continue;
      assert.match(
        text,
        /pause|dismiss|cancel/i,
        `${relative(root, file)} has a timer with no pause or dismiss. A clinician called away ` +
          `mid-scene must not lose their session.`,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// F11 — contrast, verified by COMPUTED test, never by eye
// ---------------------------------------------------------------------------
describe('F11 — contrast', () => {
  const srgb = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
  };
  const ratio = (a, b) => {
    const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };

  // R0's palette. Every pair a user can actually see together.
  // ★ READ FROM THE STYLESHEET, NEVER RESTATED HERE.
  //
  // This list used to be its own copy of the palette — so it could have passed
  // in full while the page rendered entirely different colours. A contrast test
  // that does not read the colours in use is testing a document, not a product.
  const cssVars = Object.fromEntries(
    [...readFileSync(join(srcDir, 'styles.css'), 'utf8')
      .matchAll(/(--[a-z-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]),
  );

  const PAIRS = [
    [cssVars['--ink'], cssVars['--paper'], 'body text on background'],
    [cssVars['--paper'], cssVars['--ink'], 'inverted text (buttons)'],
    [cssVars['--link'], cssVars['--paper'], 'link on background'],
    [cssVars['--ink-quiet'], cssVars['--paper'], 'secondary text on background'],
  ];

  test('the palette was actually found in the stylesheet', () => {
    for (const [fg, bg, label] of PAIRS) {
      assert.ok(fg && bg, `${label}: a colour is missing from styles.css — ` +
        'this test would otherwise pass by comparing undefined to undefined');
    }
  });

  test('every colour pair meets WCAG 2.2 AA for normal text (4.5:1)', () => {
    for (const [fg, bg, label] of PAIRS) {
      const r = ratio(fg, bg);
      assert.ok(
        r >= 4.5,
        `${label} (${fg} on ${bg}) is ${r.toFixed(2)}:1 — AA needs 4.5:1. ` +
          `Verified by computation, never by eye.`,
      );
    }
  });
});
