import { portraitSlot } from '../../projections/slots.js';

/**
 * R0-C05A — ONE CANDIDATE IDENTITY, INSIDE THE PLACE CARD.
 *
 * ============================================================================
 * ⛔ NOTHING DEPENDS ON THE FACE
 * ============================================================================
 * Visual bible § 22.2: "No identity or decision fact depends on face
 * recognition." The name, the office, the request and the act are text beside
 * this, always. If the file is missing, blocked, or withheld on a slow
 * connection, a letter appears — as recovery, not as the designed treatment —
 * and the card still says everything it said before.
 *
 * ★ THE COMPONENT NEVER NAMES A FILE. It is given a slot id, and `slots.js`
 * decides what currently occupies it. A filename is not an identity, and this
 * repository has already shipped a surface that kept its own second inventory
 * of the art.
 *
 * ⚠️ `alt=""` on purpose, for the same reason the operational units carry it:
 * announcing "Rami, facilities and technical systems" to a screen reader
 * standing beside text that already says exactly that is repetition, not
 * access.
 */
export function Portrait({ slot: id, size = 'single', name }) {
  const asset = portraitSlot(id);
  if (!asset) return null;
  const [w, h] = asset.render[size];
  return (
    <span className={`nar-portrait nar-portrait-${size}`} style={{ width: `${w}px`, height: `${h}px` }}>
      <img src={asset.file}
           srcSet={`${asset.lowBandwidth} ${asset.pixels.lowBandwidth[0]}w, ${asset.file} ${asset.pixels.standard[0]}w`}
           sizes={`${w}px`}
           width={asset.pixels.standard[0]} height={asset.pixels.standard[1]}
           alt="" aria-hidden="true" loading="lazy"
           onError={(event) => event.currentTarget.closest('.nar-portrait')?.classList.add('nar-portrait-absent')} />
      <em aria-hidden="true">{(name ?? '?').charAt(0)}</em>
    </span>
  );
}
