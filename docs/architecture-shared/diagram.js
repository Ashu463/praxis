// Diagram + steps for architecture-demo.html.
const GH = "https://github.com/Ashu463/lovable/blob/master/";
const NS = "http://www.w3.org/2000/svg";
const W = 1600, H = 1000;

function el(tag, attrs = {}, parent, text) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text != null) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}

// ---------- build the one diagram ----------
// no viewBox = 1 unit is 1 CSS px, which is what lets browser zoom actually enlarge it
function buildSVG(viewBox) {
  const svg = el("svg", viewBox ? { viewBox, preserveAspectRatio: "xMidYMid meet" } : {});
  const defs = el("defs", {}, svg);
  const g = el("linearGradient", { id: "grad", x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
  el("stop", { offset: 0, "stop-color": "#9327db" }, g);
  el("stop", { offset: 1, "stop-color": "#f722a6" }, g);
  const m = el("marker", { id: "arrow", markerWidth: 8, markerHeight: 8, refX: 6, refY: 4, orient: "auto", markerUnits: "userSpaceOnUse" }, defs);
  el("path", { d: "M0,0 L8,4 L0,8 Z", fill: "#5a5a68" }, m);
  const m2 = el("marker", { id: "arrowOn", markerWidth: 8, markerHeight: 8, refX: 6, refY: 4, orient: "auto", markerUnits: "userSpaceOnUse" }, defs);
  el("path", { d: "M0,0 L8,4 L0,8 Z", fill: "#f722a6" }, m2);
  const ma = el("marker", { id: "mini", markerWidth: 6, markerHeight: 6, refX: 5, refY: 3, orient: "auto", markerUnits: "userSpaceOnUse" }, defs);
  el("path", { d: "M0,0 L6,3 L0,6 Z", fill: "#5a5a68" }, ma);

  const cam = el("g", { id: "cam" }, svg);
  const layers = { frame: el("g", {}, cam), edges: el("g", {}, cam), nodes: el("g", {}, cam) };

  // worker process frame
  const fg = el("g", { class: "frame-g", "data-node": "worker" }, layers.frame);
  el("rect", { x: 30, y: 290, width: 1150, height: 575, rx: 16, class: "frame" }, fg);
  el("text", { x: 50, y: 316, class: "t-tag" }, fg, "worker process · :3001");

  const box = (id, x, y, w, h, tag, title, sub) => {
    const n = el("g", { class: "node", "data-node": id }, layers.nodes);
    el("rect", { x, y, width: w, height: h, rx: 14, class: "n-box" }, n);
    el("text", { x: x + 18, y: y + 28, class: "t-tag" }, n, tag);
    el("text", { x: x + 18, y: y + 54, class: "t-title" }, n, title);
    if (sub) el("text", { x: x + 18, y: y + 76, class: "t-sub" }, n, sub);
    return n;
  };
  const detail = (parentNode, of) => el("g", { class: "detail", "data-of": of }, parentNode);
  const pill = (p, x, y, w, h, t, hi) => {
    el("rect", { x, y, width: w, height: h, rx: h / 2, class: "pill" + (hi ? " hi" : "") }, p);
    el("text", { x: x + w / 2, y: y + h / 2 + 3.5, class: "p-text", "text-anchor": "middle" }, p, t);
  };
  const area = (p, id, x, y, w, h, label) => {
    const a = el("g", { "data-area": id }, p);
    el("rect", { x, y, width: w, height: h, rx: 10, class: "area" }, a);
    el("text", { x: x + 10, y: y + 15, class: "area-label" }, a, label);
    return a;
  };
  const mini = (p, d) => el("path", { d, class: "mini", "marker-end": "url(#mini)" }, p);
  const cap = (p, x, y, t) => el("text", { x, y, class: "cap" }, p, t);

  // top lane
  box("browser", 60, 70, 200, 110, "01 · client", "Browser", "React · RunProvider");
  box("api", 330, 70, 220, 110, "02 · :3000", "GraphQL API", "createRun · continueRun");
  box("bullmq", 620, 70, 220, 110, "queue · run-agent", "BullMQ", "concurrency 5 · lock 300s");
  const ing = box("inngest", 960, 50, 340, 190, "05 · :8288", "Inngest", "durable steps · replay");
  box("stores", 1360, 70, 200, 110, "state", "Postgres + Redis", ":5433 · :6380");

  // inngest inner: step timeline
  {
    const d = detail(ing, "inngest");
    const a = area(d, "steps", 975, 138, 312, 90, "step.run checkpoints");
    const steps = [["plan ✓", 0], ["L0 ✓", 0], ["L0 gate ✓", 0], ["L1 ✗", 1], ["summary", 0]];
    steps.forEach(([t, bad], i) => pill(a, 985 + i * 60, 162, 56, 20, t, bad));
    cap(a, 985, 202, "crash at L1 → Inngest re-invokes from the top;");
    cap(a, 985, 215, "✓ steps return their saved result instantly");
  }

  // bootstrap
  const bs = box("bootstrap", 60, 340, 400, 300, "03 · CallAgent", "Bootstrap gates");
  {
    const d = detail(bs, "bootstrap");
    d.setAttribute("transform", "translate(0,14)");
    const a = area(d, "gates", 75, 380, 370, 232, "one query · then the gates");
    pill(a, 90, 405, 150, 26, "dev gate");
    pill(a, 90, 450, 150, 26, "unanswered Qs? → ask");
    pill(a, 90, 495, 150, 26, "answers? → fold in");
    pill(a, 90, 540, 150, 26, "clarify + complexity");
    mini(a, "M165,431 V448"); mini(a, "M165,476 V493"); mini(a, "M165,521 V538");
    pill(a, 275, 430, 155, 26, "complex → UI prefs");
    pill(a, 275, 480, 155, 26, "simple → 3 designs");
    pill(a, 275, 540, 155, 26, "pass → inngest.send", 1);
    mini(a, "M240,553 H258 V443 H273"); mini(a, "M258,493 H273");
    mini(a, "M352,456 V478"); mini(a, "M352,506 V538");
    cap(a, 90, 600, "any gate needing input = pause event + job ends");
  }

  // orchestrator
  const or = box("orch", 520, 340, 640, 400, "07 · complex path", "Orchestrator");
  {
    const d = detail(or, "orch");
    pill(d, 545, 405, 120, 30, "Planner", 1);
    cap(d, 548, 450, "prompt → todos + deps");
    mini(d, "M665,420 H686");

    const dag = area(d, "dag", 690, 375, 225, 170, "DAG levels");
    const task = (x, y, w, t, wt) => {
      if (wt) el("rect", { x: x - 4, y: y - 4, width: w + 8, height: 30, rx: 8, class: "area" }, dag);
      pill(dag, x, y, w, 22, t);
    };
    task(702, 440, 52, "coder");
    task(778, 400, 62, "coder", 1); task(778, 440, 62, "uiExpert", 1); task(778, 480, 62, "coder", 1);
    task(862, 420, 46, "coder"); task(862, 460, 46, "uiExp");
    mini(dag, "M754,451 H770"); mini(dag, "M844,451 H858");
    cap(dag, 700, 530, "same level runs in parallel, own git worktree");

    const gate = area(d, "gate", 930, 375, 215, 170, "merge gate");
    pill(gate, 945, 400, 100, 22, "npm run build");
    pill(gate, 945, 450, 75, 22, "tester");
    pill(gate, 1045, 450, 85, 22, "debuggerr");
    mini(gate, "M995,422 V447"); mini(gate, "M1020,461 H1042");
    mini(gate, "M1087,450 V411 H1048");
    cap(gate, 945, 495, "error traced to the task that");
    cap(gate, 945, 508, "owns the file · ≤ 3 rounds");
    mini(d, "M915,460 H927");

    const loop = area(d, "loop", 540, 560, 310, 165, "subagent loop");
    pill(loop, 555, 592, 115, 24, "LLM (BAML)", 1);
    pill(loop, 720, 592, 110, 24, "tool call");
    pill(loop, 720, 655, 115, 24, "run in sandbox");
    pill(loop, 555, 655, 125, 24, "result → context");
    mini(loop, "M670,604 H717"); mini(loop, "M777,616 V652"); mini(loop, "M720,667 H683"); mini(loop, "M612,655 V619");
    cap(loop, 555, 705, "coder · uiExpert · debuggerr · tester");
    cap(loop, 555, 717, "2 attempts with backoff, inside one step");

    const fin = area(d, "fin", 870, 560, 275, 165, "after each level");
    pill(fin, 885, 590, 245, 24, "decide: continue / replan / abort");
    pill(fin, 885, 630, 110, 24, "summarize");
    pill(fin, 885, 670, 245, 24, "finalizeRun → preview URL", 1);
    mini(fin, "M940,614 V627"); mini(fin, "M940,654 V667");
  }

  // simple agent
  box("agent", 520, 765, 300, 80, "12 · simple path", "Agent", "one generalist loop on the picked design");

  // sandbox
  const sb = box("sandbox", 1210, 300, 350, 300, "13 · runtime", "E2B sandbox");
  {
    const d = detail(sb, "sandbox");
    const a = area(d, "box", 1230, 380, 170, 165, "/app");
    pill(a, 1242, 405, 146, 22, "vite + react project");
    pill(a, 1242, 440, 146, 22, "npm run build");
    pill(a, 1242, 475, 146, 22, "preview URL", 1);
    const r = area(d, "r2", 1452, 400, 95, 110, "R2 bucket");
    cap(r, 1462, 440, "users/<id>/");
    cap(r, 1462, 455, "projects/<id>/");
    cap(r, 1462, 470, "files/…");
    mini(d, "M1452,425 H1404"); mini(d, "M1400,490 H1449");
    cap(d, 1410, 418, "restore");
    cap(d, 1408, 505, "SyncR2");
    cap(d, 1232, 568, "files outlive the sandbox");
  }

  // llms + stitch
  const ex = box("stitch", 1210, 640, 350, 125, "external", "LLMs + Stitch");
  {
    const d = detail(ex, "stitch");
    pill(d, 1228, 715, 150, 26, "BAML typed clients");
    pill(d, 1390, 715, 150, 26, "Stitch screens", 1);
  }

  // event bus
  const bus = box("bus", 30, 895, 1530, 70, "14 · event bus", "createRunEmitter → RunEvent (Postgres) + Redis pub/sub → runEvents subscription");
  bus.querySelector(".t-title").setAttribute("style", "font-size:19px");

  // ---------- edges ----------
  const edge = (id, d, label, lx, ly, dashed) => {
    const e = el("g", { class: "edge", "data-edge": id }, layers.edges);
    el("path", { d, class: "e-path" + (dashed ? " dash" : ""), "marker-end": "url(#arrow)" }, e);
    if (label) el("text", { x: lx, y: ly, class: "e-label" }, e, label);
    return e;
  };
  edge("e1", "M260,125 H326", "createRun", 266, 116);
  edge("e2", "M550,125 H616", "enqueue", 558, 116);
  edge("e3", "M730,180 V250 H320 V336", "job", 740, 222);
  edge("e4", "M150,340 V184", "pause → modal", 158, 270, 1);
  edge("e5", "M400,340 V275 H1030 V244", "inngest.send", 860, 268);
  edge("e6", "M1130,240 V336", "POST /api/inngest", 1138, 300);
  edge("e6b", "M1270,240 V262 H1190 V752 H700 V762", "run.simple", 1196, 700);
  edge("e7", "M1160,480 H1206", "", 0, 0);
  edge("e8", "M820,815 H1330 V604", "", 0, 0);
  edge("e9", "M1160,660 H1206", "", 0, 0);
  edge("e10", "M440,70 V38 H1460 V66", "persist", 900, 32);
  edge("b1", "M260,640 V891", "", 0, 0);
  edge("b2", "M840,740 V891", "", 0, 0);
  edge("b3", "M670,845 V891", "", 0, 0);
  edge("b4", "M45,895 V125 H56", "live feed", 52, 560);
  return svg;
}

// ---------- steps: camera rect [x,y,w,h], nodes lit, edges lit, detail groups shown, sub-area highlighted ----------
const L = (path, line) => [path.split("/").pop() + ":" + line, GH + path + "#L" + line];
const STEPS = [
  { t: "The whole system", cam: [0, 0, 1600, 1000], all: true,
    p: "Browser, API, queue, worker, durable engine, sandbox and the event bus. Everything that follows zooms into one piece of this picture." },
  { t: "A prompt comes in", cam: [30, 30, 850, 220], nodes: ["browser", "api", "bullmq", "stores"], edges: ["e1", "e2", "e10"],
    p: "<code>createRun</code> writes a Run row and drops a job on BullMQ. The request is done in milliseconds — the API never even loads the agent code.",
    links: [L("apps/backend/src/graphql/modules/chat.ts", 96)] },
  { t: "The worker picks it up", cam: [30, 40, 880, 640], nodes: ["bullmq", "worker", "bootstrap", "sandbox"], edges: ["e3"],
    p: "A BullMQ consumer starts or reconnects the E2B sandbox, then hands the run to <code>CallAgent</code>.",
    links: [L("apps/backend/src/lib/worker.ts", 29), L("packages/agents/agent/utils/sandbox.ts", 57)] },
  { t: "Bootstrap: every question before any code", cam: [55, 330, 410, 320], nodes: ["bootstrap"], show: ["bootstrap"], hot: "gates",
    p: "One query fetches questions, answers, designs, complexity and UI preferences. Then the gates run in order, and the complex and simple paths split here.",
    links: [L("packages/agents/agent/callAgent.ts", 56)] },
  { t: "Pausing is a real state", cam: [30, 40, 560, 640], nodes: ["browser", "api", "bootstrap"], edges: ["e4", "e1", "e3"], show: ["bootstrap"],
    p: "A gate that needs input emits a pause event, the Run flips to an <code>AWAITING_*</code> status and the job ends. <code>continueRun</code> re-queues the same runId.",
    links: [L("apps/backend/src/graphql/modules/chat.ts", 170)] },
  { t: "The handoff to Inngest", cam: [360, 30, 960, 540], nodes: ["bootstrap", "inngest", "orch", "agent"], edges: ["e5", "e6", "e6b"],
    p: "Only when every gate passes does it call <code>inngest.send</code>. The BullMQ job finishes in seconds, and Inngest calls back into the worker to run the real build.",
    links: [L("packages/agents/agent/callAgent.ts", 441), L("packages/agents/agent/callAgent.ts", 533)] },
  { t: "Durable steps", cam: [955, 45, 350, 200], nodes: ["inngest"], show: ["inngest"], hot: "steps",
    p: "Every <code>step.run</code> is a checkpoint. After a crash Inngest replays from the top, and finished steps return their saved result — a crash at level 1 resumes at level 1.",
    links: [L("packages/agents/agent/orchestrator.ts", 340)] },
  { t: "Orchestrator: plan, then a DAG", cam: [515, 335, 650, 410], nodes: ["orch"], show: ["orch"],
    p: "The planner turns the prompt into todos with dependencies. The DAG sorts them into levels that run one after another.",
    links: [L("packages/agents/agent/orchestrator.ts", 340)] },
  { t: "Parallel tasks get their own worktree", cam: [684, 368, 237, 185], nodes: ["orch"], show: ["orch"], hot: "dag",
    p: "Tasks in the same level run at once, each in its own git worktree, then merge back one at a time. A real conflict fails that task instead of silently losing work.",
    links: [L("packages/agents/agent/orchestrator.ts", 149), L("packages/agents/agent/utils/gitWorktree.ts", 12)] },
  { t: "Inside a subagent", cam: [535, 553, 320, 178], nodes: ["orch"], show: ["orch"], hot: "loop",
    p: "coder, uiExpert, debuggerr and tester share one loop: LLM → tool call → run it in the sandbox → feed the result back. Failures retry inside the same step.",
    links: [L("packages/agents/agent/subAgent.ts", 123), L("packages/agents/agent/orchestrator.ts", 128)] },
  { t: "The merge gate", cam: [924, 368, 227, 185], nodes: ["orch"], show: ["orch"], hot: "gate",
    p: "After every level <code>npm run build</code> has to pass. If it doesn't, the tester finds the error, it's traced to the owning task, and the debugger fixes it.",
    links: [L("packages/agents/agent/orchestrator.ts", 241)] },
  { t: "UIExpert and Stitch", cam: [530, 545, 1040, 230], nodes: ["orch", "stitch"], edges: ["e9"], show: ["orch", "stitch"], hot: "loop",
    p: "Simple path: 3 Stitch variants to pick from. Complex path: one base template per screen, built straight from the stored UI preferences.",
    links: [L("packages/agents/agent/subagents/uiExpert.ts", 55), L("packages/agents/agent/subagents/uiExpert.ts", 105)] },
  { t: "Simple path: one generalist", cam: [500, 700, 860, 170], nodes: ["agent", "sandbox"], edges: ["e6b", "e8"],
    p: "Simple requests skip the planner: a single Agent loop builds on top of the design the user picked.",
    links: [L("packages/agents/agent/agent.ts", 81), L("packages/agents/agent/callAgent.ts", 558)] },
  { t: "Sandbox and R2", cam: [1205, 295, 360, 310], nodes: ["sandbox"], show: ["sandbox"], edges: ["e7"],
    p: "All code runs in an E2B sandbox. Files are restored from R2 when it starts and synced back as they change, so a dead sandbox never loses the project.",
    links: [L("packages/agents/agent/utils/sandbox.ts", 95), L("packages/agents/agent/utils/sandbox.ts", 351)] },
  { t: "Every step streams back", cam: [0, 0, 1600, 1000], nodes: ["bus", "browser", "bootstrap", "orch", "agent"], edges: ["b1", "b2", "b3", "b4"],
    p: "Each event is written to the RunEvent table and published on Redis. The subscription replays history, then tails live — a refresh mid-build shows the full feed.",
    links: [L("packages/agents/agent/events.ts", 73), L("apps/backend/src/graphql/modules/stream.ts", 21)] },
  { t: "Pull back out", cam: [0, 0, 1600, 1000], all: true,
    p: "Same diagram you started with — now every box has a story behind it.",
    links: [L("packages/agents/agent/callAgent.ts", 509)] },
];


// Shared by both pages: dims/lights the diagram for one step. Detail text only
// shows for the component being zoomed, so the overview stays readable.
function paint(svg, s) {
  const nodes = new Set(s.nodes || []), edges = new Set(s.edges || []), show = new Set(s.show || []);
  svg.querySelectorAll("[data-node]").forEach((n) => {
    const id = n.dataset.node;
    n.classList.toggle("dim", !s.all && !nodes.has(id));
    // no glow on deep zooms — the box edge would fill the frame as a band
    n.classList.toggle("focus", !s.all && !s.hot && nodes.has(id) && n.classList.contains("node"));
  });
  svg.querySelectorAll("[data-edge]").forEach((e) => {
    const on = edges.has(e.dataset.edge);
    e.classList.toggle("on", on);
    e.classList.toggle("dim", !s.all && !on);
    e.querySelector("path").setAttribute("marker-end", on ? "url(#arrowOn)" : "url(#arrow)");
  });
  svg.querySelectorAll(".detail").forEach((d) => d.classList.toggle("show", show.has(d.dataset.of)));
  svg.querySelectorAll("[data-area]").forEach((a) => {
    a.classList.toggle("hot", a.dataset.area === s.hot);
    a.style.opacity = s.hot && a.dataset.area !== s.hot && a.closest(".detail").classList.contains("show") ? ".35" : "";
  });
}
