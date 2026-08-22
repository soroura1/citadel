# Releases — `citadel`

**This file owns this repository's release numbering.** A number is never reused and never
renumbered. The prior build attempt had two different releases both numbered R5, with colliding task
numbers, because no single file owned the sequence.

| Release | Status | Tag | Closed | Notes |
|---|---|---|---|---|
| **XP0 preview** | ✅ ready for owner deployment | — | — | Visual/interaction evidence only; not R0 and not a simulation or learning claim |
| **Former R0** | ⛔ superseded before release | — | — | Walking-skeleton sequence retired by `DEC-032`; the proposed rebuild is in `citadel-planning/06-releases/RELEASE-PROGRESSION.md` |

## 2026-08-21 — reset to infrastructure

The owner chose to start the product over. The engine, every surface, all Chapter 1 content, the
locales, the stylesheet and all twenty-four test files were deleted in one commit. What remains is
the build, the pipeline, the deployment, the assets and the governance files.

**No release was cut and no release number was consumed.** A reset is not a release: nothing was
delivered, and numbering it would put a version on an empty repository. The last commit before the
reset is `b007a38`.

The deployed site still serves `407d151`. After this XP0 preview is merged, an owner-raised
deployment may replace that historical build with the reviewed visual pilot.

## Rules

1. A release is **closed or reopened, never left ambiguous.**
2. A release is done when its **walk** completes in the deployed environment, performed by someone
   who did not build it.
3. Cutting a tag does not deploy it. See [CONTRIBUTING.md](CONTRIBUTING.md) § *The deploy gate*.
