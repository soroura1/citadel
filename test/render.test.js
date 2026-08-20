/**
 * ★ THE FIRST TESTS IN THIS REPOSITORY THAT EXECUTE A COMPONENT.
 *
 * ============================================================================
 * WHY THIS FILE EXISTS, AND WHAT IT COST NOT TO HAVE IT
 * ============================================================================
 * 17 August: the production page rendered BLANK. The build succeeded, seventeen
 * tests passed, all three reachability assertions passed, and `/version`,
 * `/health` and the API all returned 200. `<Navigation>` used TanStack Router's
 * `<Link>` with no `RouterProvider` mounted, and it threw during render.
 *
 * Every assertion in this repository asked whether a surface CAN be reached.
 * None EXECUTED it. A human opening the page found the fault in one click, and
 * `citadel/CLAUDE.md` has carried "⛔ Owed — a render assertion" ever since.
 *
 * `node --test` could not import `.jsx` (`ERR_UNKNOWN_FILE_EXTENSION`), which
 * is why no test had ever rendered anything. `test/jsx-hook.mjs` is the whole
 * fix, and this is the file it was owed to.
 *
 * ⚠️ AND FPE-01 CANNOT BE PROVEN ANY OTHER WAY. "The turn is not rendered
 * before commitment" is a statement about MARKUP. A pure-function test can
 * show the projection omits it; only this can show the page does not.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlayScreen } from '../src/features/play/PlayScreen.jsx';
import { CHAPTER_1 } from '../src/content/chapter-1.js';
import { bundleFrom, startRun, view, commit, advance, currentSceneId } from '../src/engine/run.js';
import { PHASES } from '../src/engine/staging.js';
import { variantFor } from '../src/engine/roles.js';
import { t } from '../src/locales/index.js';

const bundle = () => bundleFrom(CHAPTER_1);
const sceneOf = (id) => CHAPTER_1.scenes.find((s) => s.id === id);

/**
 * ⚠️ EVS-3 — A RUN REQUIRES A PLAYABLE ROLE. There is no roleless run any more:
 * `!role` used to satisfy every authority gate, which is why every test in this
 * file passed through those gates without exercising one.
 */
const EVS = { role: 'role.resilience-lead' };


/** Render whatever beat the run is on. */
const draw = (run, b, textPath = false) =>
  renderToStaticMarkup(PlayScreen({ ...view(run, b), textPath }));

/** Every beat of one scene, in order, as markup. */
function beatsOf(sceneIndex, b, { textPath = false, pick } = {}) {
  let run = startRun({ bundle: b, config: EVS });
  for (let i = 0; i < sceneIndex; i++) {
    run = advance(run, b);
    run = commit(run, b, view(run, b).presented.options[0].id).run;
    run = advance(advance(run, b), b);
  }
  const out = {};
  for (const phase of PHASES) {
    // ⚠️ THE SNAPSHOT MUST BE OF THE BEAT IT IS FILED UNDER. This loop walks
    // `run` while iterating `PHASES`, so a single misstep would file
    // `pre_commit`'s markup under `interactive` — and every absence assertion
    // below would then pass by looking at the wrong screen. A helper that
    // silently misaligns makes its own tests vacuous.
    assert.equal(view(run, b).phase, phase, 'the walk and the labels came apart');
    out[phase] = draw(run, b, textPath);
    if (run.phase === 'interactive') {
      const v = view(run, b);
      run = commit(run, b, pick ? pick(v) : v.presented.options[0].id).run;
    } else if (phase !== PHASES.at(-1)) {
      run = advance(run, b);
    }
  }
  return out;
}

test('★ the page RENDERS AT ALL — the assertion owed since 17 August', () => {
  const b = bundle();
  const html = draw(startRun({ bundle: b, config: EVS }), b);
  assert.ok(html.includes('<main'), 'the surface produced no markup');
  assert.ok(html.includes(t('scene.sc-01-01.title')), 'and it produced the scene');
});

// --- FPE-01, asserted on the MARKUP -------------------------------------------

