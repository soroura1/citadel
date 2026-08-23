import { useState } from "react";
import { useRun } from "./features/morning/useRun.js";
import { LivingMap } from "./features/morning/LivingMap.jsx";
import { MorningControls } from "./features/morning/MorningControls.jsx";
import { MorningStatus } from "./features/morning/MorningStatus.jsx";
import { MorningStructured } from "./features/morning/MorningStructured.jsx";
import { MorningChanges } from "./features/morning/MorningChanges.jsx";
import { MorningInspector } from "./features/morning/MorningInspector.jsx";
import { PreparednessPanel } from "./features/preparedness/PreparednessPanel.jsx";
import { MissionRibbon } from "./features/narrative/MissionRibbon.jsx";
import { PlaceCard } from "./features/narrative/PlaceCard.jsx";
import { CommitmentTray, OutcomeBar } from "./features/narrative/CommitmentTray.jsx";
import { RecordOverlay } from "./features/narrative/RecordOverlay.jsx";
import { NarrativeStructured } from "./features/narrative/NarrativeStructured.jsx";
import { BuildPanel, buildSurfaceRequested } from "./features/narrative/BuildPanel.jsx";
import { PLACES } from "./sim/world.js";
import {
  ActivityIcon as Activity, ArrowRight, CheckCircle, ClipboardText, Clock, Eye, FirstAidKit,
  Gauge, Gear, Lightning, ListBullets, MagnifyingGlass, MapTrifold, Play,
  ShieldCheck, Storefront, UsersThree, Wrench,
} from "@phosphor-icons/react";

const preparations = [
  { id: "trace", title: "Trace the critical-power path", owner: "Facilities + ICU", effect: "Reveals the older shared route before failure.", cost: "2 technical staff · 1 service access window", icon: Lightning },
  { id: "reserve", title: "Stage the mobile reserve", owner: "Biomedical + Nursing", effect: "Shortens the ICU fallback equipment delay.", cost: "1 equipment cart · ED reserve reduced", icon: FirstAidKit },
  { id: "owner", title: "Clarify restoration ownership", owner: "Quality + Operations", effect: "Prevents competing instructions after interruption.", cost: "Leadership time · store inspection deferred", icon: UsersThree },
  { id: "message", title: "Test the message route", owner: "Operations + ICT", effect: "Makes the first escalation faster and more reliable.", cost: "1 coordinator · routine handover shortened", icon: Gauge },
];

// ⚠️ `id` IS THE DOMAIN PLACE ID, not a presentation key. The map pin, the
// structured row and the simulation all address the same place; two vocabularies
// for one thing is how a projection quietly stops describing the world.
const hotspots = [
  { id: PLACES.ED, label: "Emergency Department", meta: "Arrivals and waiting", top: "34%", left: "17%", icon: Activity },
  { id: PLACES.ICU, label: "Intensive Care", meta: "Physical and staffed positions differ", top: "15%", left: "47%", icon: FirstAidKit },
  { id: PLACES.POWER, label: "Critical Power", meta: "Declared route", top: "18%", left: "82%", icon: Lightning },
  { id: PLACES.STORES, label: "Clinical Stores", meta: "Reserve and ordinary supply origin", top: "43%", left: "69%", icon: Storefront },
  { id: PLACES.WORKSHOP, label: "Technical Workshop", meta: "Technical capacity origin", top: "47%", left: "88%", icon: Wrench },
  { id: PLACES.COORDINATION, label: "Coordination Room", meta: "Morning handover", top: "68%", left: "20%", icon: UsersThree },
  { id: PLACES.UNDERWORKS, label: "Underworks", meta: "Official map incomplete", top: "82%", left: "55%", icon: Gear },
];

/**
 * ⚠️ EVERY PLACE HAS A NAME, INCLUDING THE ONES WITHOUT A MAP PIN.
 *
 * The hotspots above are the seven places a participant can click. The Gate of
 * Names is not one of them — and Bishr stands there in the first beat. Reading
 * a label out of `hotspots` alone returned nothing for the Gate and, worse,
 * silently fell back to whichever place the INSPECTOR happened to have
 * selected: the card said "Bishr · Patient navigator · Gate of Names ·
 * Intensive Care", asserting that a man at the Gate was in the ICU. Correct
 * markup, wrong meaning, and no assertion over the DOM could have seen it.
 */
