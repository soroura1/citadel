# `citadel` — status

**Last updated:** 2026-08-20 · ⚠️ **Merged but NOT DEPLOYED** — the owner raises deployments
**Topology:** [`../CLAUDE.md`](../CLAUDE.md) — `citadel.endura-assess.com` → `172.17.0.1:8087`,
`TARGET=/opt/citadel/citadel`.

## ★ EVS-6 — THE RECORD, THE REFLECTION, AND THE NOTE THEY TAKE AWAY

### FPE-04's named failure is closed

*"A chapter end that lists only scene titles"* is what `ChapterEnd` did, verbatim. Flagged at EVS-2,
owned here. `src/engine/record.js` + `RecordView` name the **specific option** committed to in each
scene, whether it was **decided or supported**, what was known at the time and **where each fact came
from**, and what moved.

⚠️ **The record is the second copy, by design — so it has to prove it agrees.** `recordRefusals()`
checks every `set_enum` effect against the live chapter state. A record that says one thing while the
state says another is worse than no record: the participant debriefs from one and the next chapter
runs from the other.

⚠️ **A history entry with no `changes` is REFUSED, not defaulted.** Runs saved before bundle `v0.5`
have none, and `?? []` would render *"nothing changed"* for a commitment that changed something.

### ⛔ Nothing leaves the client, and it is over-proved

`test/privacy.test.js` runs the whole flow — play, reflect, observe, export, resume, delete — with
**`fetch`, `XMLHttpRequest`, `sendBeacon` and `WebSocket` all replaced by throwing spies**, and a
second test proves the spies fire.

> **Four exits, not one.** A test that spies only on `fetch` proves nothing about `sendBeacon`, which
> exists to send data on the way *out* of a page and is what someone reaches for when adding
> analytics.

The private modules also import no gateway and name no URL — a module holding an endpoint is one
tidy-up from using it. **`participantRef` is an opaque local id**, never the display name: a record
keyed by a name is a document about a named professional's workplace.

### The six boundaries

`B1` private · `B2` no status field exists · `B3` **nothing congratulates** · `B4` uncertainty and a
follow-up question **required**, and refusing an empty one is what makes it real · `B5` the label
verbatim on the page *and* both exports · `B6` `promotion` stays null until `Q19`.

`B2`/`B3` are enforced by **absence plus `additionalProperties: false`** — such a record is
unrepresentable, not refused. The contracts schemas refuse all six mutations in
`content-conformance.test.js`.

⚠️ **Ajv is not in the browser bundle.** It would multiply the bundle for a check the tests already
make, and this audience is on slow connections. `observation.js` mirrors the schema with named
refusals instead.

### Reflection: open text, and the wording that is owed

Three prompts, **no options anywhere**, `quality: null` until `Q20`. One is **derived** — it names the
participant's own last commitment; two are **written**, cited to the definition of done's function
line, with final wording recorded as owed.

⛔ **Nothing enumerates what the participant did not find out.** The undiscovered evidence is knowable
and would be easy to list. **A list of your gaps at the end of a chapter is a mark**, whatever
sentence surrounds it.

### Local, and deletable

`local-store.js` takes an **injected** store. Delete removes **everything including the participant
id** — a delete that leaves the id leaves the thread tying a future record to the same person — and
the list is derived from `KEYS` so a key added later cannot be forgotten. Tests **enumerate** the
store afterwards; a deletion test that cannot list what remains is asserting the call did not throw.

**Bundle `v0.4` → `v0.5`** (history gained `changes`). Surfaces: `/record` and `/observation` added,
and both removed from `PLANNED_SURFACES`.

### ⚠️ ONE COMPOSITION — and the fourth time this shape appeared

`main.jsx` cannot be executed by a test (`createRoot`, `document`), so anything composed there is
untested **by construction**. This build has now paid for that four times: enumerated props at EVS-3,
a walker pinned to one role at EVS-4, slot fixtures the content never produced at EVS-5, and here the
store wiring, the export and the **delete** — the two paths whose whole point is what does and does
not leave the device.

`ObservationRoute` owns that wiring, `main.jsx` mounts it, and the tests render the same component
the browser does with an enumerable memory store.

> The `saved` mapping is bespoke — the screen holds `{key: text}`, the contracts require
> `responses: [{promptKey, text}]` and `sections: {name: {promptKey, text}}`. **Exactly the small
> translation that works until the day it returns `{}` and a participant's saved note appears to have
> vanished.** Breaking it fails 3 tests.

### ⚠️ The JS bundle has no budget, and it grew 25% in one session

**366 KB / 103 KB gzip**, from ~293 KB before EVS-6. Verified: **no Ajv, no `postgres`, no
TanStack** in the output — it is React plus the new screens.

`Q24` covers the **image** weight budget; **nothing covers JavaScript.** The precedent is real (the
prior trial trimmed 203 → 196 KB deliberately) and this audience is on slow connections, so the
absence of a stated ceiling is an owner gap rather than something to invent a number for. **Flagged
for EVS-7's parity pass.**

## ⛔ EVS-5 — THE VISUAL BINDING GATE IS **HELD**, NOT PASSED

The reviewed design package EVS-5 §3 requires **does not exist**: eleven `v0.1` concepts in the story
record, every one *"pending project-owner review"*; **no plan or cutaway asset**; no state frames, no
crops, no declared alt text, no weight budgets; and **`Q10` — the inclusion reviewer — open.**

So no image is bound, and **nothing was faked** — no CSS drawing, no handcrafted SVG, no emoji, no
placeholder box. `visualBindingStatus()` is computed from the slots, so the build cannot claim more
than the content does.

### What shipped instead — the semantic place model

`src/content/places.json` · `src/engine/place.js` · `/place` surface. **Ten locations, canon's five
tiers, symmetrical routes**, and location states derived from the chapter enums.

> **The tiers do the design package's dramatic work, in text.** Canon: *"the Underworks make every
> visible function possible. They are also a physical representation of **hidden dependencies** and
> neglected maintenance."* Chapter 1's mystery is two supplies shown as independent on the official
> map, passing through one chamber in that layer. Grouping the place by tier puts the map's own blind
> spot on the page **as a heading** — at no visual cost, and the drawn plan inherits it rather than
> replacing it.

**World memory is derived, not stored.** The chapter enums already record what was committed; a
second copy of *"what the ICU is like now"* would disagree with the first the moment one was updated.

### ⚠️ The asset slot was a string, and two rules were inert because of it

`contracts@v0.7.0` — **breaking.** The manifest read `slot.id` while the content shipped bare
strings, so **all eight of Chapter 1's slots reported as `sc-01-01:?`**, and
`assertPlayableWithoutArt`'s REQUIRED check — the rule that keeps play from depending on an image —
read `slot.required` on a string and **could never fire**.

Both were tested. Both were tested on **object fixtures the content never produced.**

A slot now declares `alt_key` and `max_bytes` before anything fills it, and one claiming
`inclusion_reviewed` must **name the reviewer**. `PlayScreen`'s hardcoded two-filename map is gone —
the art comes from the slot, so the surface has no second inventory to drift from.

**Bundle unchanged; `contracts` `v0.6.0` → `v0.7.0`.**

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
