import { ObservationScreen } from './ObservationScreen.jsx';
import { buildRecord } from '../../engine/record.js';
import { buildObservation, newParticipantRef } from '../../engine/observation.js';
import { buildReflection } from '../../engine/reflection.js';
import { observationAsText, observationAsJson, downloadAsFile } from '../../engine/export.js';
import * as store from '../../engine/local-store.js';

/**
 * ★ THE OBSERVATION SURFACE, COMPOSED WHERE A TEST CAN EXECUTE IT.
 *
 * ============================================================================
 * ⚠️ THE FOURTH TIME THIS SHAPE HAS APPEARED IN ONE WEEK.
 * ============================================================================
 * `main.jsx` cannot be executed by a test — it calls `createRoot` and reads
 * `document`. So anything composed there is untested by construction, and this
 * build has already paid for that three times:
 *
 *   · props enumerated in main.jsx while every test spread the view, so EVS-3's
 *     role panel and private stake never reached the browser;
 *   · a render walker pinned to one role, blind to the other's markup;
 *   · an asset manifest tested on object fixtures the content never produced.
 *
 * The wiring here is the store, the export and the DELETE — the two paths whose
 * whole point is what does and does not leave the device. Leaving them in
 * `main.jsx` would have made the privacy-relevant handlers the only ones no
 * test runs.
 *
 * The store is INJECTED. In the browser it is `localStorage`; in a test it is a
 * memory store whose keys can be enumerated, which is the only way to prove a
 * deletion actually deleted something.
 */
export function ObservationRoute({ run, bundle, local, onDeleted, download = downloadAsFile, t }) {
  const record = run ? buildRecord(run, bundle) : null;
  const ref = () => store.participantRef(local, newParticipantRef);

  /**
   * ⚠️ THE SAVED SHAPE IS BESPOKE, SO IT IS TESTED. The screen holds plain
   * `{ key: text }`; the stored records hold `responses: [{promptKey, text}]`
   * and `sections: { name: {promptKey, text} }`, because that is what the
   * contracts require. Mapping between them is exactly the kind of small
   * translation that works until the day it silently returns `{}` and a
   * participant's saved note appears to have vanished.
   */
  const saved = {
    reflection: Object.fromEntries(
      (store.loadReflection(local)?.responses ?? []).map((r) => [r.promptKey, r.text])),
    observation: Object.fromEntries(
      Object.entries(store.loadObservation(local)?.sections ?? {}).map(([k, v]) => [k, v.text])),
  };

  return (
    <ObservationScreen
      record={record}
      saved={saved}
      onSaveReflection={(answers) => {
        // An empty reflection is REFUSED rather than stored, and the refusal is
        // swallowed here on purpose: the page keeps the participant's text, and
        // the only thing that did not happen is a write of nothing. Nothing is
        // lost and nothing is claimed.
        try {
          store.saveReflection(local, buildReflection({ participantRef: ref(), answers }));
          return { saved: true };
        } catch (e) { return { saved: false, refusal: e.refusal }; }
      }}
      onSaveObservation={(answers) => {
        // ⚠️ SWALLOWED, AND THE REFUSAL IS RETURNED. An incomplete observation
        // cannot be built — B4 requires the uncertainty and the question — so
        // there is nothing to store yet. The surface disables export until all
        // four exist; returning the refusal means a caller that reaches this
        // another way is told which rule applied rather than seeing nothing.
        try {
          store.saveObservation(local, buildObservation({ participantRef: ref(), answers, run }));
          return { saved: true };
        } catch (e) { return { saved: false, refusal: e.refusal }; }
      }}
      onExport={(format, answers) => {
        const record = buildObservation({ participantRef: ref(), answers, run });
        const text = format === 'json' ? observationAsJson(record) : observationAsText(record, t);
        return download({ text, filename: `citadel-observation.${format === 'json' ? 'json' : 'txt'}` });
      }}
      onDelete={() => {
        const removed = store.deleteEverything(local);
        onDeleted?.();
        return removed;
      }}
    />
  );
}