const PLACE_LABELS = Object.freeze({
  [PLACES.GATE]: "Gate of Names",
  [PLACES.ED]: "Emergency Department",
  [PLACES.ICU]: "Intensive Care",
  [PLACES.STORES]: "Clinical Stores",
  [PLACES.WORKSHOP]: "Technical Workshop",
  [PLACES.UNDERWORKS]: "Underworks",
  [PLACES.COORDINATION]: "Coordination Room",
  [PLACES.POWER]: "Critical Power",
});

const responses = [
  { id: "hold", title: "Hold and stabilise locally", protects: "Continuity in the affected ICU bay", risks: "Increased workload and slower restoration access" },
  { id: "redeploy", title: "Redeploy capacity", protects: "Immediate critical-care coverage", risks: "Moves pressure to ED and another service" },
  { id: "network", title: "Coordinate network support", protects: "Local reserve and staff endurance", risks: "Depends on candid information and external acceptance" },
];

const phaseCopy = {
  operate: ["Hospital heartbeat", "An ordinary difficult day", "Second bell"],
  prepare: ["Preparedness window", "Two pieces of work, no more", "Second bell"],
  incident: ["Localized interruption", "The bay that stayed dark", "Third bell"],
  recovery: ["Recover and improve", "Continuity is not restoration", "Fourth bell"],
  debrief: ["Causal reconstruction", "What changed—and why", "After the bell"],
};

function Brand() {
  return <div className="brand"><span className="brand-mark"><ShieldCheck weight="duotone" /></span><span><b>Citadel</b><small>The Bimaristan · Rawafid</small></span></div>;
}

function Setup({ onStart }) {
  const [role, setRole] = useState("Resilience Lead");
  const [mode, setMode] = useState("solo");
  return (
    <main className="arrival">
      <img className="arrival-art" src="/scenes/first-light.jpg" alt="The Bimaristan rising above Rawafid at first light" />
      <div className="arrival-shade" />
      <section className="arrival-card">
        <Brand />
        {/* ⛔ R0-C05A — "Experience Prototype 0" was a BUILD label on the first
            thing a participant read. § 0.4A puts build labels, review gates and
            candidate status in an owner surface; it is not deleted, it moved to
            `?build=1`. */}
        <p className="kicker arrival-kicker">The Bimaristan · morning shift</p>
        <h1>The institution is already awake.</h1>
        <p className="lede">Read its work. Strengthen what you can. Discover what the official map forgot.</p>
        <div className="safety-note"><ShieldCheck size={21} weight="fill" /><p><b>Preparedness exercise only.</b> Not live incident command, clinical decision support or hospital assessment.</p></div>
        <div className="setup-grid">
          <label>Your portfolio<select value={role} onChange={(e) => setRole(e.target.value)}><option>Resilience Lead</option><option>Quality and Patient Safety</option><option>Clinical Operations</option><option>Facilities and Technical Services</option></select></label>
          <fieldset><legend>Play format</legend><button className={mode === "solo" ? "mode-choice active" : "mode-choice"} onClick={() => setMode("solo")}><Eye /> Solo</button><button className={mode === "team" ? "mode-choice active" : "mode-choice"} onClick={() => setMode("team")}><UsersThree /> Team table</button></fieldset>
        </div>
        <button className="primary large" onClick={() => onStart({ role, mode })}>Enter the morning shift <ArrowRight weight="bold" /></button>
        <p className="prototype-label">A fictional hospital. Nothing you do here reaches a real one.</p>
      </section>
    </main>
  );
}

function TopBar({ profile, structured, setStructured, onRestart }) {
  return <header className="topbar"><Brand /><div className="topbar-center"><Clock /><span>Day 18 · Morning shift</span><span className="separator" /><span>{profile.mode === "team" ? "Facilitated team table" : profile.role}</span></div><div className="topbar-actions"><button className={structured ? "icon-button active" : "icon-button"} onClick={() => setStructured(!structured)}><ListBullets /> {structured ? "Map view" : "Structured view"}</button><button className="quiet-button" onClick={onRestart}>Restart</button></div></header>;
}

/**
 * ⚠️ XP0 PROTOTYPE STATE, FOR THE PHASES THE SIMULATION HAS NOT REACHED.
 *
 * `operate` no longer uses this: it renders `MorningStatus` from the projection.
 * Incident, recovery and debrief still show facilitator-authored readings until
 * `R0-C06`–`C09` simulate them. The duplication is temporary and deliberate —
 * deleting the prototype before its replacement exists would remove a working
 * walk to make room for nothing.
 */
