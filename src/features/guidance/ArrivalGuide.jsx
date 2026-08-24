import { ArrowRight, Question, Compass, MapPinLine } from '@phosphor-icons/react';
import { Portrait } from '../narrative/Portrait.jsx';

/**
 * R0-C05B-A — BISHR, ONCE, LARGE, AND THEN OUT OF THE WAY.
 *
 * ============================================================================
 * WHAT THE FIRST SCREEN HAS TO ANSWER
 * ============================================================================
 * § 23.1 lists five questions the first playable viewport must answer without
 * opening a drawer: where am I, who is helping me, why does this matter, what
 * do I do now, and what will the act do. Each has exactly one home below, and
 * the order is the order they are asked in.
 *
 * ============================================================================
 * ★ THIS IS AN OVERLAY ON THE WORLD, NOT A SCREEN BEFORE IT
 * ============================================================================
 * The hospital is already working behind Bishr, and the route he is asking
 * about is lit while he asks. § 21.5 — the owner's own revision — rejected a
 * permanent dramatic panel; this is the temporary opposite of one, and it is
 * gone the moment the route has been walked.
 *
 * ⛔ NOTHING HERE DEPENDS ON THE FACE. Name, office, both paragraphs, the
 * objective, the act and its preview are text. `Portrait` renders a letter when
 * the image does not arrive, and the screen still says everything it said —
 * visual bible § 22.2, and the low-bandwidth row of § 18.5.
 *
 * ⚠️ BISHR ORIENTS AND NOTHING MORE. Canon: he "introduces places, explains
 * customs, and supports player orientation without becoming an all-knowing
 * narrator" (`cast-directions-v0.1.md` § 9). He does not name the fault of
 * Scene 2, does not decide a preparation, does not speak for another portfolio,
 * and is not a substitute for the League of Care — which is absent from
 * Chapters 1–3 by the chapter matrix's eighth rule. Every word he says here
 * comes from governed content carrying a canonical source.
 */
export function ArrivalGuide({ guidance, onAct, onHowPlayWorks, howButtonRef, guidanceToggle }) {
  const { guide, intro, objective, act, preview } = guidance;

  return (
    <section className="guide-arrival" aria-label={`${guide.name}, ${guide.title}`}>
      <div className="guide-figure">
        {/* ★ The large arrival treatment — the same slot the compact place card
            uses, at the size the slot declares for arrival. One inventory of
            the art, two declared sizes; the component still names no file. */}
        <Portrait slot={guide.portraitSlot} size="arrival" name={guide.name} />
      </div>

      <div className="guide-card">
        <p className="guide-who">
          <b>{guide.name}</b>
          {/* Offices are used without a surname (`sensory-canon-v0.1.md`), and
              the public role is a different fact from the office, so it stays a
              different line rather than being run into one string — the
              "Gate of Names · Gate of Names" defect of R0-C05A. */}
          <span>{guide.title}</span>
        </p>

        {intro.map((para) => <p key={para} className="guide-intro">{para}</p>)}

        <p className="guide-objective">
          <Compass weight="fill" aria-hidden="true" />
          <span>
            <small>Your first task</small>
            <b>{objective.text}</b>
          </span>
        </p>

        <button type="button" className="guide-act" onClick={() => onAct(act)}>
          {act.label} <ArrowRight weight="bold" aria-hidden="true" />
        </button>

        {/* ★ THE PREVIEW IS FAIR AND IT IS BEFORE THE ACT (§ 0.4A, and
            `gameplay-and-state.md` § 7). It also says what the act will NOT do:
            the unknown line names the question the morning is still carrying,
            so nobody can read this button as a promise that walking a corridor
            explains the capacity gap. */}
        <dl className="guide-preview">
          <div><dt>Protects</dt><dd>{preview.protects}</dd></div>
          <div><dt>Costs</dt><dd>{preview.costs}</dd></div>
          <div><dt>Still unknown</dt><dd>{preview.unknown}</dd></div>
        </dl>

        <div className="guide-secondary">
          <button type="button" className="guide-quiet" onClick={onHowPlayWorks} ref={howButtonRef}>
            <Question aria-hidden="true" /> {guidance.howPlayWorks.title}
          </button>
          {guidanceToggle}
        </div>
      </div>
    </section>
  );
}

/**
 * ★ THE ROUTE'S OWN ENDPOINTS, NAMED ON THE MAP.
 *
 * The objective says "the Gate–Emergency route"; this says which two buildings
 * those are, at the coordinates the world holds for them. They are labels and
 * not controls, deliberately: the arrival's act already owns
 * `inspect-place`+`gate`, and a second control reaching the same command with
 * the same payload is the audit finding this slice exists to remove.
 */
export function RouteEndpoints({ route, from, to }) {
  return (
    <>
      {/* ★ THE GATE IS NAMED, BECAUSE NOTHING ELSE ON THE MAP NAMES IT. It is
          the route's origin and Bishr's own place, and it carries no XP0 pin. */}
      <span className="guide-endpoint guide-endpoint-from" style={{ left: `${from.x * 100}%`, top: `${from.y * 100}%` }}>
        <MapPinLine weight="fill" aria-hidden="true" />{route.fromLabel}
      </span>
      {/* ⚠️ AND THE FAR END IS MARKED, NOT NAMED — deliberately.
          The map already carries an "Emergency Department" pin, and it sits at
          XP0's hotspot coordinate rather than at this route's endpoint: the two
          disagree by roughly a fifth of the map. Printing the name twice, in two
          places, would assert that one building is two — the exact class of
          meaning defect this repository keeps finding by looking rather than by
          asserting. So the terminus is marked, the objective names it in words,
          and the divergence is recorded for the visual workstream instead of
          being quietly papered over here. */}
      <span className="guide-endpoint guide-endpoint-to" style={{ left: `${to.x * 100}%`, top: `${to.y * 100}%` }}
            aria-hidden="true" />
    </>
  );
}

/**
 * ★ GUIDANCE MAY BE SWITCHED OFF, AND NOTHING REQUIRED GOES WITH IT.
 *
 * § 0.4C and § 23.4: turning guidance off must not hide required state,
 * commands, consequences or structured equivalents. It cannot here, for a
 * structural reason rather than a careful one — with guidance off the beat's
 * act is rendered by the commitment tray that has carried it since R0-C05A, and
 * the objective, the route and the world are the same projection either way.
 * What goes is the framing.
 */
export function GuidanceToggle({ on, labels, onToggle }) {
  return (
    <button type="button" className="guide-quiet guide-toggle" aria-pressed={on} onClick={onToggle}>
      {on ? labels.on : labels.off}
    </button>
  );
}
