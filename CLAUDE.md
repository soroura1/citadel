# `citadel` — status

**Last updated:** 2026-08-20 · ⚠️ **Merged but NOT DEPLOYED** — the owner raises deployments
**Topology:** [`../CLAUDE.md`](../CLAUDE.md) — `citadel.endura-assess.com` → `172.17.0.1:8087`,
`TARGET=/opt/citadel/citadel`.

## ★ EVS-4 — INSPECT, CONSULT, COMMIT. THE PARTICIPANT INVESTIGATES.

Through EVS-3 a scene presented its movements and then its options: nothing was found, everything
was told. **Both new action types are canon's, transcribed rather than designed:**

> *"place detailed timings in **optional inspection** or the later review rather than long crisis
> dialogue"*
> *"The selected role supplies one direct authority. The player must **seek other judgments** from
> named clinical, nursing, operational, safety, information, and city partners."*

`src/engine/evidence.js` · `contracts@v0.6.0` · **17 actions, 21 pieces of evidence**, each citing the
canon passage it came from — the schema refuses one that does not.

| | |
|---|---|
| **Inspect** | Reads a place, instrument or record. Always answers |
| **Consult** | Asks a person — who may answer, **qualify, refuse or withhold**. Only a person can decline, which is why they are separate controls |
| **Commit** | Already existed. The only one that moves the beat |

### Evidence carries its source, because the chapter turns on that

The Hall reads *"backup generation active"*, which is true, while eight ICU beds have no supply,
which is also true. **A run holding one world state cannot express that; one holding who-said-what
can.** Every discovery records the action it came through and the person, instrument, place or
record behind it.

### ⚠️ The guarantee is now a LOAD-TIME property

Canon: *"a required mystery clue... **cannot disappear because of role selection**."* EVS-3's check
was that every role had a route *sentence* — true of prose, silent about play. The moment an action
carries `visible_to_roles` a reveal can become genuinely unreachable for one role, **and it looks
correct in review because the other role reaches it.** `loadBundle` refuses such a bundle, and the
walk follows `requires` chains rather than checking one step.

### FPE-05, inverted — and the trap on the other side

A risk may be withheld until the evidence is held. ⚠️ **`protects` is never withheld and no field
exists to withhold it**, and **at least one risk per decision stays ungated** — a participant who
investigated nothing must still meet a real trade-off, or three options read as three ways of being
right.

⚠️ **A cost is a declared note in canon's own currency, never a quantity.** Canon names time, trust,
workload, service capacity and evidence, and sets no prices. Nothing sums them.

⚠️ **No dialogue was written.** Canon authors the **act** — *"Fadl classifies the patient-safety event
and sets quality follow-up **without taking clinical or electrical authority**"* — and not the line.
`says` is unrepresentable; `dialogue_unresolved` records the owed line.

**Bundle `v0.3` → `v0.4`.**

## ⚠️ ONE CALL SHAPE. `PlayRoute` composes the play surface; `main.jsx` mounts it.

`main.jsx` enumerated `PlayScreen`'s props by hand while every test spread the whole view. **Two
call shapes, one of them tested.** EVS-3 added `roleVariant` and `acknowledgeStake`; the tests saw
them and `main.jsx` dropped them — so the role panel and the private stake **would not have rendered
in the deployed build, with 203 tests green.**

`main.jsx` cannot be executed by a test (`createRoot`, `document`), so the fix was not a guard over
the enumeration — it was **removing the second call shape.** `src/features/play/PlayRoute.jsx`
spreads the view once, and both `main.jsx` and `test/render.test.js` use it.

> **Never enumerate `PlayScreen`'s props.** A named list is a second definition of what the surface
> needs, and the two drift silently.

## ★ EVS-3 — SETUP IS A CONTRACT. THREE CONTROLS WERE REMOVED.

`src/content/roles.json` names the **two** roles the slice carries; the other **fourteen are
computed** from the scenes' own `role_variants`, so a hand-written exclusion list cannot go stale.

| Control | EVS-3 |
|---|---|
| Role | **Two selectable.** The variant renders — evidence and contribution — so the choice is visible |
| Stake · name | Kept. Acknowledged **once**, privately, at the beat canon names ("confirms role and personal stake") |
| Language | Kept, and it now **applies** — it was collected and discarded |
| Tendency · scenario · severity | ⛔ **Removed.** Canon authors none of the three for Chapter 1 |