function StatusStrip({ phase }) {
  const incident = phase === "incident", recovery = phase === "recovery" || phase === "debrief";
  const items = [
    ["ED demand", incident ? "Rising" : recovery ? "High" : "High · stable", incident ? "warn" : "ok"],
    ["ICU continuity", incident ? "Fallback active" : recovery ? "Constrained" : "Maintained", incident ? "danger" : recovery ? "warn" : "ok"],
    ["Critical power", incident ? "Route conflict" : recovery ? "Restoring" : "Reporting", incident ? "danger" : recovery ? "warn" : "ok"],
    ["Technical capacity", incident ? "Fully committed" : recovery ? "Limited" : "2 teams available", incident ? "warn" : "ok"],
  ];
  return <div className="status-strip">{items.map(([label, value, tone]) => <div className="status-item" key={label}><span>{label}</span><b className={tone}><i />{value}</b></div>)}</div>;
}

function MapView({ phase, selectedPlace, setSelectedPlace }) {
  const outage = phase !== "operate";
  return <div className="map-stage"><img className="sector-map" src={outage ? "/scenes/bimaristan-sector-outage-v0.1.jpg" : "/scenes/bimaristan-sector-ordinary-v0.1.jpg"} alt={outage ? "Operational sector during the ICU electrical interruption" : "Operational sector during ordinary high-demand service"} /><div className="map-vignette" />{hotspots.map((spot) => { const Icon = spot.icon; return <button key={spot.id} className={selectedPlace === spot.id ? "hotspot active" : "hotspot"} style={{ top: spot.top, left: spot.left }} onClick={() => setSelectedPlace(spot.id)} aria-label={`Inspect ${spot.label}: ${spot.meta}`}><Icon weight="fill" /><span>{spot.label}</span></button>; })}<div className="map-caption"><MapTrifold /> Operational sector · one shared world state</div></div>;
}

function StructuredView({ phase, selectedPlace, setSelectedPlace }) {
  const outage = phase !== "operate";
  return <section className="structured-world"><div className="structured-heading"><ListBullets size={28} /><div><p className="kicker">Equivalent representation</p><h2>Places, routes and current state</h2></div></div><p className="structured-intro">The same places, evidence and actions as the visual map—not a shortened transcript.</p><div className="structured-grid">{hotspots.map((spot) => { const Icon = spot.icon, changed = outage && ["icu", "power", "underworks"].includes(spot.id); return <button key={spot.id} className={selectedPlace === spot.id ? "place-row active" : "place-row"} onClick={() => setSelectedPlace(spot.id)}><Icon /><span><b>{spot.label}</b><small>{changed ? `${spot.meta} · changed` : spot.meta}</small></span><ArrowRight /></button>; })}</div><div className="route-summary"><b>Traceable route</b><span>Critical Power → official conduit → ICU and ED</span><span className={outage ? "changed-route" : ""}>Older changeover → Underworks shared chamber → ICU far bay</span></div></section>;
}

function PlaceInspector({ placeId, phase }) {
  const place = hotspots.find((item) => item.id === placeId) ?? hotspots[1];
  const changed = phase !== "operate" && ["icu", "power", "underworks"].includes(place.id);
  return <section className="inspector-card"><div className="inspector-title"><MagnifyingGlass /><span><small>Inspection</small><b>{place.label}</b></span></div><p>{changed ? "The current state conflicts with the morning report. This place now carries part of the interruption." : place.meta}</p><dl><div><dt>Source</dt><dd>{place.id === "underworks" ? "Walkdown and chalk corrections" : "Local staff and instrument"}</dd></div><div><dt>Confidence</dt><dd>{place.id === "underworks" ? "Partial" : "Current"}</dd></div></dl><button className="text-action">Trace connected dependency <ArrowRight /></button></section>;
}

function PreparationPanel({ selected, toggle, onAdvance }) {
  return <section className="action-panel"><div className="panel-heading"><div><p className="kicker">Preparedness window</p><h2>Choose two pieces of work</h2></div><span className="capacity"><Gauge /> {selected.length}/2 capacity</span></div><p className="panel-intro">Each action protects something and displaces other work. There is no complete option.</p><div className="preparation-list">{preparations.map((item) => { const Icon = item.icon, active = selected.includes(item.id), disabled = !active && selected.length === 2; return <button key={item.id} disabled={disabled} className={active ? "prep-card active" : "prep-card"} onClick={() => toggle(item.id)}><span className="prep-icon"><Icon weight="duotone" /></span><span className="prep-copy"><b>{item.title}</b><small>{item.owner}</small><em>{item.effect}</em><span>{item.cost}</span></span><span className="selection-mark">{active && <CheckCircle weight="fill" />}</span></button>; })}</div><button className="primary full" disabled={selected.length !== 2} onClick={onAdvance}>Run the morning shift <Play weight="fill" /></button></section>;
}

