import { useState } from "react";
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

const hotspots = [
  { id: "ed", label: "Emergency Department", meta: "Demand: high but stable", top: "34%", left: "17%", icon: Activity },
  { id: "icu", label: "Intensive Care", meta: "8 physical beds · 6 staffed", top: "15%", left: "47%", icon: FirstAidKit },
  { id: "power", label: "Critical Power", meta: "Primary route reporting", top: "18%", left: "82%", icon: Lightning },
  { id: "stores", label: "Clinical Stores", meta: "Mobile reserve available", top: "43%", left: "69%", icon: Storefront },
  { id: "workshop", label: "Technical Workshop", meta: "2 active work orders", top: "47%", left: "88%", icon: Wrench },
  { id: "council", label: "Coordination Room", meta: "Morning handover open", top: "68%", left: "20%", icon: UsersThree },
  { id: "underworks", label: "Underworks", meta: "Official map incomplete", top: "82%", left: "55%", icon: Gear },
];

const responses = [
  { id: "hold", title: "Hold and stabilise locally", protects: "Continuity in the affected ICU bay", risks: "Increased workload and slower restoration access" },
  { id: "redeploy", title: "Redeploy capacity", protects: "Immediate critical-care coverage", risks: "Moves pressure to ED and another service" },
  { id: "network", title: "Coordinate network support", protects: "Local reserve and staff endurance", risks: "Depends on candid information and external acceptance" },
];

const phaseCopy = {
  operate: ["Hospital heartbeat", "An ordinary difficult day", "Second bell"],
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
        <p className="kicker arrival-kicker">Experience Prototype 0</p>
        <h1>The institution is already awake.</h1>
        <p className="lede">Read its work. Strengthen what you can. Discover what the official map forgot.</p>
        <div className="safety-note"><ShieldCheck size={21} weight="fill" /><p><b>Preparedness exercise only.</b> Not live incident command, clinical decision support or hospital assessment.</p></div>
        <div className="setup-grid">
          <label>Your portfolio<select value={role} onChange={(e) => setRole(e.target.value)}><option>Resilience Lead</option><option>Quality and Patient Safety</option><option>Clinical Operations</option><option>Facilities and Technical Services</option></select></label>
          <fieldset><legend>Play format</legend><button className={mode === "solo" ? "mode-choice active" : "mode-choice"} onClick={() => setMode("solo")}><Eye /> Solo</button><button className={mode === "team" ? "mode-choice active" : "mode-choice"} onClick={() => setMode("team")}><UsersThree /> Team table</button></fieldset>
        </div>
        <button className="primary large" onClick={() => onStart({ role, mode })}>Enter the morning shift <ArrowRight weight="bold" /></button>
        <p className="prototype-label">Visual and interaction prototype · facilitator-controlled state</p>
      </section>
    </main>
  );
}

function TopBar({ profile, structured, setStructured, onRestart }) {
  return <header className="topbar"><Brand /><div className="topbar-center"><Clock /><span>Day 18 · Morning shift</span><span className="separator" /><span>{profile.mode === "team" ? "Facilitated team table" : profile.role}</span></div><div className="topbar-actions"><button className={structured ? "icon-button active" : "icon-button"} onClick={() => setStructured(!structured)}><ListBullets /> {structured ? "Map view" : "Structured view"}</button><button className="quiet-button" onClick={onRestart}>Restart</button></div></header>;
}

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

export function App() {
  const [profile, setProfile] = useState(null), [phase, setPhase] = useState("operate"), [structured, setStructured] = useState(false), [selectedPlace, setSelectedPlace] = useState("icu"), [selected, setSelected] = useState([]), [response, setResponse] = useState(null);
  const restart = () => { setProfile(null); setPhase("operate"); setStructured(false); setSelectedPlace("icu"); setSelected([]); setResponse(null); };
  const toggle = (id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 2 ? [...current, id] : current);
  if (!profile) return <Setup onStart={setProfile} />;
  const copy = phaseCopy[phase];
  return <main className={`game-shell phase-${phase}`}><TopBar profile={profile} structured={structured} setStructured={setStructured} onRestart={restart} /><StatusStrip phase={phase} /><section className="world-heading"><div><p className="kicker">{copy[0]}</p><h1>{copy[1]}</h1></div><span className="bell"><Clock weight="duotone" />{copy[2]}</span></section><div className="game-grid"><section className="world-column">{structured ? <StructuredView phase={phase} selectedPlace={selectedPlace} setSelectedPlace={setSelectedPlace} /> : <MapView phase={phase} selectedPlace={selectedPlace} setSelectedPlace={setSelectedPlace} />}<PlaceInspector placeId={selectedPlace} phase={phase} /></section>{phase === "operate" && <PreparationPanel selected={selected} toggle={toggle} onAdvance={() => setPhase("incident")} />}{phase === "incident" && <IncidentPanel selected={selected} response={response} setResponse={setResponse} onAdvance={() => setPhase("recovery")} />}{phase === "recovery" && <RecoveryPanel response={response} onAdvance={() => setPhase("debrief")} />}{phase === "debrief" && <DebriefPanel selected={selected} response={response} onRestart={restart} />}</div><footer className="prototype-footer"><span>XP0 · visual and interaction evidence only</span><span>Same fictional state in solo and team formats</span></footer></main>;
}
