import { t } from '../../locales/index.js';
import { byTier, worldMemory, visualBindingStatus, PLAN_SLOT } from '../../engine/place.js';

/**
 * ★ THE BIMARISTAN, AS A PLACE. (EVS-5)
 *
 * ============================================================================
 * ⚠️ THIS IS A LIST, AND IT IS DELIBERATELY A LIST.
 * ============================================================================
 * EVS-5 asks for a navigable Bimaristan plan. THE REVIEWED DESIGN PACKAGE DOES
 * NOT EXIST — eleven v0.1 concepts sit in the story record "pending
 * project-owner review", there is no plan or cutaway asset, no state frames, no
 * crops, no declared alt text, no weight budgets, and Q10, the inclusion
 * reviewer, is open.
 *
 * The session plan is explicit about what to do then: "implement only the
 * semantic place model and asset-slot contract, keep visual binding explicitly
 * provisional... Do not fake visible assets with CSS drawings, handcrafted SVG,
 * emoji or placeholder boxes."
 *
 * So there is no drawing here, and none is attempted. What there is instead is
 * canon's own structure: FOUR STACKED TIERS, and the fourth is the chapter's
 * whole argument — "the Underworks make every visible function possible. They
 * are also a physical representation of hidden dependencies and neglected
 * maintenance." Grouping the place by tier puts the official map's blind spot
 * on the page as a heading, in text, at no visual cost.
 *
 * When the plan is drawn it inherits this structure rather than replacing it,
 * because the text equivalent is required either way.
 */
export function PlaceSurface({ run = null, scenes = [], here = [] }) {
  const tiers = byTier(run ?? {});
  const memory = worldMemory(run ?? {});
  const binding = visualBindingStatus(scenes);
  const present = new Set(here);

  return (
    <main className="place">
      <h1>{t('place.title')}</h1>
      <p>{t('place.lede')}</p>

      {/* ⚠️ THE GATE IS HELD, AND THE PAGE SAYS SO. A participant reading a
          text-only plan should know it is unfinished rather than assume this is
          the product. Computed from the slots, so it cannot claim more than the
          content does. */}
      {binding.blocked && (
        <aside className="binding-hold" role="note" aria-label={t('place.binding_hold')}>
          <p className="private-label">{t('place.binding_hold')}</p>
          <p>{t('place.binding_hold_body')}</p>
          <p className="provisional-note">
            {binding.candidates}/{binding.slots} {t('place.slots_with_candidates')}
            {' · '}{binding.reviewed}/{binding.slots} {t('place.slots_reviewed')}
            {' · '}{t('place.blocked_by')} {binding.blockedBy}
          </p>
        </aside>
      )}

      {/* ★ THE PLAN'S TEXT EQUIVALENT, WHICH EXISTS EVEN THOUGH THE PLAN DOES
          NOT. EVS-5 §3 requires the plan AND its text equivalent; the finished
          cutaway will need this paragraph in any case, so writing it now is not
          a placeholder — it is the half of the requirement that does not depend
          on an image. When VA-012 lands it becomes that image's alt text and
          this block renders the image beside it. */}
      <section className="plan" aria-label={t('place.plan_slot')}>
        <h2>{t('place.plan_slot')}</h2>

        {/* ★ EVS-5A — THE CANDIDATE RENDERS, AND SAYS WHAT IT IS.
            `VA-012` was generated and derived inside the budget this slot
            declared before the image existed. It is rendered from
            `PLAN_SLOT.candidate_file` — there is no second inventory of the
            art anywhere, which is the mistake `PlayScreen`'s hardcoded filename
            map made until EVS-5.

            ⚠️ A CANDIDATE IS NOT A BINDING. `inclusion_reviewed` is false while
            `Q10` is open, so the provisional band renders on it. Building
            against a candidate is permitted; treating one as canonical is not. */}
        {PLAN_SLOT.candidate_file && (
          <figure className="plan-figure" data-provisional={t('provisional.badge')}>
            <img
              src={PLAN_SLOT.candidate_file}
              alt={t(PLAN_SLOT.alt_key)}
              width="1600" height="1066" loading="lazy" decoding="async"
            />
            <figcaption className="provisional-note">
              {t('place.plan_provisional')} {PLAN_SLOT.candidate_ref}
            </figcaption>
          </figure>
        )}

        {/* ★ THE TEXT EQUIVALENT STAYS VISIBLE, WHOLE, BESIDE THE IMAGE —
            not tucked into the alt attribute and not collapsed behind a
            control. The image's alt carries the same words for a reader who
            never sees it; this paragraph carries them for the participant on a
            slow connection whose image has not arrived, for the printed page,
            and for anyone who would rather read than look. */}
        <p>{t(PLAN_SLOT.alt_key)}</p>
      </section>

      {tiers.map(({ tier, locations }) => (
        <section key={tier.id} className="tier" data-tier={tier.id} aria-label={t(`tier.${tier.id}`)}>
          <h2>{t(`tier.${tier.id}`)}</h2>
          <p className="tier-what">{tier.what}</p>

          <ul className="locations">
            {locations.map((l) => (
              <li key={l.id} data-location={l.id} data-here={present.has(l.id) ? 'true' : undefined}>
                <h3>
                  {l.name}
                  {present.has(l.id) && <> — <em>{t('place.you_are_here')}</em></>}
                </h3>
                <p>{l.what}</p>

                {/* ★ WHAT IT IS LIKE NOW. Derived from what has been committed
                    and discovered, so a location that changed stays changed —
                    the world memory the gate asks for, with no second copy of
                    the fact to drift. */}
                {l.state && (
                  <p className="location-state" data-state={l.state.id}>
                    <span className="label">{t('place.now')}</span> {l.state.what}
                  </p>
                )}

                {/* Routes, named. This is the connection that makes the four
                    required places a place rather than four pages. */}
                {l.routes?.length > 0 && (
                  <p className="routes">
                    <span className="label">{t('place.routes_to')}</span>{' '}
                    {l.routes.join(', ')}
                  </p>
                )}

                {/* ⚠️ A DECLARED SLOT, NOT AN IMAGE. Nothing is rendered from
                    it: the candidate is a concept pending review, and binding
                    one as canonical is exactly what the gate forbids. */}
                {l.asset_slot && (
                  <p className="slot" data-provisional={t('provisional.badge')}>
                    <span className="label">{t('place.asset_slot')}</span> {l.asset_slot}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* ★ WHAT THE WORLD REMEMBERS — the acceptance item, stated plainly. */}
      <section className="world-memory" aria-label={t('place.what_changed')}>
        <h2>{t('place.what_changed')}</h2>
        {memory.length === 0 ? (
          <p>{t('place.nothing_changed_yet')}</p>
        ) : (
          <ul>
            {memory.map((m) => (
              <li key={m.locationId}>
                <strong>{m.name}</strong> — {m.what}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