function IncidentPanel({ selected, response, setResponse, onAdvance }) {
  const traced = selected.includes("trace"), reserved = selected.includes("reserve");
  return <section className="action-panel incident-panel"><div className="incident-alert"><Lightning weight="fill" /><span><b>ICU far bay did not return to normal supply.</b><small>The rest of the sector remains powered.</small></span></div><div className="character-beat"><img src="/scenes/bay-that-went-dark.jpg" alt="ICU and technical workers sustaining care" /><div><p className="kicker">Rami · ICU</p><blockquote>“The lights returned in the corridor. Not here. Someone needs to explain why the same board serves two rooms.”</blockquote></div></div><div className="evidence-note"><ClipboardText /><span><b>{traced ? "Your earlier trace exposed the older route." : "The official route does not explain the failure."}</b><small>{reserved ? "The mobile reserve reaches ICU without delay." : "The mobile reserve is still staged for ED."}</small></span></div><p className="kicker response-kicker">Choose or support a response</p><div className="response-list">{responses.map((item) => <button key={item.id} className={response === item.id ? "response-card active" : "response-card"} onClick={() => setResponse(item.id)}><b>{item.title}</b><span><small>Protects</small>{item.protects}</span><span><small>Risks</small>{item.risks}</span></button>)}</div><button className="primary full" disabled={!response} onClick={onAdvance}>Commit within authority <ArrowRight /></button></section>;
}

function RecoveryPanel({ response, onAdvance }) {
  const name = responses.find((item) => item.id === response)?.title;
  return <section className="action-panel"><div className="panel-heading"><div><p className="kicker">Immediate response visible</p><h2>The service continues, constrained.</h2></div><CheckCircle weight="fill" /></div><div className="outcome-stack"><div className="outcome good"><CheckCircle weight="fill" /><span><b>ICU continuity maintained</b><small>{name}</small></span></div><div className="outcome"><Wrench /><span><b>Restoration access remains limited</b><small>Technical capacity is fully committed.</small></span></div><div className="outcome"><Activity /><span><b>Pressure moved, not removed</b><small>{response === "redeploy" ? "ED staffed capacity is now below its ordinary buffer." : "Staff workload and recovery time have increased."}</small></span></div><div className="outcome mystery"><Eye /><span><b>One obligation remains</b><small>The older changeover and official dependency map disagree.</small></span></div></div><div className="next-work"><p className="kicker">Improvement work</p><button><Gear /><span><b>Verify and document the shared changeover</b><small>Facilities · Quality · ICU · 3 fictional days</small></span><CheckCircle weight="fill" /></button></div><button className="primary full" onClick={onAdvance}>Reconstruct the run <ArrowRight /></button></section>;
}

function DebriefPanel({ selected, response, onRestart }) {
  const chosen = preparations.filter((item) => selected.includes(item.id));
  const responseName = responses.find((item) => item.id === response)?.title;
  const chain = [["Ordinary state", "High ED demand, six staffed ICU beds and a reporting power route."], ["Your preparations", chosen.map((item) => item.title).join(" · ")], ["Interruption", "An older shared changeover kept the ICU far bay outside the restored route."], ["Your commitment", responseName], ["Residue", "Care continued, but restoration capacity and trust in the official map remain constrained."]];
  return <section className="action-panel"><div className="panel-heading"><div><p className="kicker">Causal reconstruction</p><h2>What the wall saved</h2></div><ClipboardText /></div><ol className="causal-chain">{chain.map(([title, body], index) => <li key={title}><span>{index + 1}</span><div><b>{title}</b><small>{body}</small></div></li>)}</ol><div className="private-question"><Eye weight="fill" /><span><b>Private observation</b><p>Which essential service in your own hospital may depend on an unofficial route, workaround or person?</p><small>Not scored · not shared · not an assessment</small></span></div><button className="secondary full" onClick={onRestart}>Replay with different preparations</button></section>;
}