A disabled control still promises, so they were removed rather than greyed. **`defineScenario` and
`startingStateFor` stay** — the synthetic eighth scenario is R3's configurability proof.

### ⚠️ A missing role WAS unrestricted authority

`presentOptions` read `!requires_authority || !role || …`. A run with no role passed **every**
authority gate — and every test started a roleless run, which is exactly the case that skipped it.
`startRun` now refuses `run-has-no-role` and `role-not-selectable-in-this-slice`; the decision layer
refuses too, because a bundle can be driven from a script.

> ⚠️ **Consequence for `/play`:** a deep link used to call `startRun` with no config. That now
> **throws during render** — the blank-page shape from 17 August. `/play` without a run renders
> setup instead. Never guess a role: a role chosen for the participant is the same default.

### ★ SUPPORT — the decision EVS-3 had to take

Canon holds both *"no solo player gains fictional authority to make every decision"* and *"the player
influences which system carries the resulting pressure"*. **Neither EVS role holds authority over the
power-pressure or capacity decisions** — that is canon, not an oversight — so the slice's own two
roles could not reach the commitment the EVS gate requires.

`FPE` §2's commit beat reconciles them: the player *"decides, escalates, delegates, negotiates **or
supports another person's proposal** under a named constraint."* An unauthorised role **supports** a
pathway, the authored effects apply, and the record says `committedAs: 'decision' | 'support'`.

⚠️ **Deciding stays refused.** `role-lacks-authority-to-decide` fires for a caller that asks to
decide. Nothing was invented and no authored decision was edited.

**Bundle `v0.2` → `v0.3`** — the run shape gained `stake` and `locale`, and requires a role.

## ★ EVS-2 — ONE BEAT AT A TIME. `chooseAndAdvance` IS GONE.

`view()` **projects**: it carries only what the current phase stages. At `pre_commit` the turn is
not hidden by a conditional — it is not in the props. A component trusted not to draw something it
holds is one careless edit from drawing it.

| Act | Call |
|---|---|
| Decide | `commit(run, bundle, optionId)` — applies, composes the response, **stops** at `post_commit` |
| Leave | `advance(run, bundle)` — one beat, or out of the scene |

⚠️ **`chooseAndAdvance` was deleted, not kept.** It applied the effects and moved to the next scene
in one call, so the response beat had nowhere to happen. Left beside `commit` as a convenience it
would have been a second, shorter path that skips `FPE-02` — and `main.jsx` was one refactor from
calling it.

**The beat IS the staging phase.** The session plan's seven beats are two run-level surfaces
(`SetupScreen`, `ChapterEnd`) plus EVS-1's four phases. A second enum synchronised to those four
would be two definitions of one sequence.

### What the response is made of — and what it is not

Canon authors **no** post-commitment narration, and character reactions for **one** decision. So
eleven responses are composed thin from the option's own `protects`, `risks` and visible effects —
restricted to the sources `derived_from` declares — and **carry the provisional band**. Scene 4's
three carry Fadl, Maha and Rami verbatim, and take precedence.

⛔ **A character reaction is NEVER derived.** `protects` and `risks` are the option's properties, not
a person's; a name in front of them would be an invented performance.

## ★ EVS-1 — the content is now VALIDATED against the contract it pins

`test/content-conformance.test.js`. Until it existed, **this repository pinned a schema it never
ran**: `check-repo.sh` proved the pin was an exact tag, and `npm run conformance` ran *contracts'*
suite against *itself*. Neither looked at a scene.

