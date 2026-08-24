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
const PORTRAIT = '/portraits';

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
  /* ========================================================================
   * ★ R0-C05A — THE SIX CHAPTER 1 IDENTITIES.
   *
   * ⚠️ DECLARED BEFORE THE FILES EXIST, and that ordering is the whole point.
   * `VA-012` earned this discipline in August: the slot named its 400,000-byte
   * budget before the Bimaristan cutaway was generated, so landing at 354,077
   * meant something. A budget written after measuring the file is not a budget,
   * it is a description.
   *
   * The masters are review artefacts of 2.0–2.7 MB each (visual bible § 22.1).
   * Their size is recorded there as a fact about the masters, NOT as a runtime
   * allowance — shipping one directly would be a 2 MB image inside a 58×66
   * card. `scripts/derive-portraits.mjs` reads the geometry below and produces
   * the runtime copies, so the crop the interface uses and the crop the file
   * was cut to cannot be two different numbers.
   *
   * ★ `focal` IS TOP-BIASED, not centred. A bust crop taken from the middle of
   * a standing figure returns a torso. `vertical: 0.2` places the crop window a
   * fifth of the way down the remaining height, which is the `object-position:
   * 50% 20%` the accepted V05B proof uses.
   *
   * ⛔ AND NONE OF THEM IS BOUND. `Q10` has reviewed no face, no crop and no
   * question of representation here. § 22.1 is explicit that the owner's
   * bounded acceptance permits derivation, not canonisation.
   * ===================================================================== */
  'R0-SL08A': {
    id: 'R0-SL08A',
    kind: 'portrait',
    meaning: 'a patient navigator who moves between wards, service areas, patients and families',
    candidateRef: 'VA-018',
    master: '08-visual-assets/03-characters/v05b/v05b-bishr-portrait-v0.1.png',
    file: `${PORTRAIT}/bishr-v0.1.jpg`,
    lowBandwidth: `${PORTRAIT}/low-bandwidth/bishr-v0.1.jpg`,
    focal: { aspect: [58, 66], vertical: 0.2 },
    /**
     * ★ R0-C05B-A — A THIRD DECLARED SIZE, NOT A THIRD IMAGE.
     *
     * The arrival shows Bishr large and once (§ 23.1); the place card shows him
     * compact and often. Same slot, same candidate, same derivative — the size
     * is declared here so no surface picks its own, and `arrival` is capped at
     * the derivative's own 232×264 because § 18.2 forbids enlarging a master
     * past its source. On a HiDPI display the arrival therefore renders at 1×;
     * that is recorded as a limitation rather than fixed by inventing pixels.
     *
     * ⚠️ ONLY THIS SLOT DECLARES IT, because only the Guide of the Ways arrives.
     * A slot asked for a size it never declared renders no image rather than
     * guessing a number, and the name, office and every line stay regardless.
     */
    render: { single: [58, 66], stack: [34, 38], arrival: [232, 264] },
    pixels: { standard: [232, 264], lowBandwidth: [116, 132] },
    maxBytes: 60_000,
    lowBandwidthMaxBytes: 20_000,
    alt: 'Bishr, patient navigator',
    reviewed: false,
    reviewGate: 'Q10',
  },
  'R0-SL08B': {
    id: 'R0-SL08B',
    kind: 'portrait',
    meaning: 'a senior porter and internal movement-route steward',
    candidateRef: 'VA-019',
    master: '08-visual-assets/03-characters/v05b/v05b-ayyash-portrait-v0.1.png',
    file: `${PORTRAIT}/ayyash-v0.1.jpg`,
    lowBandwidth: `${PORTRAIT}/low-bandwidth/ayyash-v0.1.jpg`,
    focal: { aspect: [58, 66], vertical: 0.2 },
    render: { single: [58, 66], stack: [34, 38] },
    pixels: { standard: [232, 264], lowBandwidth: [116, 132] },
    maxBytes: 60_000,
    lowBandwidthMaxBytes: 20_000,
    alt: 'Ayyash, movement steward',
    reviewed: false,
    reviewGate: 'Q10',
  },
  'R0-SL08C': {
    id: 'R0-SL08C',
    kind: 'portrait',
    meaning: 'the quality and patient-safety leader who owns event judgment',
    candidateRef: 'VA-020',
    master: '08-visual-assets/03-characters/v05b/v05b-fadl-portrait-v0.1.png',
    file: `${PORTRAIT}/fadl-v0.1.jpg`,
    lowBandwidth: `${PORTRAIT}/low-bandwidth/fadl-v0.1.jpg`,
    focal: { aspect: [58, 66], vertical: 0.2 },
    render: { single: [58, 66], stack: [34, 38] },
    pixels: { standard: [232, 264], lowBandwidth: [116, 132] },
    maxBytes: 60_000,
    lowBandwidthMaxBytes: 20_000,
    alt: 'Fadl, quality and patient safety',
    reviewed: false,
    reviewGate: 'Q10',
  },
  'R0-SL08D': {
    id: 'R0-SL08D',
    kind: 'portrait',
    meaning: 'the facilities leader responsible for the hidden building systems',
    candidateRef: 'VA-021',
    master: '08-visual-assets/03-characters/v05b/v05b-rami-portrait-v0.1.png',
    file: `${PORTRAIT}/rami-v0.1.jpg`,
    lowBandwidth: `${PORTRAIT}/low-bandwidth/rami-v0.1.jpg`,
    focal: { aspect: [58, 66], vertical: 0.2 },
    render: { single: [58, 66], stack: [34, 38] },
    pixels: { standard: [232, 264], lowBandwidth: [116, 132] },
    maxBytes: 60_000,
    lowBandwidthMaxBytes: 20_000,
    alt: 'Rami, facilities and technical systems',
    reviewed: false,
    reviewGate: 'Q10',
  },
  'R0-SL08E': {
    id: 'R0-SL08E',
    kind: 'portrait',
    meaning: 'the copyist who preserves source and chronology without classifying events',
    candidateRef: 'VA-022',
    master: '08-visual-assets/03-characters/v05b/v05b-maha-portrait-v0.1.png',
    file: `${PORTRAIT}/maha-v0.1.jpg`,
    lowBandwidth: `${PORTRAIT}/low-bandwidth/maha-v0.1.jpg`,
    focal: { aspect: [58, 66], vertical: 0.2 },
    render: { single: [58, 66], stack: [34, 38] },
    pixels: { standard: [232, 264], lowBandwidth: [116, 132] },
    maxBytes: 60_000,
    lowBandwidthMaxBytes: 20_000,
    alt: 'Maha, copyist and chronology custodian',
    reviewed: false,
    reviewGate: 'Q10',
  },
  'R0-SL08F': {
    id: 'R0-SL08F',
    kind: 'portrait',
    meaning: 'the biomedical engineer who will not call equipment available unverified',
    candidateRef: 'VA-023',
    master: '08-visual-assets/03-characters/v05b/v05b-yasin-portrait-v0.1.png',
    file: `${PORTRAIT}/yasin-v0.1.jpg`,
    lowBandwidth: `${PORTRAIT}/low-bandwidth/yasin-v0.1.jpg`,
    focal: { aspect: [58, 66], vertical: 0.2 },
    render: { single: [58, 66], stack: [34, 38] },
    pixels: { standard: [232, 264], lowBandwidth: [116, 132] },
    maxBytes: 60_000,
    lowBandwidthMaxBytes: 20_000,
    alt: 'Yasin, biomedical engineer',
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

/** The six Chapter 1 identity slots, in declaration order. */
export const PORTRAIT_SLOTS = Object.freeze(
  Object.values(SLOTS).filter((entry) => entry.kind === 'portrait'));

/** The slot a character key occupies, or null. Content names the slot; this
 *  resolves it — a component never names a portrait file. */
export const portraitSlot = (id) => {
  const entry = SLOTS[id];
  return entry?.kind === 'portrait' ? entry : null;
};