/**
 * ★ R0-I1 / R0-C05A — THE LIVING MORNING, AND THE STORY IT IS TELLING.
 *
 * ============================================================================
 * WHAT R0-I1 REPLACED, AND WHAT R0-C05A REPLACED AFTER IT
 * ============================================================================
 * XP0's ordinary phase was a fixed picture with a narration button under it.
 * `R0-I1` made it a deterministic world that the map, the structured view, the
 * status strip and the inspector all project.
 *
 * Then the owner played it and reported the remaining problem: the state was
 * right and the trade-off was real, and the first ten minutes still read as an
 * engine report. *An ordinary difficult day.* *Advance one cycle.* Nothing
 * naming what was being protected, who was asking, or what answered.
 *
 * ============================================================================
 * ★ THE COMPOSITION IS THE OWNER'S OWN REVISION (visual bible § 21.5)
 * ============================================================================
 * A permanent dramatic side panel was rejected. So the hospital stays the
 * largest thing on the screen and the story is distributed through four
 * temporal layers:
 *
 *   1. a compact mission ribbon, always, above the world;
 *   2. a request anchored to the PLACE the person is standing in;
 *   3. a commitment tray that appears for a decision and retracts after it; and
 *   4. an evidence/work-order drawer opened over the same, unmoved, world.
 *
 * ⛔ AND THE CARD IS A SIBLING OF THE MAP, NOT A CHILD OF IT. Below 620px the
 * stylesheet hides `.living-map` and the structured world carries the morning;
 * a request card nested inside the map would have gone with it, and the
 * participant would have lost the person asking at exactly the width where the
 * words matter most.
 */
function LivingMorning({ structured, onReachPreparation }) {
  const [place, setPlace] = useState(PLACES.ICU);
  const [labels, setLabels] = useState(true);
  const [record, setRecord] = useState(false);
  const { view, setMode, setSpeed, advanceCycle, inspect, scheduleProject, verifyProject, perform } =
    useRun(20260822, place);
  const selectPlace = (id) => { setPlace(id); inspect(id); };
  const label = PLACE_LABELS[place] ?? place;
  const ready = view.status === "preparation-window";
  const narrative = view.narrative;
  /* ★ The card names where the SPEAKER is, not what the inspector is showing.
     Two different questions; one of them used to answer the other. */
  const speakerPlace = PLACE_LABELS[narrative.place] ?? narrative.place;

  /* ★ ONE ENTRY POINT FOR EVERY NARRATIVE ACT. An inspection also moves the
     inspector's selection, because the participant asked to look at a place and
     would not expect the panel beside it to still be showing another one. */
  const act = (offered) => {
    if (offered.command === "inspect-place") selectPlace(offered.place);
    else perform(offered);
  };

  return (
    <>
      <MorningStatus strip={view.strip} />
      <MissionRibbon mission={narrative.mission} />
      <MorningControls view={view} onMode={setMode} onSpeed={setSpeed} onAdvance={advanceCycle}
                       labels={labels} onLabels={() => setLabels((on) => !on)}
                       advanceLabel={narrative.next?.command === "advance-cycle" ? narrative.next.label : null} />

      {/* ★ THE WORLD FIRST, AND THE PERSON IN IT. Exactly one of the map and
          the structured world is on screen, and exactly one rendering of the
          beat goes with it — § 21.3 forbids repeating one event in three
          panels. Both read the SAME `view.narrative`. */}
      <div className="nar-stage">
        {structured
          ? <MorningStructured view={view} onSelectPlace={selectPlace} places={hotspots} />
          : <LivingMap view={view} labels={labels} onSelectPlace={selectPlace} hotspots={hotspots} />}
        {structured
          ? <NarrativeStructured narrative={narrative} placeLabel={speakerPlace} />
          : <PlaceCard narrative={narrative} placeLabel={speakerPlace} />}
      </div>

      {/* ★ THE TRAY IS TEMPORARY. Before the act it carries purpose, the
          actor-and-purpose verb and a fair preview; after it, what the world
          did and what is still open. Never both, because they describe two
          different moments. */}
      {narrative.act
        ? <CommitmentTray narrative={narrative} onAct={act} onOpenRecord={() => setRecord(true)} />
        : <OutcomeBar narrative={narrative} onAct={act} onOpenRecord={() => setRecord(true)} />}

      {/* ★ R0-C05 — THE WINDOW IS PART OF THE SAME MORNING, NOT A NEW SCREEN.
          It appears once the requests have been heard, so the four projects
          arrive as four people asking rather than as a specification. The
          engine still refuses a third commitment and still refuses one outside
          the window; nothing here enforces a rule. */}
      {/* ⛔ AND IT STAYS FOR AS LONG AS THE WINDOW IS OPEN. It was briefly gated
          on the requests beat, which read correctly and removed the four cards
          the moment work began — taking the ladder, the residue and the two
          projects NOT taken off the page with them. That is precisely the thing
          R0-C05 exists to prevent: a window listing only your choices cannot
          show you what they cost. Found by walking the page, not by a test. */}
      {ready && (
        <PreparednessPanel
          preparedness={view.preparedness}
          requests={narrative.requests}
          residue={view.residue}
          onSchedule={scheduleProject}
          onVerify={verifyProject}
          onAdvance={advanceCycle}
          canAdvance={view.preparedness.taken > 0} />
      )}

      <div className="game-grid">
        <section className="world-column">
          <MorningInspector inspector={view.inspector} label={label} />
        </section>
        <section className="action-panel">
          {/* ⚠️ THE CHRONOLOGY IS SECONDARY NOW. § 21.1: the event log "may not
              occupy the same visual priority as the current purpose or the
              immediate response". It used to be the first thing under the map. */}
          <MorningChanges changes={view.changes} cycle={view.time.cycle} />
          {!structured && <MorningStructured view={view} onSelectPlace={selectPlace} places={hotspots} />}
          {!ready && (
            <button className="primary full" disabled onClick={onReachPreparation}>
              {`Run ${view.time.ordinaryCycles - view.time.cycle} more ordinary cycle${view.time.ordinaryCycles - view.time.cycle === 1 ? "" : "s"}`}
              <ArrowRight weight="bold" />
            </button>
          )}
        </section>
      </div>

      {record && <RecordOverlay view={view} onClose={() => setRecord(false)} />}
      {buildSurfaceRequested() && <BuildPanel increment="R0-I2A · R0-C05A" narrative={narrative} />}
    </>
  );
}

