# `citadel` — status

**Last updated:** 2026-08-22 · **R0-I1 LIVING MORNING MERGED; `R0-G02` AWAITS THE OWNER.**
**Topology:** [`../CLAUDE.md`](../CLAUDE.md) — `citadel.endura-assess.com` → `172.17.0.1:8087`,
`TARGET=/opt/citadel/citadel`.

---

## What happened

On **2026-08-21** the owner chose to start the product over. Everything that was a game was
deleted from this repository in one commit: the engine, every surface, all Chapter 1 content, the
locales, the stylesheet and all twenty-four test files.

**This was a decision, not a failure.** The build worked — it deployed, it passed every check, and
its last session ended with four hundred and twenty-six green tests. It was judged the wrong thing,
and reworking it would have cost more than rebuilding it against the planning that already exists.

⚠️ **Nothing was tagged or branched to preserve it, by instruction.** The work is reachable in
`git log` and nowhere else. `b007a38` is the last commit before the reset.

On 2026-08-22 the owner asked to merge the reviewed XP0 visual pilot so it could be deployed. XP0
is now a participant-visible application: portfolio/format setup, an ordinary operational map,
two-of-four preparedness work, the local ICU electrical interruption, bounded response, recovery,
improvement, causal debrief and a structured equivalent. It is explicitly **not** the R0 simulation
or evidence of learning/readiness.

---

## ★ R0-I1 — the morning is simulated now

`R0-C01`–`C04` landed as one increment. The ordinary phase is no longer a fixed picture with a
narration button: a deterministic world runs two bounded heartbeat cycles, and the map, the
structured view, the status strip, the inspector and the announcements are all projections of it.

```text
src/sim/          world · commands · events · rules · reduce · clock · heartbeat · rng · engine
src/projections/  anchors (place-local) · slots (candidate binding) · project (one pass)
src/features/morning/  useRun + seven components
public/layers/    five candidate operational layers + low-bandwidth derivatives
```

| Invariant the model refuses to break | Where |
|---|---|
| Physical ICU capacity never implies staffed capacity | `world.js` · separate fields, separately reported, `staffed > physical` refused |
| A technical team is available **or** assigned, never both — nor assigned while still at its origin | `worldProblems` |
| A moved reserve keeps its origin, custody and donating service | `reduce.js` deliberately does not spread them from the event |
| A refused command returns the **same world object** | `dispatch` · asserted by identity, not deep equality |
| No patient record and no score can exist in the world | checked on the **shape**, not on intent |

★ **The three ordinary states are read, not stored.** `classifyOrdinary` derives
`ordinary-steady`/`high-stable`/`rising` from demand, staffed coverage, custody and technical
assignment. Nothing writes a state name into the world, and no fixture table from the V04 board was
copied into the engine — § 19.4 forbids exactly that.

★ **The non-timed path is the same path.** `running` and `act-advanced` reach the cycle through one
command and emit byte-identical operational events; a test strips the mode change and compares.

### ⚠️ Three defects a browser found and 64 green tests did not

1. `.change` had no style, so the announcement read `"ED demandretained arrivals advanced…"` —
   correct content, unreadable, and invisible to a markup assertion because both strings were
   present and correctly ordered.
2. `vectorEffect="non-scaling-stroke"` reinterpreted a 0.55 **map-unit** stroke as 0.55 **CSS
   pixels**, so the whole route grammar drew as hairlines.
3. A `0 0 100 100` viewBox with `preserveAspectRatio="none"` flattened every origin node into an
   ellipse.

All three are fixed. The lesson is the repository's own: *open the page.*

### ⛔ What this increment does not claim

Nothing is bound. `VA-013`–`VA-017` are candidates, every slot records `reviewed: false` and
`reviewGate: Q10`, and the map says so on its face. There is no preparedness mechanic (`R0-C05`), no
pressure director (`R0-C06`) and no save surface (`R0-C09`); incident, recovery and debrief are the
untouched XP0 treatment. **`R0-G02` is Review, not Passed**, and no deployment was raised.

⛔ **Known limitation:** at ~990 px map width the candidate cutouts compete focally with the
populated base painting. That is the `R0-V03` review point already on record; the route grammar,
origin nodes and structured world carry the state regardless, and the answer belongs to `Q10` and
`R0-V10`, not to enlarging a master past its permitted range.

---

## What is left, and why each piece survived

