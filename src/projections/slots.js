/**
 * R0-C04 — ASSET SLOTS. THE SLOT IS THE IDENTITY; THE FILE IS AN OCCUPANT.
 *
 * ============================================================================
 * ⚠️ A FILENAME IS NEVER AN IDENTITY
 * ============================================================================
 * `visual-and-interaction-bible.md` § 11 and § 18.2 both say it, and this
 * repository has already paid for the alternative: a surface once carried a
 * hardcoded map of two filenames beside a computed manifest, and the two
 * drifted. A projection asks for `R0-SL07C` — "the one traceable mobile
 * critical-care reserve" — and this file decides what currently occupies that
 * slot.
 *
 * ============================================================================
 * ⛔ EVERY ONE OF THESE IS CANDIDATE AND UNREVIEWED
 * ============================================================================
 * `Q10` is open. `VA-013`–`VA-017` were generated for `R0-V03` and composed for
 * `R0-V04`; neither task bound them, and this increment does not bind them
 * either. `reviewed: false` is not a placeholder waiting to be flipped when
 * convenient — it is the state, and the interface says so where a participant
 * can see it.
 *
 * ★ AND PLAY MUST SURVIVE THEIR ABSENCE. § 18.5's low-bandwidth row: "use
 * 256×170 candidates or omit raster units; place/state/route controls and the
 * complete structured world remain". `assertPlayableWithoutLayers` is the test
 * that keeps that true rather than aspirational.
 */

const LAYER = '/layers';

export const SLOTS = Object.freeze({
  'R0-SL07A': {
    id: 'R0-SL07A',
    meaning: 'staffed clinical work, handover and service movement',
    candidateRef: 'VA-013',
    file: `${LAYER}/r0-clinical-service-team-layer-v0.1.png`,
    lowBandwidth: `${LAYER}/low-bandwidth/r0-clinical-service-team-layer-v0.1.png`,
    maxBytes: 220_000,
    alt: 'A clinical service team at work',
    reviewed: false,
    reviewGate: 'Q10',
  },
  'R0-SL07B': {
    id: 'R0-SL07B',
    meaning: 'competent technical capacity at origin, route or occupied work site',
    candidateRef: 'VA-014',
    file: `${LAYER}/r0-facilities-technical-team-layer-v0.1.png`,
    lowBandwidth: `${LAYER}/low-bandwidth/r0-facilities-technical-team-layer-v0.1.png`,
    maxBytes: 220_000,
    alt: 'A facilities technical team with its tools',
    reviewed: false,
    reviewGate: 'Q10',
  },
  'R0-SL07C': {
    id: 'R0-SL07C',
    meaning: 'one traceable critical-care reserve with custody and a donating service',
    candidateRef: 'VA-015',
    file: `${LAYER}/r0-mobile-reserve-cart-layer-v0.1.png`,
    lowBandwidth: `${LAYER}/low-bandwidth/r0-mobile-reserve-cart-layer-v0.1.png`,
    maxBytes: 220_000,
    alt: 'The mobile critical-care reserve cart',
    reviewed: false,
    reviewGate: 'Q10',
  },
  'R0-SL07D': {
    id: 'R0-SL07D',
    meaning: 'ordinary waiting and arriving demand, without patient-level simulation',
    candidateRef: 'VA-016',
    file: `${LAYER}/r0-aggregate-demand-group-layer-v0.1.png`,
    lowBandwidth: `${LAYER}/low-bandwidth/r0-aggregate-demand-group-layer-v0.1.png`,
    maxBytes: 220_000,
    alt: 'An aggregate group of arriving and waiting people',
    reviewed: false,
    reviewGate: 'Q10',
  },
  'R0-SL07E': {
    id: 'R0-SL07E',
    meaning: 'ordinary stores-to-service movement, visually distinct from the reserve',
    candidateRef: 'VA-017',
    file: `${LAYER}/r0-service-supply-cart-layer-v0.1.png`,
    lowBandwidth: `${LAYER}/low-bandwidth/r0-service-supply-cart-layer-v0.1.png`,
    maxBytes: 220_000,
    alt: 'An ordinary service supply cart',
    reviewed: false,
    reviewGate: 'Q10',
  },
  'R0-SL02': {
    id: 'R0-SL02',
    meaning: 'the ordinary operational sector base',
    candidateRef: 'XP0 sector ordinary',
    file: '/scenes/bimaristan-sector-ordinary-v0.1.jpg',
    lowBandwidth: null,
    maxBytes: 600_000,
    alt: 'The Bimaristan operational sector during an ordinary difficult morning',
    reviewed: false,
    reviewGate: 'Q10',
  },
});

export const slot = (id) => SLOTS[id] ?? null;

/** Everything the increment renders is candidate until `Q10` says otherwise. */
export const anyUnreviewed = () => Object.values(SLOTS).some((entry) => !entry.reviewed);
