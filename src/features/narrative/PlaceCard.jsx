import { Portrait } from './Portrait.jsx';

/**
 * ★ THE OFFICE IS A ROLE; THE PLACE IS WHERE THEY ARE NOW.
 *
 * Two different facts, and they used to be one string. Bishr's office read
 * "Patient navigator · Gate of Names", so appending his current place produced
 * "Patient navigator · Gate of Names · Gate of Names". The offices are now
 * roles — but a house name legitimately appears in some of them (Fadl and Maha
 * both belong to Dar al-Itqan), so this also refuses to repeat a place the
 * office has already named, rather than trusting the content to stay tidy.
 */
export const whereAndWho = (office, place) =>
  !place || office.includes(place) ? office : `${office} · ${place}`;


/**
 * R0-C05A — THE SITUATED REQUEST, AND THEN THE ANSWER, AT THE PLACE.
 *
 * ============================================================================
 * ★ ONE CARD, TWO STATES — NEVER TWO CARDS
 * ============================================================================
 * Before the act it carries the request; after it, the response. The
 * alternative — a request card and a separate response card — lets a surface
 * show both at once and tell a participant two things about one moment.
 *
 * ★ AND IT IS ANCHORED TO THE PERSON'S PLACE. § 21.2: a character request is
 * "anchored to the person's current place or work route". The projection gives
 * the ground anchor; this positions against it and flips away from the map edge
 * so the card never leaves the picture.
 *
 * ⚠️ THE FOUR-REQUEST BEAT KEEPS EVERY REQUESTER VISIBLE (§ 22.2), then reduces
 * to the person carrying the response once a commitment exists. A window that
 * shows only who you chose cannot show you who you did not.
 */
export function PlaceCard({ narrative, placeLabel }) {
  const { anchor, speakers, speaker, line, acted } = narrative;
  const many = speakers.length > 1;
  const flip = anchor.x > 0.45;
  // ⚠️ A CARD IN THE LOWER HALF LIFTS ABOVE ITS ANCHOR. At 0.68 the threshold
  // let the Coordination Room card straddle its own map pin and cover the
  // label underneath it; lifting it clears the pin and keeps the card away
  // from the tray below. The Gate (0.58) still sits beside its anchor.
  const low = anchor.y > 0.62;

  return (
    <aside
      className={[
        'nar-card', acted ? 'nar-card-response' : 'nar-card-request',
        flip ? 'nar-card-flip' : '', low ? 'nar-card-low' : '', many ? 'nar-card-many' : '',
      ].filter(Boolean).join(' ')}
      style={{ left: `${anchor.x * 100}%`, top: `${anchor.y * 100}%` }}
      aria-label={acted ? 'Response' : 'Request'}
    >
      <div className={many ? 'nar-portraits nar-portraits-many' : 'nar-portraits'}>
        {speakers.map((who) => (
          <Portrait key={who.key} slot={who.portraitSlot} size={many ? 'stack' : 'single'} name={who.name} />
        ))}
      </div>
      {/* ★ NAMES AND OFFICES, EVEN WHEN FOUR PEOPLE ASK AT ONCE.
          Visual bible § 22.2 requires the multi-character card to keep both
          between the world and the decision tray. Four names alone would make
          the portraits load-bearing for who does what — which is precisely the
          dependency on face recognition that section forbids. */}
      <div className="nar-card-copy">
        {many
          ? <ul className="nar-card-who">
              {speakers.map((who) => <li key={who.key}><b>{who.name}</b><span>{who.office}</span></li>)}
            </ul>
          : <><b>{speaker.name}</b><span>{whereAndWho(speaker.office, placeLabel)}</span></>}
        <p>{line}</p>
      </div>
    </aside>
  );
}
