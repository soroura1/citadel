# `citadel` — status

**Last updated:** 2026-08-21 · ⛔ **RESET TO INFRASTRUCTURE. THERE IS NO APPLICATION HERE.**
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

---

## What is left, and why each piece survived

| Kept | Why |
|---|---|
| `package.json`, `package-lock.json`, `vite.config.js`, `index.html` | The build |
| `.woodpecker.yml`, `check-repo.sh`, `scripts/` | The pipeline and the three-condition deploy gate |
| `deploy.sh`, `citadel.Caddyfile`, `docker-compose.prod.yml`, `deploy.env.example`, `migrations/` | The deployment. ⚠️ The migrations are kept because `deploy.sh` runs them; the tables they create are for content that no longer exists |
| `public/scenes/*.jpg` | **Assets.** Kept by instruction — four generated candidate images, none reviewed, `Q10` still open |
| `README.md`, `LICENSE`, `CONTRIBUTING.md`, `RELEASES.md`, `docs/` | Governance. `check-repo.sh` requires the scope statement in `README.md` verbatim |
| `src/main.jsx` | ⛔ **Scaffolding.** Vite needs an entry or the build fails |
| `test/smoke.test.js` | ⛔ **Scaffolding.** The pipeline runs `npm test` and a missing glob is a red pipeline |

**Both scaffolding files say what they are, in their own first lines, and both are meant to be
deleted by whoever writes the first real module.** `smoke.test.js` asserts that `src/` still contains
nothing but the entry — so it **fails the day real code lands**, which is the only honest way to
stop a trivial green test from sitting under real code pretending to cover it.

---

## The state of the pipeline

```bash
export PATH="/opt/homebrew/opt/node@26/bin:$PATH"
npm test && npm run build && npm run conformance && ./check-repo.sh
```

All four pass. The bundle is **190 KB / 60 KB gzip** — React and nothing else, down from 423 KB.

⚠️ **`npm run conformance` still passes because the contracts pin is a TAG.** This repository pins
`@citadel/contracts#v0.8.0`, and a tag is immutable, so resetting `contracts` on `main` cannot reach
it. The same is true of the live `checklist-api`, which pins `v0.2.2`.

---

## What has NOT changed

| | |
|---|---|
| **The deployed site** | Still serving `407d151` from 20 August — a build that no longer exists in this tree. ⛔ **Do not deploy this repository**: it would replace a working page with a placeholder |
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

Nothing, until the owner names it. The rebuild is step-by-step and reviewed, and the first step has
not been chosen.