for (const textPath of [false, true]) {
  const path = textPath ? 'text path' : 'visual path';

  test(`★ FPE-01 (${path}) — the turn's prose is absent until the commitment`, () => {
    const b = bundle();
    const scene = sceneOf('sc-01-01');
    const beats = beatsOf(0, b, { textPath });

    // A distinctive fragment, so this cannot pass by matching nothing.
    const turnFragment = scene.turn.slice(0, 60);
    assert.ok(scene.turn.length > 60);

    assert.ok(!beats.pre_commit.includes(turnFragment), 'the turn is on the encounter screen');
    assert.ok(!beats.interactive.includes(turnFragment), 'the turn is on the decision screen');
    assert.ok(beats.post_commit.includes(turnFragment),
      'the turn never arrived — the absence above proves nothing');
  });

  test(`★ FPE-01 (${path}) — the residue's prose is absent until the scene closes`, () => {
    const b = bundle();
    const scene = sceneOf('sc-01-01');
    const beats = beatsOf(0, b, { textPath });
    const residueFragment = scene.residue.slice(0, 60);

    assert.ok(!beats.pre_commit.includes(residueFragment));
    assert.ok(!beats.interactive.includes(residueFragment));
    assert.ok(!beats.post_commit.includes(residueFragment),
      'the residue belongs to the scene exit, not to the response');
    assert.ok(beats.scene_exit.includes(residueFragment), 'and it does arrive');
  });

  test(`★ FPE-01 (${path}) — no decision option is on the encounter screen`, () => {
    const b = bundle();
    const beats = beatsOf(0, b, { textPath });
    const decision = CHAPTER_1.decisions.find((d) => d.id === 'dec-01-gate-access');
    const label = t(decision.options[0].label.key);

    assert.ok(!beats.pre_commit.includes(label), 'the commitment is available before the encounter ends');
    assert.ok(beats.interactive.includes(label), 'and the decision is reachable');
  });

  test(`the ${path} reaches the same beats — parity is the mechanic, not the words`, () => {
    // A "text version" that summarises and omits the choice is a synopsis. The
    // text path substitutes ONLY at the encounter; from the decision onwards
    // both paths render the same thing.
    const b = bundle();
    const beats = beatsOf(0, b, { textPath });
    for (const phase of PHASES) {
      assert.ok(beats[phase].includes(t(`beat.${phase}`)), `${phase} is not reached on the ${path}`);
    }
    assert.ok(beats.post_commit.includes(t('play.response')), 'the response beat is missing');
  });
}

test('the text path substitutes at the ENCOUNTER, and nowhere else', () => {
  const b = bundle();
  const authored = t(sceneOf('sc-01-01').text_equivalent.key);
  const fragment = authored.slice(0, 60);

  const asText = beatsOf(0, b, { textPath: true });
  const asVisual = beatsOf(0, b, { textPath: false });

  assert.ok(asText.pre_commit.includes(fragment));
  assert.ok(!asVisual.pre_commit.includes(fragment));
  // ...and it does not continue to stand in for the later beats.
  assert.ok(!asText.post_commit.includes(fragment));
});

// --- the response beat ---------------------------------------------------------

test('★ FPE-04 — the response names the SPECIFIC option chosen', () => {
  const b = bundle();
  const atDecision = advance(startRun({ bundle: b, config: EVS }), b);
  const chosen = view(atDecision, b).presented.options[1];
  const after = commit(atDecision, b, chosen.id).run;

  const html = draw(after, b);
  assert.ok(html.includes(t(chosen.label.key)), 'a record that cannot say what you did is not a record');
});

test('★ FPE-03 — the response shows what moved, in bands and never in numbers', () => {
  const b = bundle();
  const atDecision = advance(startRun({ bundle: b, config: EVS }), b);
  const step = commit(atDecision, b, view(atDecision, b).presented.options[0].id);
  const html = draw(step.run, b);

  assert.ok(step.changes.length > 0);
  for (const c of step.changes) {
    const shown = c.kind === 'season' ? t(`band.${c.to}`) : c.to;
    assert.ok(html.includes(shown), `${c.variable} moved and the page does not say so`);
  }
  // No score, no total, no percentage anywhere in the beat.
  assert.ok(!/\b\d+%/.test(html), 'a percentage is a score with the word removed');
});

test('★ there is NO advance control at the decision — the choice is the way forward', () => {
  // A "skip" beside the chapter's one real moment makes it optional.
  const b = bundle();
  const beats = beatsOf(0, b);
  assert.ok(!beats.interactive.includes(t('advance.pre_commit')));
  assert.ok(!/class="advance"/.test(beats.interactive), 'the decision beat offers a way past itself');

  // Everywhere else the player leaves when they are ready, so the response is
  // not a flash between two pages.
  assert.ok(beats.post_commit.includes(t('advance.post_commit')));
  assert.ok(beats.scene_exit.includes(t('advance.scene_exit')));
});

test('★ the response is on the page BEFORE the control that leaves it', () => {
  const b = bundle();
  const atDecision = advance(startRun({ bundle: b, config: EVS }), b);
  const chosen = view(atDecision, b).presented.options[0];
  const html = draw(commit(atDecision, b, chosen.id).run, b);

  const optionAt = html.indexOf(t(chosen.label.key));
  const advanceAt = html.indexOf(t('advance.post_commit'));
  assert.ok(optionAt > -1 && advanceAt > -1);
  assert.ok(optionAt < advanceAt, 'the way out comes first, so the response can be missed');
});

