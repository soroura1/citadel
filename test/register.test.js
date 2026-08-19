/**
 * V9 — the emotional register.
 *
 * ============================================================================
 * A REGISTER THAT ONLY EXISTS IN MOTION IS A REGISTER MOST READERS NEVER GET.
 * ============================================================================
 * The plan already refuses visual-only clues. These assert that the register
 * survives with motion removed, with CSS alone, and in words — and that the
 * derivation from canon stays visible rather than being absorbed as canon.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const scenes = readdirSync(join(here, '../src/content/scenes'))
  .map((f) => JSON.parse(readFileSync(join(here, '../src/content/scenes', f), 'utf8')));
const css = readFileSync(join(here, '../src/styles.css'), 'utf8');
const en = JSON.parse(readFileSync(join(here, '../src/locales/en.json'), 'utf8'));

test('★ every scene declares a register, and the CANON TERM it came from', () => {
  for (const s of scenes) {
    assert.ok(s.emotional_state, `${s.id} has no emotional_state`);
    assert.ok(s.emotional_state.derivedFrom,
      `${s.id} names a register without the canon term — the interpretation would look like canon`);
  }
});

test('★ the derivation is marked UNRESOLVED — canon assigns the arc per chapter', () => {
  // Canon's Chapter 1 arc is one line at chapter level. Distributing it across
  // four scenes is ours, and saying so is the difference between a derivation
  // and an invention.
  for (const s of scenes) {
    assert.match(s.emotional_state.unresolved ?? '', /chapter level|derivation/i,
      `${s.id} presents a derived register as though canon assigned it`);
  }
});

test('the four registers follow canon\'s arc, in order', () => {
  const order = ['sc-01-01', 'sc-01-02', 'sc-01-03', 'sc-01-04'];
  const got = order.map((id) => scenes.find((s) => s.id === id).emotional_state.derivedFrom);
  assert.deepEqual(got, ['wonder', 'concentrated fear', 'concentrated fear', 'first unease'],
    'canon: wonder -> professional belonging -> concentrated fear -> first unease');
});

test('★ every register in use has a VISUAL rule and a WORD', () => {
  for (const s of scenes) {
    const r = s.emotional_state.register;
    assert.ok(css.includes(`[data-register='${r}']`), `${r} has no visual register in styles.css`);
    assert.ok(en[`register.${r}`], `${r} has no words — it would be visual-only`);
  }
});

test('★ the register survives with motion removed', () => {
  // Measure, weight and spacing carry it; animation only inflects the arrival.
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const r of ['wonder', 'pressure']) {
    const block = rules.split(`[data-register='${r}']`)[1] ?? '';
    const upToNextRule = block.split('}')[0];
    assert.match(upToNextRule, /--register-measure|font-size|letter-spacing|margin|border/,
      `${r} is carried by animation alone — a reader with reduced motion gets nothing`);
  }
  assert.match(rules, /prefers-reduced-motion/);
});

test('★ "unease" uses NO animation — it holds still, and that is the point', () => {
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const block = rules.split("[data-register='unease']")[1]?.split('}')[0] ?? '';
  assert.ok(!/animation/.test(block),
    'unease is small wrongness inside a competent scene; movement would announce it');
});

test('the register is applied to the scene element, not invented at render time', async () => {
  const play = readFileSync(join(here, '../src/features/play/PlayScreen.jsx'), 'utf8');
  assert.match(play, /data-register=\{register/);
  assert.match(play, /scene\.emotional_state\?\.register/,
    'the register must come from the CONTENT, never from the scene id or its position');
});

test('★ no new colour was introduced — the register is type and space', () => {
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const registerBlocks = rules.match(/\[data-register[^{]*\{[^}]*\}/g) ?? [];
  for (const b of registerBlocks) {
    const hex = b.match(/#[0-9a-f]{3,8}/gi) ?? [];
    assert.deepEqual(hex, [], `a register block introduces a raw colour: ${hex.join(', ')}`);
  }
});
