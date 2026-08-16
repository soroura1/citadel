/**
 * Scenario and severity configuration. (R3 C13, C14)
 *
 * ★ THE CONFIGURABILITY PROOF IS "A NEW SCENARIO PLAYS WITHOUT ENGINE CHANGES".
 *
 * Not "the engine is configurable". The plan is explicit that a **synthetic
 * eighth scenario** must reach a scene's end from a test fixture — because an
 * engine that needs a code change per scenario is a hard-coded engine with a
 * configuration file attached, and nobody discovers that until the second
 * scenario is due.
 */

export class ConfigurationRefusal extends Error {
  constructor(refusal, detail) {
    super(detail ? `${refusal}: ${detail}` : refusal);
    this.refusal = refusal;
    this.detail = detail;
  }
}

/**
 * A scenario is DATA. The engine knows the shape, never the members.
 *
 * There is no list of valid scenario ids here on purpose: adding one must not
 * require editing this file.
 */
export function defineScenario({ id, label, severity, startingBands = {}, variables = {} }) {
  if (!id) throw new ConfigurationRefusal('scenario-has-no-id');
  if (!severity) throw new ConfigurationRefusal('scenario-has-no-severity', id);
  return Object.freeze({ id, label, severity, startingBands, variables });
}

/**
 * Resolve a scene's content for a scenario.
 *
 * ⚠️ A scenario supplies VARIABLES, never alternative prose. Letting a scenario
 * carry its own scene text is how eight scenarios become eight forks of the
 * same scene that drift apart, and the drift is invisible because each one
 * reads fine alone.
 */
export function resolveForScenario(scene, scenario) {
  const substitute = (text) =>
    typeof text === 'string'
      ? text.replace(/\{\{(\w+)\}\}/g, (whole, name) =>
          Object.hasOwn(scenario.variables, name) ? scenario.variables[name] : whole)
      : text;

  const walk = (v) =>
    Array.isArray(v) ? v.map(walk)
      : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]))
      : substitute(v);

  return walk(scene);
}

/** Starting state for a scenario — severity moves where the run begins, not how it plays. */
export function startingStateFor(scenario, initial) {
  const season = { ...initial };
  for (const [v, band] of Object.entries(scenario.startingBands)) {
    if (!Object.hasOwn(season, v)) {
      throw new ConfigurationRefusal('unknown-season-variable', `${scenario.id} sets ${v}`);
    }
    season[v] = band;
  }
  return { season, chapter: {}, log: [], pending: [] };
}
