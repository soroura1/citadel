/**
 * ★ THE ACCESSIBILITY PATH IS A PEER, NOT A FALLBACK. (EVS-7)
 *
 * ============================================================================
 * WHAT THESE CHECKS ARE, AND WHAT THEY ARE NOT
 * ============================================================================
 * `DEC-012` commits to WCAG 2.2 AA plus four commitments beyond it, and the
 * Final Product Experience Contract §7 says parity means *"the same
 * information, choices, immediate effects, consequences, debrief and output"* —
 * the full mechanic, not the words describing it.
 *
 * ⛔ NONE OF THIS PASSES THE GATE'S ACCESSIBILITY DIMENSION. That dimension
 * reads *"the selected accessibility path reaches the same learning result
 * without losing information or action"*, and it is evidence from a person
 * using their own assistive technology. `Q11` — a named accessibility
 * reviewer — is open. These are the mechanical floor beneath that review, and
 * the evidence pack says so in as many words.
 *
 * ⚠️ SOME OF THESE ARE GREPS, DELIBERATELY. A ban is the one thing a grep
 * proves well: `tabindex="3"` is wrong wherever it appears, and no render can
 * demonstrate the absence of something across a codebase. Behaviour claims are
 * rendered instead. Do not "upgrade" the bans.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CHAPTER_1 } from '../src/content/chapter-1.js';
import { bundleFrom, startRun, view, act, commit, advance } from '../src/engine/run.js';
import { PlayRoute } from '../src/features/play/PlayRoute.jsx';
import { PlaceRoute } from '../src/features/place/PlaceRoute.jsx';
import { ObservationRoute } from '../src/features/record/ObservationRoute.jsx';
import * as store from '../src/engine/local-store.js';
import { t } from '../src/locales/index.js';
import ATTESTATION from '../src/content/attestation.json' with { type: 'json' };

const bundle = () => bundleFrom(CHAPTER_1);
const LEAD = 'role.resilience-lead';
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');

const sources = () => {
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(new URL(`${e.name}/`, dir)) : [new URL(e.name, dir)]);
  return walk(new URL('../src/', import.meta.url))
    .filter((u) => /\.jsx?$/.test(u.pathname))
    .map((u) => ({ file: u.pathname.split('/src/')[1], text: readFileSync(u, 'utf8') }));
};

/** Every beat of the whole chapter, as markup. */
function allBeats(b, { role = LEAD, textPath = false } = {}) {
  let run = startRun({ bundle: b, config: { role, stake: 'a stake' } });
  const out = [];
  let guard = 0;
  while (!run.complete && guard++ < 200) {
    out.push(renderToStaticMarkup(createElement(PlayRoute, {
      run, bundle: b, attestation: ATTESTATION, textPath,
    })));
    if (run.phase === 'interactive') {
      let inner = 0;
      while (view(run, b).actions.length > 0 && inner++ < 20) run = act(run, b, view(run, b).actions[0].id).run;
      run = commit(run, b, view(run, b).presented.options[0].id).run;
    } else run = advance(run, b);
  }
  return { beats: out, run };
}

// --- keyboard-only completion ------------------------------------------------------

test('★ EVERY BEAT OFFERS A REAL, FOCUSABLE CONTROL — the chapter is completable by keyboard', () => {
  // A beat with nothing focusable is a dead end for someone who cannot use a
  // pointer, and it would look completely fine in a screenshot.
  const b = bundle();
  const { beats } = allBeats(b);
  const focusable = /<(button|a\s|select|textarea|input|summary)/;
  beats.forEach((html, i) => {
    assert.match(html, focusable, `beat ${i} offers nothing a keyboard can reach`);
  });
});

test('★ no interactive element is a DIV WITH AN onClick', () => {
  // A div is not focusable, does not announce itself, and does not respond to
  // Enter or Space. This is a ban, so it is a grep: the pattern is wrong
  // wherever it appears, and no render proves its absence everywhere.
  for (const { file, text } of sources()) {
    const handlers = [...text.matchAll(/<(\w+)[^>]*\sonClick=/g)].map((m) => m[1]);
    for (const tag of handlers) {
      assert.ok(['button', 'a'].includes(tag),
        `${file}: <${tag}> carries onClick — only a button or a link is operable by keyboard`);
    }
  }
});

