# `citadel` — status

**Last updated:** 2026-08-21 · ⚠️ **Merged but NOT DEPLOYED** — the owner raises deployments
**Topology:** [`../CLAUDE.md`](../CLAUDE.md) — `citadel.endura-assess.com` → `172.17.0.1:8087`,
`TARGET=/opt/citadel/citadel`.

## ★ CURRENT PRODUCT WORK — SG-1 STRATEGY GAME GOLD SLICE

`DEC-031` supersedes the instruction to move directly into formal human validation. EVS-1–7 remain
the technical foundation, but the owner found the experience still too document-like to fairly test
as the intended game. SG1-1 designed it and SG1-2 made it representable and refusable;
**the next bounded handoff is SG1-3** (`D1`–`D10`, the candidate visual package) or **SG1-4**
(`E1`–`E7`, the game shell) in
[`../../citadel-planning/06-releases/SG1-tasks.md`](../../citadel-planning/06-releases/SG1-tasks.md).
**No production UI before SG1-4.** Formal human validation waits for the SG-1 gold-slice
candidate. Do not deploy.

### ✅ SG1-2 — the contracts half. An option can cost something now.

`contracts` **`v0.7.0` → `v0.8.0`**, pinned and running. Additive: every prior scene and decision
still validates.

| Added | Where |
|---|---|
| Five **capabilities** — a named holder in a named state | `src/content/capabilities.json` · `src/engine/opportunity.js` |
| Five **instruments**, each with what it must never imply | `src/content/instruments.json` · `src/engine/instrument.js` |
| `commits`, `transfers_pressure_to` and per-pathway `residue` on the gold decision | `src/content/decisions/dec-01-power-pressure.json` |
| Instrument **readings**, performed **character beats**, and a four-layer **world response** | `src/content/scenes/sc-01-02.json` |
| Four new load-time refusals | `src/engine/bundle.js` |
| The six named mutations | `test/strategy.test.js` |

⛔ **THERE IS NO NUMBER IN THE OPPORTUNITY MODEL, AND A TEST ENUMERATES THE WORDS.** No `amount`,
`remaining`, `count`, `total`, `max`, `units`, `level` or `points` on a capability or a commitment.
Canon names time, trust, workload, service capacity and evidence as this world's currencies and sets
no prices; EVS-4 already wrote the rule down — *a cost is a declared note in canon's own currency,
never a quantity.* The constraint is **exclusivity**: a holder can be in one place doing one thing,
which survives the removal of every clock and is why the non-timed accessibility path carries the
same trade rather than a relaxed one.

### ⚠️ The first mutation test failed, and the rule it exposed was better than the rule I wrote

The intended invariant was *an option that commits nothing is refused*. Written that way it **could
not fire on the mutation it existed for** — the check only looked at options that already had
commits, so emptying one slipped straight past.

The honest rule turned out to be narrower and stronger: **within one decision, either every pathway
costs or none does.** Demanding commits everywhere would have forced this session to retro-fit three
scenes it does not own; demanding them nowhere permits **one free pathway beside three costly ones**,
and a free pathway beside costly alternatives is not an alternative — it is the answer. Both halves
are now tested, including the case that must still load.

### ⚠️ And the world-binding check found a content defect on its first run

`beat-for-a-character-who-is-not-present`, four times. Scene 2's `present` list read *"Head Sister or
duty critical-care nurse"* and *"biomedical support"* while canon's Scene 2 names **Nour** and
**Yasin** outright. The content had paraphrased the cast and lost the names, and nothing could see it
because no rule had ever compared a beat against the people in the room. Corrected to canon's own
wording.

### What SG1-2 does NOT do

**Nothing renders yet.** Instruments, capabilities, comparison and character beats are
*representable, validated and refusable* — no surface shows them. The record is the one exception:
it now carries what was committed, where the pressure went and a per-pathway residue with its
bindings, because it was already the place a cost should have been readable. `E6`, `E8`, `E9` and
`E13` own the surfaces.

⚠️ **The JS bundle grew 368 KB → 404 KB** (103 → 114 KB gzip) — the new content JSON. `Q24` covers
the image budget; **nothing covers JavaScript**, and this audience is on slow connections. Still an
owner gap rather than a number to invent, and now larger.

### ✅ SG1-1 is done, and it found something the suite cannot

Design only — **this repository was not modified.** The design lives in
[`../../citadel-planning/01-game-mechanics/strategy-gold-slice-design.md`](../../citadel-planning/01-game-mechanics/strategy-gold-slice-design.md)
and [`../../citadel-planning/07-visual-and-art/SG1-spatial-play-spec.md`](../../citadel-planning/07-visual-and-art/SG1-spatial-play-spec.md);
the audited before-state is
[`../../citadel-planning/06-releases/SG1-before-state-audit.md`](../../citadel-planning/06-releases/SG1-before-state-audit.md).

⛔ **`saveRun` and `loadRun` are called by no source file.** `grep -rn "loadRun\|saveRun" src/`
matches only their own definitions in `src/engine/local-store.js`. `main.jsx` holds the run in
`useState(null)` and never persists or restores it — so a participant who reloads loses everything,
and `/record` answers *"No run on this device yet"* after a full scene of play.

> **`test/evs-walk.test.js` saves and loads the run itself at every beat**, which is why an accurate
> suite reports a resume the deployed application does not have. This is the **seventh** appearance
> of the shape this file has recorded six times: behaviour composed in `main.jsx`, where no test can
> execute it. `E14` owns the fix; the walk should stop driving the store and assert that the
> application did.

