import { Portrait } from './Portrait.jsx';
import { whereAndWho } from './PlaceCard.jsx';

/**
 * R0-C05A — THE SAME BEAT, READ RATHER THAN LOOKED AT.
 *
 * ============================================================================
 * ★ THE SAME PROJECTION, NOT A SUMMARY OF IT
 * ============================================================================
 * `accessibility-and-play-modes.md` § 1: equivalent "does not mean visually
 * identical. It means equal ability to understand, decide and progress without
 * a strategically easier or thinner game."
 *
 * So this receives `view.narrative` — the identical object the map-anchored
 * card renders — and the acts sit in the same tray beneath both. There is no
 * second story inside this component, which is why the two modes cannot drift:
 * they are two readings of one thing rather than two things kept in step.
 *
 * ⚠️ THE PORTRAIT IS ADDITIVE HERE TOO. Name, office, place and the line are
 * text; the face adds recognition and carries nothing on its own.
 */
export function NarrativeStructured({ narrative, placeLabel }) {
  const { speakers, speaker, line, acted, now, title, purpose, worldChange } = narrative;
  const many = speakers.length > 1;

  return (
    <section className="nar-structured" aria-label={acted ? 'Response' : 'Situated request'}>
      <p className="nar-eyebrow">{now}</p>
      <h2>{title}</h2>
      <p className="nar-purpose">{purpose}</p>

      <div className="nar-structured-speaker">
        <div className={many ? 'nar-portraits nar-portraits-many' : 'nar-portraits'}>
          {speakers.map((who) => (
            <Portrait key={who.key} slot={who.portraitSlot} size={many ? 'stack' : 'single'} name={who.name} />
          ))}
        </div>
        <div className="nar-card-copy">
          {many
            ? <ul className="nar-card-who">
                {speakers.map((who) => <li key={who.key}><b>{who.name}</b><span>{who.office}</span></li>)}
              </ul>
            : <><b>{speaker.name}</b><span>{whereAndWho(speaker.office, placeLabel)}</span></>}
          <p>{line}</p>
        </div>
      </div>

      {acted && worldChange && (
        <dl className="nar-structured-change">
          <div><dt>What the world did</dt><dd>{worldChange}</dd></div>
          <div><dt>What remains open</dt><dd>{narrative.return}</dd></div>
        </dl>
      )}
    </section>
  );
}