test('★ FOCUS ORDER IS DOM ORDER — no positive tabindex anywhere', () => {
  // A positive tabindex pulls an element out of document order and puts every
  // other control after it, which reorders the whole page for keyboard users
  // and for nobody else. It is never right in a document-ordered layout.
  for (const { file, text } of sources()) {
    const bad = [...text.matchAll(/tabIndex=\{?["']?(\d+)/g)].map((m) => Number(m[1]));
    for (const value of bad) {
      assert.ok(value <= 0, `${file}: tabIndex=${value} reorders focus for keyboard users only`);
    }
  }
});

test('★ focus is visible, and never removed', () => {
  assert.match(rules, /:focus-visible/, 'a keyboard user cannot see where they are');
  assert.ok(!/outline:\s*(none|0)\b/.test(rules), 'a focus outline is removed somewhere');
});

test('every control has an accessible name — no bare icon or empty button', () => {
  const b = bundle();
  const { beats } = allBeats(b);
  for (const html of beats) {
    assert.ok(!/<button[^>]*>\s*<\/button>/.test(html), 'an empty button');
    assert.ok(!/<a[^>]*>\s*<\/a>/.test(html), 'an empty link');
  }
});

// --- 200% zoom ---------------------------------------------------------------------

test('★ 200% ZOOM — type scales, and no text container clips its contents', () => {
  // px on a font-size defeats browser zoom; `overflow: hidden` on a text block
  // is what actually eats the words once they reflow.
  const fontSizes = [...rules.matchAll(/font-size:\s*([^;]+);/g)].map((m) => m[1].trim());
  assert.deepEqual(fontSizes.filter((v) => /\dpx/.test(v)), [], 'a px font size defeats zoom');

  // ⚠️ `.visually-hidden` IS EXEMPT, AND ONLY IT. Clipping is that class's
  // entire purpose: the content is kept for assistive technology and removed
  // from the visual page. This check found it on its first run, which is the
  // check working — a blanket exemption for "utilities" would have hidden the
  // next real one.
  const clipping = [...rules.matchAll(/([^{}]+)\{([^}]*overflow:\s*hidden[^}]*)\}/g)]
    .map((m) => m[1].trim())
    .filter((sel) => !/\.visually-hidden/.test(sel));
  assert.deepEqual(clipping, [], 'a text container hides its overflow — at 200% that is lost content');

  // ...and the exemption is not a hole: the class must still be the clipping one.
  assert.match(rules, /\.visually-hidden\s*\{[^}]*clip-path/,
    'visually-hidden stopped clipping, so the exemption above now covers something else');

  // The measure is in ch, so it reflows with the text rather than fixing a width.
  assert.match(rules, /--measure:\s*\d+ch/);
});

test('no fixed pixel height is imposed on a block that holds text', () => {
  const fixed = [...rules.matchAll(/([^{}]+)\{([^}]*\bheight:\s*\d+px[^}]*)\}/g)].map((m) => m[1].trim());
  assert.deepEqual(fixed, [], 'a fixed height crops text the moment it grows');
});

// --- reduced motion ----------------------------------------------------------------

test('★ REDUCED MOTION removes the arrival, never the state', () => {
  assert.match(rules, /@media \(prefers-reduced-motion: reduce\)/);
  const reduce = rules.slice(rules.indexOf('prefers-reduced-motion: reduce'));
  assert.match(reduce, /animation/, 'the escape hatch does not actually stop the animation');

  // ★ The register is named IN WORDS, so a participant who never sees motion
  // still learns what the scene's register is. V9's whole point.
  const b = bundle();
  const { beats } = allBeats(b);
  assert.ok(beats[0].includes(t('register.wonder')), 'the register exists only as motion');
});

// --- low bandwidth, and art as additive --------------------------------------------

test('★ LOW BANDWIDTH — strip every image and the whole chapter is still playable', () => {
  // `art is additive` is the rule; this is the proof. Not one beat loses a
  // movement, an action, an option, a response or a residue when the pictures
  // never arrive.
  const b = bundle();
  const { beats } = allBeats(b);
  for (const [i, html] of beats.entries()) {
    const withoutArt = html.replace(/<figure[\s\S]*?<\/figure>/g, '');
    // The scene still says where you are and what beat you are on.
    assert.match(withoutArt, /<h1>/, `beat ${i} has no heading without its art`);
    assert.match(withoutArt, /class="beat"/, `beat ${i} loses the beat marker`);
    assert.ok(withoutArt.length > 1200, `beat ${i} is nearly empty without its art`);
  }
});

