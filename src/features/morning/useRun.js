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
    restart: () => setRun(startRun(seed)),
  };
}