⚠️ **Internal production language is inside the participant flow**, on every screen: the attestation
notice, the burned-in `PROVISIONAL — PENDING INCLUSION REVIEW` band, `/place`'s
`7/9 slots name a concept · 0/9 reviewed · blocked by Q10`, `Art slot, unfilled: slot.ch01.…`, raw
`Connects to: loc.icu-threshold` identifiers, and `C1_POWER_RESPONSE local stabilization` in the
record. Each was the right call for an internal build and none may reach a candidate participants
meet — `G6`.

★ **Role variation, measured rather than asserted.** Both playable roles walked the whole chapter
taking every action: **17 actions each, one differing** (`consult.01.02.nursing-leader` against
`consult.01.02.fadl`), **20 pieces of evidence each, one differing**, identical decisions, identical
commit modes, and **byte-identical `/place` markup** after a full run.

⚠️ **Run the checks under Node 26.** The default `node` here is v20.12.2, which has no
`module.registerHooks`, so `test/jsx-hook.mjs` fails to load and **every** test file reports red for
a reason that has nothing to do with the code:
`export PATH="/opt/homebrew/opt/node@26/bin:$PATH"`.

## ★ EVS-7 — TECHNICAL SEQUENCE COMPLETE; HUMAN GATE HELD FOR SG-1

`test/evs-walk.test.js` runs the arc a participant runs — setup, four scenes with every action taken,
response, residue, record, reflection, private observation, export, **a reload at every beat**, and
the delete — **for both roles × both paths**, through the production routes.

| | |
|---|---|
| **Text parity is a DIFF, not a claim** | From the decision onward the two paths are asserted **byte-identical once `<figure>` is stripped**. The authored `text_equivalent` at `pre_commit` is the one designed difference, skipped by name |
| **Resume at every beat** | *"Runnable from a clean local start"* includes closing the tab mid-scene, which is what an interrupted professional does |
| **Both roles reach the clue** | Canon's promise, asserted on the walk and not only in the loader |
| **Every exit sealed on all four walks** | A beacon added to a scene renderer would escape a test that only walks the note |

`test/accessibility-parity.test.js` is the **mechanical floor**: keyboard-completable at every beat,
no interactive `div`, no positive `tabindex`, no text container clipping, reduced motion with the
register still in words, every image lazy with real alt text, and **strip every image and the chapter
still plays**.

⛔ **That is not the gate's Accessibility dimension.** That is a person using their own assistive
technology, and **`Q11` is open.**

### ⚠️ Sixth and final appearance of one shape

`SetupRoute` took the last wiring out of `main.jsx` — which roles are offered, and the `setLocale`
that must run **before the next screen renders**. That line was EVS-3's fix for a language collected
and discarded, and no test had ever run it.

### The evidence pack is generated, not typed

```bash
npm test && npm run build && ./scripts/evidence-pack.mjs        # add --json for CI
```

Commit, tree-clean flag, Node, contracts pin, bundle version and attestation state, test result,
**the weight a participant downloads**, language coverage, visual binding, and what the slice
contains. The human half — protocol, observation sheet, eight dimensions, twelve limitations — is
[`citadel-planning/06-releases/EVS-evidence-pack.md`](../../citadel-planning/06-releases/EVS-evidence-pack.md).

> **A pack with hand-written counts is stale the first time somebody adds a test.** `check-plan.sh`
> refuses one in a normative document for that exact reason.

### ⚠️ Two checks pass because a feature is absent — and both fail when it arrives

The timer scan (no timer) and the audio check (no audio). Recorded as limitations rather than counted
as coverage, and the audio one asserts the **absence** of `<audio>`, so the day a sound is added the
captions, independent volume and silent-equivalent path become due.

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

## ⛔ EVS-5 — THE VISUAL BINDING GATE IS STILL **HELD**, WITH THE PLAN NOW IN IT

**`VA-012` exists.** The Bimaristan cutaway was generated and derived to **354,077 of the 400,000
bytes this slot declared before the image existed** — which is the whole reason declaring the budget
first meant anything. `/place` renders it from `PLAN_SLOT.candidate_file`, at intrinsic size, lazily,
under the provisional band, beside the **complete** text equivalent.

⚠️ **A candidate is not a binding, and that distinction is the gate.** `inclusion_reviewed` is false
and `reviewed_by` is null because **`Q10` is open**. Building against a candidate is permitted;
treating one as canonical is not — the story record says the same in its own words.

**The design package is `partial-candidate-generated`, not present.** §3 also requires target frames
for the Gate/emergency and ICU power-interruption **states**, character-state treatments,
Measure/board states and the two transitions. **None of those exists.** Reporting "present" because
one item arrived would be the status claiming more than the content holds.

**Nothing was faked** — one real candidate, no CSS drawing, no handcrafted SVG, no emoji, no
placeholder box. `visualBindingStatus()` is computed from the slots, so the build cannot claim more
than the content does.

> ★ **The parity test changed meaning, and that is the point.** Before `VA-012` it asserted no
> `<img>` existed — easy, and proof of nothing. Now there is a picture, so parity has to be *earned*:
> the test strips every `<figure>` and asserts that **every location, tier, state and route is still
> readable in words.**

### The semantic place model the plan illustrates

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

### ⚠️ FIFTH APPEARANCE OF ONE SHAPE — `PlaceRoute`

The `here` computation — which locations are marked *"you are here"* — lived in `main.jsx`, where no
test can run it. `PlaceRoute` owns it now. **This shape is being removed on sight**: enumerated props
at EVS-3, a walker pinned to one role at EVS-4, slot fixtures at EVS-5, the store/export/delete
wiring at EVS-6, and this.

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
