import { ArrowRight, Question } from '@phosphor-icons/react';
import { Portrait } from '../narrative/Portrait.jsx';
import { PlayLoop, FirstSteps } from './PlayLoop.jsx';

/**
 * R0-C05B-A — THE SAME ARRIVAL, READ RATHER THAN LOOKED AT.
 *
 * ============================================================================
 * ★ THE SAME PROJECTION AND THE SAME COMMAND — NOT A SUMMARY
 * ============================================================================
 * `accessibility-and-play-modes.md` § 1: equivalent "does not mean visually
 * identical. It means equal ability to understand, decide and progress without
 * a strategically easier or thinner game." So this receives the identical
 * `view.guidance` object the overlay renders and calls the identical `onAct`
 * with the identical act. There is no second arrival inside this component,
 * which is why the two modes cannot drift: they are two readings of one thing.
 *
 * ★ AND IT NAMES THE ROUTE'S ENDPOINTS IN WORDS. The visual mode lights a
 * polyline; a structured participant needs to know it runs from the Gate of
 * Names to the Emergency Department, because that is the whole content of the
 * highlight (§ 23.4).
 *
 * ⚠️ THE PORTRAIT IS ADDITIVE HERE TOO — name, office, both paragraphs, the
 * objective and the act are text, and removing every image leaves the arrival
 * complete.
 */
export function GuidanceStructured({ guidance, onAct, onHowPlayWorks, howButtonRef, guidanceToggle }) {
  const { guide, intro, objective, act, preview } = guidance;

  return (
    <section className="guide-structured" aria-label={`${guide.name}, ${guide.title}`}>
      <div className="guide-structured-who">
        <Portrait slot={guide.portraitSlot} size="single" name={guide.name} />
        <div>
          <h2>{guide.name}</h2>
          <p className="guide-who-office">{guide.title} · {guide.office}</p>
        </div>
      </div>

      {intro.map((para) => <p key={para} className="guide-intro">{para}</p>)}

      <dl className="guide-structured-task">
        <div>
          <dt>Your first task</dt>
          <dd>{objective.text}</dd>
        </div>
        <div>
          <dt>The highlighted route</dt>
          {/* The same two endpoints the map lights, said as places. */}
          <dd>{objective.route.fromLabel} → {objective.route.toLabel}</dd>
        </div>
      </dl>

      <button type="button" className="guide-act" onClick={() => onAct(act)}>
        {act.label} <ArrowRight weight="bold" aria-hidden="true" />
      </button>

      <dl className="guide-preview">
        <div><dt>Protects</dt><dd>{preview.protects}</dd></div>
        <div><dt>Costs</dt><dd>{preview.costs}</dd></div>
        <div><dt>Still unknown</dt><dd>{preview.unknown}</dd></div>
      </dl>

      <PlayLoop loop={guidance.loop} />
      <FirstSteps steps={guidance.steps} />

      <div className="guide-secondary">
        <button type="button" className="guide-quiet" onClick={onHowPlayWorks} ref={howButtonRef}>
          <Question aria-hidden="true" /> {guidance.howPlayWorks.title}
        </button>
        {guidanceToggle}
      </div>
    </section>
  );
}

/**
 * ★ AFTER THE ARRIVAL RETRACTS, GUIDANCE STILL SAYS WHERE YOU ARE.
 *
 * § 0.4C: `Guidance: On` "keeps the next objective/route visible". In the
 * visual mode the loop, the steps and the lit route stay on the map, so this
 * exists for the structured reading — where there is no map to keep them on —
 * and carries the identical projection, no act, and therefore no second owner
 * of any command.
 */
export function GuidanceBrief({ guidance, onHowPlayWorks, howButtonRef, guidanceToggle }) {
  return (
    <section className="guide-brief" aria-label="Guidance">
      <dl className="guide-structured-task">
        <div>
          <dt>Current task</dt>
          <dd>{guidance.objective.text}</dd>
        </div>
        <div>
          <dt>The highlighted route</dt>
          <dd>{guidance.objective.route.fromLabel} → {guidance.objective.route.toLabel}</dd>
        </div>
      </dl>
      <PlayLoop loop={guidance.loop} />
      <FirstSteps steps={guidance.steps} />
      <div className="guide-secondary">
        <button type="button" className="guide-quiet" onClick={onHowPlayWorks} ref={howButtonRef}>
          <Question aria-hidden="true" /> {guidance.howPlayWorks.title}
        </button>
        {guidanceToggle}
      </div>
    </section>
  );
}