> **It failed on its first run.** `bell` had shipped in all four scenes (PR #25) and was never added
> to `scene.schema.json`, which is `additionalProperties: false` — so every Chapter 1 scene had been
> invalid against its own contract since that merge. Fixed in `contracts@v0.5.1`.

⚠️ **The defect was the missing check, not the missing field.** A consumer that pins a contract and
never runs it has paid the tag-and-pin cost and bought none of the safety.

## The scene contract says WHEN — and EVS-2 renders it

`contracts@v0.5.0` added `staging` (four phases) and `immediate_effect`; all four Chapter 1 scenes
carry both. `src/engine/staging.js` holds what a schema cannot see — a movement staged twice or
nowhere, an option with no response — because those need two documents at once. EVS-2 made `view()`
walk it, so `FPE-01` holds in the markup and not only in the data.

**Bundle `v0.1` → `v0.2`.** The scenes changed shape, so a run saved under `v0.1` refuses to resume —
which is what pinning the version into the save is for.

## To finish the first deploy

`.env` is **VPS-owned and CI never writes it**, so the first deploy of any service fails until it
exists:

```bash
sudo mkdir -p /opt/citadel/citadel
sudo tee /opt/citadel/citadel/.env >/dev/null <<'EOF'
APP_BASE_URL=https://citadel.endura-assess.com
HOST_BIND_IP=172.17.0.1
HOST_APP_PORT=8087
API_UPSTREAM=172.17.0.1:8086
EOF
```

Then **raise a deployment** in Woodpecker. Merging does not deploy.

## ★ The same-origin proxy is load-bearing

The gateway calls `/api/content/*` with `credentials: 'include'`, and citadel's Caddy proxies that
to `API_UPSTREAM`. **That is the only reason the session cookie travels.**

Point it at a cross-origin absolute `VITE_API` and the walk breaks **silently** — no CORS error,
just a 401 at the final step. The mirror-image failure already happened: `checklist-api` could not
*read* cookies for the whole of R0 because `@fastify/cookie` was never registered, **and every
automated check still passed**, because nothing ever presented a credential.

## ⚠️ citadel now has a DATABASE — and `.env` must be edited before the next deploy

R3 Phase D added story-content tables. `/opt/citadel/citadel/.env` needs two new variables:

```
OWNER_DB_PASSWORD=...
APP_DB_PASSWORD=...
```

**`deploy.sh` stops with the variable named** rather than half-configuring — trap `T25`, working as
designed. Migrations run **before** the app restarts; if they fail the previous release keeps
serving.

> **How this gap happened, recorded because it is instructive.** Phase D built the tables, proved
> them against a real Postgres, and shipped **neither the migration nor a database** — `migrations`
> was absent from `RELEASE_PATHS` and the compose had no `db`. That is the same shape as the defect
> `DEC-023` exists to fix (*"an engine with nothing able to feed it"*), one layer down: **a pipeline
> with nowhere to live.**

## The R0 placeholder session — delete at R2

`src/main.jsx` sets `citadel_session` itself, because R0 has no identity and `requireSession`
validates presence only. **Two lines, marked for deletion.**

⚠️ That is R2 task **`E6`, which needs Phase C** — deleting it before the native issuer exists breaks
the deployed walk.

## Reachability — four assertions, the fourth closed at EVS-2

Routing · navigation inventory · **deployed bytes**. The prior attempt shipped **six screens nobody
could reach**, one for four consecutive releases.

### ⚠️ All three passed while the production page was BLANK

17 Aug: `<Navigation>` used TanStack Router's `<Link>`. **R0 mounts no `RouterProvider`** — it
navigates with `window.history`, because a real router lands at R3. The Link read a null router
context and threw `Cannot read properties of null (reading 'stores')` during render.

The build succeeded. 17 tests passed. All three reachability assertions passed. `/version`,
`/health` and the API all returned 200. **`H5` — a human opening the page — found it in one click.**

**Every assertion is about whether a surface CAN be reached. None EXECUTES it.**

| | |
|---|---|
| ✅ In place now | A static guard: no `@tanstack/react-router` import while nothing mounts a `RouterProvider`. It retires itself when R3 adds one |
| ✅ **Closed at EVS-2** | **The render assertion.** `test/jsx-hook.mjs` registers a synchronous `esbuild.transformSync` load hook, so `node --test` can import `.jsx`. `test/render.test.js` executes `PlayScreen` through `renderToStaticMarkup` and asserts on the markup |

⚠️ **Why not vite's `transformWithEsbuild`:** it is exported and it is **async**, while
`module.registerHooks` is synchronous. An async transform needs `module.register` and a worker
thread. Do not "simplify" the hook back to vite's helper without also moving to that loader.

`SURFACES` in `src/surfaces.js` is the source of truth; the manifest is computed, never written.

```bash
export PATH="/opt/homebrew/opt/node@26/bin:$PATH"
npm test && npm run build && ./check-repo.sh
```