export function App() {
  const [profile, setProfile] = useState(null), [phase, setPhase] = useState("operate"), [structured, setStructured] = useState(false), [selectedPlace, setSelectedPlace] = useState("icu"), [selected, setSelected] = useState([]), [response, setResponse] = useState(null);
  const restart = () => { setProfile(null); setPhase("operate"); setStructured(false); setSelectedPlace("icu"); setSelected([]); setResponse(null); };
  const toggle = (id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 2 ? [...current, id] : current);
  if (!profile) return <Setup onStart={setProfile} />;
  const copy = phaseCopy[phase];

  /* ★ R0-I1 — THE MORNING IS NOW SIMULATED; THE REST OF THE WALK IS NOT YET.
     `operate` runs the deterministic heartbeat and opens the preparation window
     after two cycles. `prepare`, `incident`, `recovery` and `debrief` remain the
     accepted XP0 treatment, unchanged, until C05–C09 reach them. Rewriting them
     now would replace a working walk with an unfinished one — which § 0.4 of the
     ledger forbids by name. */
  if (phase === "operate") {
    return (
      <main className="game-shell phase-operate">
        <TopBar profile={profile} structured={structured} setStructured={setStructured} onRestart={restart} />
        <LivingMorning structured={structured} onReachPreparation={() => setPhase("prepare")} />
        <footer className="prototype-footer"><span>Fictional preparedness exercise · no patient record, live command or clinical advice</span><span>Same fictional state in solo and team formats</span></footer>
      </main>
    );
  }

  return <main className={`game-shell phase-${phase}`}><TopBar profile={profile} structured={structured} setStructured={setStructured} onRestart={restart} /><StatusStrip phase={phase} /><section className="world-heading"><div><p className="kicker">{copy[0]}</p><h1>{copy[1]}</h1></div><span className="bell"><Clock weight="duotone" />{copy[2]}</span></section><div className="game-grid"><section className="world-column">{structured ? <StructuredView phase={phase} selectedPlace={selectedPlace} setSelectedPlace={setSelectedPlace} /> : <MapView phase={phase} selectedPlace={selectedPlace} setSelectedPlace={setSelectedPlace} />}<PlaceInspector placeId={selectedPlace} phase={phase} /></section>{phase === "prepare" && <PreparationPanel selected={selected} toggle={toggle} onAdvance={() => setPhase("incident")} />}{phase === "incident" && <IncidentPanel selected={selected} response={response} setResponse={setResponse} onAdvance={() => setPhase("recovery")} />}{phase === "recovery" && <RecoveryPanel response={response} onAdvance={() => setPhase("debrief")} />}{phase === "debrief" && <DebriefPanel selected={selected} response={response} onRestart={restart} />}</div><footer className="prototype-footer"><span>XP0 · visual and interaction evidence only</span><span>Same fictional state in solo and team formats</span></footer></main>;
}
