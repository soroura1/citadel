import { CheckCircle, Gauge, Warning, Wrench, ArrowRight, SealCheck } from "@phosphor-icons/react";

/**
 * R0-C05 — FOUR PROJECTS, CAPACITY FOR TWO, AND WHAT EACH ONE COSTS.
 *
 * ============================================================================
 * WHAT THIS REPLACED
 * ============================================================================
 * XP0's panel offered the same four projects and a `disabled` attribute. There
 * was no schedule, no progress, no contention, no displaced work and no
 * difference between "done" and "checked". This renders a projection of a world
 * in which all six of those exist.
 *
 * ★ ALL FOUR ARE ALWAYS SHOWN, including the two not taken. A window listing
 * only your choices cannot show you the cost of making them.
 *
 * ★ CONTENTION IS SHOWN BEFORE COMMITMENT. Two projects that want the service
 * passage will collide, and a participant is entitled to know that before
 * choosing rather than after — `gameplay-and-state.md` § 7.
 *
 * ⛔ AND THE CAPACITY LIMIT IS NOT ENFORCED HERE. The rules refuse a third
 * project; this only explains the refusal. A surface that enforces a rule is a
 * second, weaker copy of it.
 *
 * ⚠️ STRINGS ARE ENGLISH LITERALS, because this repository has no locale layer —
 * the reset removed it and R0-I1 did not restore one. The content keeps a
 * `name_key` beside every name so the layer can return without rewriting the
 * content, and the Arabic/RTL debt is recorded in the ledger rather than
 * quietly skipped.
 */
const STATE_ORDER = ['available', 'scheduled', 'working', 'disrupted', 'complete', 'verified'];