// --- authored versus derived, on screen ---------------------------------------

test('★ a DERIVED response is marked provisional; the mark is not decoration', () => {
  const b = bundle();
  const atDecision = advance(startRun({ bundle: b, config: EVS }), b);
  const step = commit(atDecision, b, view(atDecision, b).presented.options[0].id);

  assert.equal(step.response.narrative.provenance, 'derived');
  const html = draw(step.run, b);
  assert.ok(html.includes(t('play.response_derived')),
    'a beat waiting for content must not look like a beat that has it');
  assert.ok(html.includes(`data-provisional="${t('provisional.badge')}"`));
});

test('★ Scene 4 renders canon\'s characters VERBATIM', () => {
  const b = bundle();
  let run = startRun({ bundle: b, config: EVS });
  while (currentSceneId(run) !== 'sc-01-04') {
    run = advance(run, b);
    run = commit(run, b, view(run, b).presented.options[0].id).run;
    run = advance(advance(run, b), b);
  }
  run = advance(run, b);
  const chosen = view(run, b).presented.options[0];
  const html = draw(commit(run, b, chosen.id).run, b);

  const authored = sceneOf('sc-01-04').immediate_effect.responses
    .find((r) => r.option_id === chosen.id).character_response;
  assert.ok(authored.length >= 2);
  for (const c of authored) {
    assert.ok(html.includes(c.character_id), `${c.character_id} is missing from the response`);
    // Verbatim: the sentence canon wrote, not a summary of it. Escaped for HTML
    // entities the renderer introduces, which is the only permitted difference.
    const escaped = c.responds.replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
    assert.ok(html.includes(escaped), `${c.character_id}'s line was altered`);
  }
});

test('no character is invented where canon is silent', () => {
  const b = bundle();
  const atDecision = advance(startRun({ bundle: b, config: EVS }), b);
  const step = commit(atDecision, b, view(atDecision, b).presented.options[0].id);
  const html = draw(step.run, b);

  assert.deepEqual(step.response.characters, []);
  assert.ok(!html.includes(t('play.who_responded')),
    'an empty "who responded" heading implies a silence that was never authored');
});

// --- the chrome survives the refactor ------------------------------------------

test('the register, the bell and the beat are named in words on every screen', () => {
  const b = bundle();
  const beats = beatsOf(1, b);            // sc-01-02: register `pressure`, bell `first_quarter`
  for (const phase of PHASES) {
    assert.ok(beats[phase].includes(t('register.pressure')), `${phase} lost the register`);
    assert.ok(beats[phase].includes(t('bell.first_quarter')), `${phase} lost the bell`);
    assert.ok(beats[phase].includes(t(`beat.${phase}`)), `${phase} does not say where the player is`);
  }
});

test('★ no locale key ever reaches the markup', () => {
  // t() returns ⟨key⟩ for a missing string, which is the right runtime
  // behaviour and the wrong thing for a reader to find.
  const b = bundle();
  for (const i of [0, 1, 2, 3]) {
    for (const [phase, html] of Object.entries(beatsOf(i, b))) {
      assert.ok(!html.includes('⟨'), `a missing string reached scene ${i}'s ${phase}`);
    }
  }
});

test('★ and the chapter ENDS — the last advance reaches a page, not a blank', async () => {
  const { ChapterEnd } = await import('../src/features/play/ChapterEnd.jsx');
  // The run-level exit beat. `view()` reports `complete`, and the surface
  // swaps to ChapterEnd; without this the last decision left a blank screen,
  // which reads as a crash rather than a conclusion.
  const b = bundle();
  let run = startRun({ bundle: b, config: EVS });
  let guard = 0;
  while (!run.complete && guard++ < 100) {
    run = run.phase === 'interactive'
      ? commit(run, b, view(run, b).presented.options[0].id).run
      : advance(run, b);
  }
  assert.equal(view(run, b).complete, true);

  const html = renderToStaticMarkup(
    ChapterEnd({ state: run.state, history: run.history, owed: run.state.pending ?? [] }));
  assert.ok(html.includes(t('chapter_end.heading')));
  assert.equal(run.history.length, 4, 'every scene contributed a decision to the record');
});

