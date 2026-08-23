import { useCallback, useMemo, useState } from 'react';
import { startRun, dispatch } from '../../sim/engine.js';
import { command, COMMANDS } from '../../sim/commands.js';
import { project } from '../../projections/project.js';

/**
 * R0-C04 — THE ONE PLACE REACT TOUCHES THE SIMULATION.
 *
 * ★ COMPONENTS SEND COMMANDS AND READ A PROJECTION. They never reach into the
 * world, and they hold no operational state of their own — `technical-design.md`
 * § 2. Everything below is a thin, testable wrapper so that rule has exactly one
 * place it could be broken.
 */
export function useRun(seed, selectedPlace) {
  const [run, setRun] = useState(() => startRun(seed));
  const send = useCallback((cmd) => setRun((current) => dispatch(current, cmd)), []);

  const view = useMemo(() => project(run, { selectedPlace }), [run, selectedPlace]);

  return {
    run,
    view,
    setMode: (mode) => send(command(COMMANDS.SET_CLOCK_MODE, { mode })),
    setSpeed: (speed) => send(command(COMMANDS.SET_SPEED, { speed })),
    advanceCycle: () => send(command(COMMANDS.ADVANCE_CYCLE)),
    inspect: (place) => send(command(COMMANDS.INSPECT_PLACE, { place })),
    scheduleProject: (project) => send(command(COMMANDS.SCHEDULE_PROJECT, { project })),
    verifyProject: (project) => send(command(COMMANDS.VERIFY_PROJECT, { project })),
    /**
     * ★ R0-C05A — PERFORM THE ACT THE PROJECTION OFFERED.
     *
     * The narrative names an actor and a purpose; the command it reaches is one
     * of the existing four. No new command type was added, because the finding
     * was about how the first ten minutes read, not about what the simulation
     * can do — and § 0.4B permits changing the rules only against a *named*
     * contradiction, which this is not.
     *
     * ⚠️ THE RUN STARTS PAUSED, and `advance-cycle` is refused while paused. So
     * an advance offered by the narrative resumes into `act-advanced` first —
     * which is precisely that mode's meaning: the participant deciding they are
     * ready, rather than a timer deciding for them. It is not a way around the
     * pause rule; the pause rule is what makes it necessary to say so.
     */
    perform: (act) => setRun((current) => {
      switch (act.command) {
        case COMMANDS.ADVANCE_CYCLE:
          return dispatch(
            current.world.time.mode === 'paused'
              ? dispatch(current, command(COMMANDS.SET_CLOCK_MODE, { mode: 'act-advanced' }))
              : current,
            command(COMMANDS.ADVANCE_CYCLE));
        case COMMANDS.VERIFY_PROJECT:
          return dispatch(current, command(COMMANDS.VERIFY_PROJECT, { project: act.project }));
        case COMMANDS.SCHEDULE_PROJECT:
          return dispatch(current, command(COMMANDS.SCHEDULE_PROJECT, { project: act.project }));
        case COMMANDS.INSPECT_PLACE:
          return dispatch(current, command(COMMANDS.INSPECT_PLACE, { place: act.place }));
        default:
          return current;   // a surface act changes no world state, by definition
      }
    }),
    restart: () => setRun(startRun(seed)),
  };
}