test('every image is lazy and carries real alternative text', () => {
  const b = bundle();
  const html = [...allBeats(b).beats, renderToStaticMarkup(createElement(PlaceRoute, {
    run: null, bundle: b, scenes: CHAPTER_1.scenes,
  }))].join('\n');

  const images = [...html.matchAll(/<img[^>]*>/g)].map((m) => m[0]);
  assert.ok(images.length > 0, 'no image rendered at all — this test would prove nothing');
  for (const img of images) {
    assert.match(img, /loading="lazy"/, `not lazy: ${img.slice(0, 60)}`);
    const alt = /alt="([^"]*)"/.exec(img)?.[1] ?? '';
    assert.ok(alt.length > 30, `alt text too thin to replace the image: "${alt}"`);
    assert.ok(!alt.startsWith('⟨'), 'the alt text is a missing locale key');
  }
});

// --- nothing is carried by colour, motion or sound alone ----------------------------

test('★ NO INFORMATION BY COLOUR ALONE — every state signal has words beside it', () => {
  const b = bundle();
  const { beats, run } = allBeats(b);
  const html = beats.join('\n');

  // The provisional band is a data attribute AND a sentence.
  assert.ok(html.includes(t('provisional.label')));
  // A worsening is underlined and named — the band's own word carries it.
  const worsened = html.includes('data-worsened="true"');
  if (worsened) assert.ok(/class="moved-to"/.test(html), 'a worsening has no word beside it');
  // The register is named. The bell is named. The beat is named.
  assert.ok(html.includes(t('play.bell')) && html.includes(t('play.beat')));
  assert.ok(html.includes(t('register.label')));

  // ...and the place's tiers are headings, not only a background.
  const place = renderToStaticMarkup(createElement(PlaceRoute, {
    run, bundle: b, scenes: CHAPTER_1.scenes,
  }));
  assert.ok(place.includes(t('tier.underworks')), 'the Underworks are a colour and not a name');
});

test('★ THERE IS NO AUDIO, so captions and volume controls are recorded as OWED, not built', () => {
  // ⚠️ A control for silence is a rule that cannot fire, built knowingly. EVS-5
  // §3 asks for ambient and signal audio "where available" with captions,
  // independent volume and a silent-equivalent path — none of which exists,
  // because no audio exists. Asserting the absence keeps the gap honest: the
  // day a sound is added, this test fails and the controls become due.
  for (const { file, text } of sources()) {
    assert.ok(!/<audio|new Audio\(|AudioContext/.test(text),
      `${file}: audio arrived, so captions, independent volume and a silent path are now due`);
  }
});

// --- the surfaces past the chapter --------------------------------------------------

test('★ the record and the note are reachable by keyboard and complete without art', () => {
  const b = bundle();
  const { run } = allBeats(b);
  const local = store.memoryStore();
  const html = renderToStaticMarkup(createElement(ObservationRoute, {
    run, bundle: b, local, t,
  }));

  assert.match(html, /<textarea/, 'the reflection cannot be typed into');
  assert.ok(!/<img/.test(html), 'the note screen depends on an image');
  // Every field has a label bound to it — a textarea with no label is a box
  // whose purpose is visible only to someone who can see the text above it.
  const ids = [...html.matchAll(/<textarea[^>]*id="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(ids.length >= 7);
  for (const id of ids) {
    assert.ok(html.includes(`for="${id}"`), `the field ${id} has no label bound to it`);
  }
});

test('★ EVERY FIGURE THE SURFACES RENDER IS CONSTRAINED BY THE STYLESHEET', () => {
  // ============================================================================
  // ⚠️ THE DEPLOYED PAGE SCROLLED SIDEWAYS, AND EVERY CHECK WAS GREEN.
  // ============================================================================
  // `.plan-figure` had no `inline-size` rule, so the 1600px cutaway rendered at
  // 1600px inside a 587px column and pushed the document to 2102px against a
  // 1512px viewport.
  //
  // Nothing caught it: the `width`/`height` ATTRIBUTES were present, which is
  // correct for layout shift and says nothing about display size; the render
  // tests asserted the tag existed; the stylesheet tests looked for physical
  // properties and px font sizes. A human opening the page found it at once —
  // the 17-August lesson in a new shape.
  //
  // ★ THE LIST IS DERIVED FROM THE COMPONENTS, never written here. A figure
  // class added tomorrow is covered without anyone remembering to add it.
  const classes = new Set();
  for (const { text } of sources()) {
    for (const m of text.matchAll(/<figure[^>]*className="([^"]+)"/g)) {
      for (const cls of m[1].split(/\s+/)) if (cls) classes.add(cls);
    }
  }
  assert.ok(classes.size > 0, 'no figure found at all — this test would prove nothing');

  for (const cls of classes) {
    const rule = new RegExp(`\\.${cls}\\s+img\\s*\\{[^}]*inline-size:\\s*100%`);
    assert.match(rules, rule,
      `.${cls} img has no inline-size — the image renders at its intrinsic width and the page scrolls sideways`);
  }
});