test('★ THE MIXED CASE — Scene 4 carries authored characters AND a derived narrative', () => {
  // ============================================================================
  // THE ONE COMBINATION CANON ACTUALLY PRODUCES, AND THE ONE MOST EASILY GOT
  // WRONG.
  // ============================================================================
  // Every Scene 4 response has an AUTHORED `character_response` and a NULL
  // `narrative_response` at the same time. Tested apart, both pass. Together
  // there are two ways to be wrong, and neither shows up in a separate test:
  //
  //   · the authored characters suppress the provisional mark, so a beat that
  //     is still waiting for its narration looks finished; or
  //   · the mark spreads to the authored characters, so canon's own sentences
  //     are labelled provisional when they are not.
  //
  // The badge must sit on the narrative and nowhere else.
  const b = bundle();
  let run = startRun({ bundle: b, config: EVS });
  while (currentSceneId(run) !== 'sc-01-04') {
    run = advance(run, b);
    run = commit(run, b, view(run, b).presented.options[0].id).run;
    run = advance(advance(run, b), b);
  }
  run = advance(run, b);
  const chosen = view(run, b).presented.options[0];
  const step = commit(run, b, chosen.id);
  const html = draw(step.run, b);

  // The premise: this really is the mixed case.
  assert.equal(step.response.narrative.provenance, 'derived');
  assert.equal(step.response.charactersProvenance, 'authored');

  // Both are on the page, in the same beat.
  assert.ok(html.includes(t('play.response_derived')), 'the derived narrative is missing');
  assert.ok(html.includes(t('play.who_responded')), 'the authored characters are missing');

  // ★ And the mark is on the narrative alone. The characters section opens
  // after the narrative block closes, so a badge on the response as a whole
  // would put `data-provisional` before the characters heading too.
  const badge = `data-provisional="${t('provisional.badge')}"`;
  assert.equal(html.split(badge).length - 1, 1, 'the provisional mark was applied more than once');
  assert.ok(html.indexOf(badge) < html.indexOf(t('play.who_responded')));
  const charactersMarkup = html.slice(html.indexOf(t('play.who_responded')));
  assert.ok(!charactersMarkup.includes('data-provisional'),
    'canon\u2019s own sentences were labelled provisional');
});

// --- the composition the BROWSER runs ------------------------------------------

test('★ the PRODUCTION composition renders EVS-3\'s observables — main.jsx dropped them', async () => {
  // ============================================================================
  // ⚠️ THIS TEST EXISTS BECAUSE 203 TESTS WERE GREEN AND THE BUILD WAS WRONG.
  // ============================================================================
  // `main.jsx` enumerated PlayScreen's props by hand while every test spread the
  // whole view. Two call shapes, one of them tested. EVS-3 added `roleVariant`
  // and `acknowledgeStake`; the tests saw them and the browser did not — so the
  // role panel and the private stake, the two things EVS-3 delivers, would not
  // have rendered in the deployed build.
  //
  // The fix was not a guard over the enumeration. It was removing the second
  // call shape: `PlayRoute` spreads the view once, and both `main.jsx` and this
  // test use it. `main.jsx` itself cannot be executed here — it calls
  // `createRoot` and reads `document` — which is exactly why the composition
  // had to come out of it.
  const { PlayRoute } = await import('../src/features/play/PlayRoute.jsx');
  const ATTESTATION = JSON.parse(
    (await import('node:fs')).readFileSync(
      new URL('../src/content/attestation.json', import.meta.url), 'utf8'));

  const b = bundle();
  const stake = 'A night shift where nobody could say which circuits were live.';
  const run = startRun({
    bundle: b,
    config: { role: 'role.quality-patient-safety', stake, displayName: 'Sorour' },
  });

  const html = renderToStaticMarkup(
    createElement(PlayRoute, { run, bundle: b, attestation: ATTESTATION }));

  // EVS-1: the provisional band is still on the page.
  assert.ok(html.includes(t('provisional.label')));
  // EVS-2: the beat is named.
  assert.ok(html.includes(t('beat.pre_commit')));
  // ★ EVS-3: the role's own position, and the private acknowledgement.
  const evidence = variantFor(CHAPTER_1.scenes[0], 'role.quality-patient-safety').evidence;
  assert.ok(html.includes(t('play.your_position')), 'the role panel is missing from the real route');
  assert.ok(html.includes(evidence), 'the role\'s evidence is missing from the real route');
  assert.ok(html.includes(stake), 'the stake is missing from the real route');
  assert.ok(html.includes('data-private="true"'));
});

test('the production composition ends the chapter too', async () => {
  const { PlayRoute } = await import('../src/features/play/PlayRoute.jsx');
  const b = bundle();
  let run = startRun({ bundle: b, config: EVS });
  let guard = 0;
  while (!run.complete && guard++ < 100) {
    run = run.phase === 'interactive'
      ? commit(run, b, view(run, b).presented.options[0].id).run
      : advance(run, b);
  }
  const html = renderToStaticMarkup(createElement(PlayRoute, { run, bundle: b, attestation: null }));
  assert.ok(html.includes(t('chapter_end.heading')));
});
