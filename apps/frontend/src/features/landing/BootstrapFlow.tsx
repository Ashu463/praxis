import { Flowchart, type FlowEdge, type FlowNode } from "@/features/landing/Flowchart";

const NODES: FlowNode[] = [
  [170, 8, 160, 38, "New prompt", "from the worker", "step"],
  [150, 74, 200, 44, "Development request?", "CheckIsDevelopmentRequest", "gate"],
  [384, 76, 116, 40, "Chat reply", "no build · done", "end"],
  [150, 146, 200, 44, "Complex or simple?", "CheckComplexity · cached", "gate"],
  [150, 218, 200, 44, "Anything unclear?", "GenerateClarifyingQuestions", "gate"],
  [384, 220, 116, 40, "Ask the user", "pause", "pause"],
  [40, 312, 170, 44, "3 UI designs", "Stitch variants", "step"],
  [290, 312, 170, 44, "UI preference Qs", "project-wide style", "step"],
  [40, 384, 170, 40, "User picks one", "pause", "pause"],
  [290, 384, 170, 40, "User answers", "pause", "pause"],
  [40, 452, 170, 38, "run.simple → Inngest", "", "end"],
  [290, 452, 170, 38, "run.complex → Inngest", "", "end"],
];

const EDGES: FlowEdge[] = [
  ["M250,46 V70", "", 0, 0],
  ["M350,96 H380", "no", 356, 90],
  ["M250,118 V142", "yes", 258, 134],
  ["M250,190 V214", "", 0, 0],
  ["M350,240 H380", "yes", 356, 234],
  ["M250,262 V284 H125 V308", "simple", 136, 279],
  ["M250,284 H375 V308", "complex", 318, 279],
  ["M125,356 V380", "", 0, 0],
  ["M375,356 V380", "", 0, 0],
  ["M125,424 V448", "", 0, 0],
  ["M375,424 V448", "", 0, 0],
];

export function BootstrapFlow() {
  return <Flowchart nodes={NODES} edges={EDGES} height={496} label="Bootstrap gate flowchart" />;
}