export function PreparednessPanel({ preparedness, requests = null, residue = [], onSchedule, onVerify, onAdvance, canAdvance }) {
  const { projects, capacity, taken, remaining } = preparedness;
  /* ★ R0-C05A — THE SITUATED REQUEST BESIDE THE SPECIFICATION.
     The panel used to open with four titles and a cost line, which is a
     specification. Each project is now something a named person is asking for,
     and the request/act wording is looked up from the projection by project id
     — so the panel cannot attribute the power route to anyone but Rami, and
     cannot show a request for a project that is not in the content. */
  const requestFor = (id) => requests?.find((entry) => entry.project === id) ?? null;
  const anyActive = projects.some((p) => ['scheduled', 'working', 'disrupted'].includes(p.state));
  // ★ THREE SITUATIONS, NOT TWO. Nothing chosen yet; work under way; and the
  // committed work finished. A two-branch label told a participant who had
  // completed both projects to "take on two pieces of work first". Time still
  // passes in the third case — the clock is the institution's, not the task's.
  const label = taken === 0 ? 'Take on two pieces of work first'
    : anyActive ? 'Let the work continue'
    : 'Let the morning continue';

  return (
    <section className="action-panel preparedness" aria-label="Preparedness window">
      <div className="panel-heading">
        <div>
          <p className="kicker">Before Second Bell</p>
          <h2>Four requests have reached you. Two can be staffed.</h2>
        </div>
        <span className="capacity"><Gauge /> {taken}/{capacity} capacity</span>
      </div>
      <p className="panel-intro">
        Each one protects something and stops something else. There is no complete option, and
        nothing here is finished until the responsible function has tested it.
      </p>

      <ul className="work-list">
        {projects.map((project) => (
          <li key={project.id} className={`work-card state-${project.state}`} data-project={project.id} data-state={project.state}>
            <div className="work-head">
              <b>{project.name}</b>
              <span className="work-state">{project.stateLabel}</span>
            </div>

            {/* ★ WHO IS ASKING, AND IN THEIR OWN WORDS. Canon owns the line;
                the projection owns which person it belongs to. */}
            {requestFor(project.id) && (
              <div className="work-request">
                <b>{requestFor(project.id).carrier.name}</b>
                <span>{requestFor(project.id).carrier.office}</span>
                <p>{requestFor(project.id).request}</p>
              </div>
            )}

            {/* The ladder, as position rather than as a percentage. A ring at
                100% cannot say whether the work was tested.

                ★ Filled from the states the project ACTUALLY entered. Filling
                by index lit the `disrupted` marker on every completed project
                and told the participant about a stoppage that never occurred. */}
            <ol className="work-ladder" aria-label="Progress">
              {STATE_ORDER.map((step) => (
                <li key={step}
                    data-step={step}
                    data-reached={project.entered.includes(step) || undefined}
                    data-current={project.state === step || undefined}>
                  <span className="visually-hidden">{step}</span>
                </li>
              ))}
            </ol>

            {/* ★ PROTECTS / COSTS / UNKNOWN, BEFORE THE COMMITMENT.
                § 0.4A's required treatment puts these first and the technical
                detail behind inspection: the old card opened every field at
                once, which reads as a datasheet rather than a choice. */}
            {requestFor(project.id) && (
              <dl className="work-preview">
                <div><dt>Protects</dt><dd>{requestFor(project.id).protects}</dd></div>
                <div><dt>Costs</dt><dd className="displaced">{requestFor(project.id).costs}</dd></div>
                <div><dt>Unknown</dt><dd>{requestFor(project.id).unknown}</dd></div>
              </dl>
            )}

            {/* ⚠️ `Stops` USED TO BE HERE TOO, and once the preview above states
                the cost in the engine's own words it was the same fact twice on
                one card. The preview leads (§ 0.4A's required treatment); the
                technical detail follows it, and the row returns if the preview
                is ever absent so the cost can never simply vanish. */}
            <dl className="work-facts">
              <div><dt>Responsible</dt><dd>{project.responsibleFunctions.join(' · ')}</dd></div>
              <div><dt>Access</dt><dd>{project.accessNeed}</dd></div>
              <div><dt>Materials</dt><dd>{project.materials}</dd></div>
              {!requestFor(project.id) && (
                <div><dt>Stops</dt><dd className="displaced">{project.displaces.what} — {project.displaces.because}</dd></div>
              )}
              <div><dt>Verified by</dt><dd>{project.verification}</dd></div>
            </dl>

            {/* ★ Foreseeable collision, named before the choice. */}
            {project.contended.length > 0 && project.state !== 'verified' && (
              <p className="work-contended" role="note">
                <Warning weight="fill" /> Competes for the {project.contended.join(' and the ')} with
                work already under way. One of them will wait.
              </p>
            )}

            {project.state === 'disrupted' && (
              <p className="work-disrupted" role="status">
                <Wrench /> Stopped with the site still occupied. It continues when the contended
                resource comes free.
              </p>
            )}

            <div className="work-actions">
              {project.state === 'available' && (
                <button type="button" className="secondary" disabled={!project.canSchedule}
                        onClick={() => onSchedule(project.id)}>
                  {/* ★ AN ACTOR AND A PURPOSE, not "Take this on". */}
                  {remaining > 0
                    ? (requestFor(project.id)?.commissionAct ?? project.name)
                    : `No capacity — ${capacity} already commissioned`}
                </button>
              )}
              {project.canVerify && (
                <button type="button" className="secondary verify" onClick={() => onVerify(project.id)}>
                  <SealCheck weight="fill" /> {requestFor(project.id)?.verifyAct ?? 'Have the responsible function test it'}
                </button>
              )}
              {project.verified && (
                <p className="work-verified"><CheckCircle weight="fill" /> Tested, and recorded with its source.</p>
              )}
              {project.performed && !project.verified && (
                <p className="work-performed">Performed. Not yet tested.</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* ★ Displaced work is not a footnote. It is what the choice cost, and it
          persists — the residue outlives the cycle that produced it. */}
      {residue.length > 0 && (
        <section className="work-residue" aria-label="Work that stopped">
          <h3>What stopped</h3>
          <ul>
            {residue.map((item) => (
              <li key={item.id}><b>{item.what}</b><span>{item.because}</span></li>
            ))}
          </ul>
        </section>
      )}

      <button className="primary full" onClick={onAdvance} disabled={!canAdvance}>
        {label}
        <ArrowRight weight="bold" />
      </button>
    </section>
  );
}