| Kept | Why |
|---|---|
| `package.json`, `package-lock.json`, `vite.config.js`, `index.html` | The build |
| `.woodpecker.yml`, `check-repo.sh`, `scripts/` | The pipeline and the three-condition deploy gate |
| `deploy.sh`, `citadel.Caddyfile`, `docker-compose.prod.yml`, `deploy.env.example`, `migrations/` | The deployment. ⚠️ The migrations are kept because `deploy.sh` runs them; the tables they create are for content that no longer exists |
| `public/scenes/*.jpg` | **Assets.** Six candidate images, including ordinary/outage R0 map references; none reviewed, `Q10` still open |
| `README.md`, `LICENSE`, `CONTRIBUTING.md`, `RELEASES.md`, `docs/` | Governance. `check-repo.sh` requires the scope statement in `README.md` verbatim |
| `src/main.jsx`, `src/App.jsx`, `src/styles.css` | The shell. ⚠️ `operate` is now simulation-driven; incident, recovery and debrief remain prototype-local until `R0-C06`–`C09` |
| `test/xp0.test.js` | XP0 entry, complete walk, safety text, asset existence and image-budget checks |
| `test/domain.test.js`, `test/projection.test.js`, `test/living-morning.test.js` | R0-I1: refusals, determinism, pause, chronology, capacity separation, custody, projection parity, the three states, raster removal and the boundary |
| `test/jsx-hook.mjs` | ⚠️ Restored. Without it no test can import a `.jsx` module, so no test can render one — and this repository has already shipped a blank production page past a green suite |

---

## The state of the pipeline

```bash
export PATH="/opt/homebrew/opt/node@26/bin:$PATH"
npm test && npm run build && npm run conformance && ./check-repo.sh
```

All four must pass before merge. XP0 adds its real UI, fonts, icon library and candidate visual
assets; inspect the emitted build rather than comparing it with the former empty bundle.

⚠️ **`npm run conformance` still passes because the contracts pin is a TAG.** This repository pins
`@citadel/contracts#v0.8.0`, and a tag is immutable, so resetting `contracts` on `main` cannot reach
it. The same is true of the live `checklist-api`, which pins `v0.2.2`.

---

## What has NOT changed

| | |
|---|---|
| **The deployed site** | Still serving `407d151` from 20 August until the owner raises the next deployment. The merged XP0 replaces the placeholder risk with an intentionally deployable visual pilot |
| **The two owner actions** | `VPS_HOST` → `172.17.0.1`, and `chown -R deploy:deploy /opt/citadel/citadel`. Still outstanding, still blocking any pipeline deploy |
| **The planning and the story** | Untouched. `citadel-planning/` and `resilience-citadel-story/` are the authority the rebuild works from |
| **`checklist-api`** | Live, untouched, unaffected |

---

## Working rules that survive the reset

They were not what went wrong.

1. **Branch → PR → green → merge.** Merging is Claude's; **raising a deployment is the owner's.**
2. **Story canon wins.** [`../../resilience-citadel-story/`](../../resilience-citadel-story/) is the
   authority on the fiction.
3. **A rule with no field to key on cannot fire**, and a check that passes because there is nothing
   to check certifies nothing. Both were learned here, repeatedly, at cost.
4. **Never enumerate a component's props by hand.** Two call shapes drift, and only one of them is
   tested.
5. **`main.jsx` cannot be executed by a test.** Anything composed there is untested by construction.
   This repository paid for that six times.
6. **Node must be 26.** The default `node` on the owner's machine is v20 and every test file fails
   to load under it, for a reason that has nothing to do with the code.

---

## What comes next

The owner may raise the XP0 deployment. Production R0 remains held by
[`../../citadel-planning/06-releases/RELEASE-PROGRESSION.md`](../../citadel-planning/06-releases/RELEASE-PROGRESSION.md): XP0 deployment is review evidence, not automatic R0 authorisation.

R0-V04 is complete in the planning visual bible and story visual evidence. Its reversible comparison
board proves ordinary-steady, ordinary-high-stable and ordinary-rising state treatments over the
accepted XP0 map, including labels-off, reduced-motion and structured equivalents. None of that work
entered this repository or bound a candidate as canonical. R0-C01 is now the next task; C01–C04 must
land as one participant-visible living-morning increment before G02.

When R0 is authorised, work follows the ledger's R0-I0–I5 sequence:

1. Select only the first unblocked visual/code task in the current increment and mark it in progress.
2. Preserve the XP0 walk; replace facilitator state incrementally with deterministic projections.
3. Do not merge an invisible kernel checkpoint. Every merge must add a participant-visible,
   browser-verifiable capability while keeping the prior walk functional.
4. Run focused tests plus `npm test`, `npm run build`, `npm run conformance` and `./check-repo.sh`
   under Node 26; verify visual and structured paths in the production build.
5. Record PR/commit, tests, visual evidence, limitations and next task in the release ledger and all
   applicable CLAUDE files.
6. Stop at the integration gate. Branch → PR → green → squash merge; never raise deployment.
