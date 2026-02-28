export type TopicId = "ai" | "cs" | "math" | "quant" | "physics" | "stat" | "eess";

export interface Subtopic {
  id: string;
  label: string;
  arxivCategories: string[];
}

export interface Topic {
  id: TopicId;
  label: string;
  subtopics: Subtopic[];
}

export const TOPICS: Topic[] = [
  {
    id: "ai",
    label: "A.I.",
    subtopics: [
      { id: "everything", label: "Everything", arxivCategories: ["cs.AI", "cs.LG"] },
      { id: "llms", label: "LLMs", arxivCategories: ["cs.CL"] },
      { id: "cv", label: "CV", arxivCategories: ["cs.CV"] },
      { id: "robotics", label: "Robotics", arxivCategories: ["cs.RO"] },
      { id: "rl", label: "RL", arxivCategories: ["cs.AI"] },
      { id: "multimodal", label: "Multimodal", arxivCategories: ["cs.MM"] },
      { id: "audio-speech", label: "Audio/Speech", arxivCategories: ["cs.SD", "eess.AS"] },
      { id: "ir", label: "Information Retrieval", arxivCategories: ["cs.IR"] },
      { id: "neural-arch", label: "Neural Architecture", arxivCategories: ["cs.NE"] },
      { id: "ml-theory", label: "ML Theory", arxivCategories: ["stat.ML"] },
    ],
  },
  {
    id: "cs",
    label: "Computer Science",
    subtopics: [
      { id: "everything", label: "Everything", arxivCategories: [
        "cs.AI", "cs.CL", "cs.CV", "cs.LG", "cs.DS", "cs.DB", "cs.NI",
        "cs.CR", "cs.SE", "cs.DC", "cs.HC", "cs.PL", "cs.CC", "cs.RO",
        "cs.IR", "cs.NE", "cs.MM", "cs.SD", "cs.SI", "cs.GT", "cs.AR",
        "cs.CY", "cs.DL", "cs.FL", "cs.GR", "cs.LO",
      ] },
      { id: "algorithms", label: "Algorithms", arxivCategories: ["cs.DS"] },
      { id: "databases", label: "Databases", arxivCategories: ["cs.DB"] },
      { id: "networks", label: "Networks", arxivCategories: ["cs.NI"] },
      { id: "security", label: "Security", arxivCategories: ["cs.CR"] },
      { id: "se", label: "Software Eng.", arxivCategories: ["cs.SE"] },
      { id: "distributed", label: "Distributed Systems", arxivCategories: ["cs.DC"] },
      { id: "hci", label: "HCI", arxivCategories: ["cs.HC"] },
      { id: "pl", label: "Programming Languages", arxivCategories: ["cs.PL"] },
      { id: "theory", label: "Theory", arxivCategories: ["cs.CC"] },
    ],
  },
  {
    id: "math",
    label: "Mathematics",
    subtopics: [
      { id: "everything", label: "Everything", arxivCategories: [
        "math.AG", "math.RA", "math.AP", "math.CA", "math.FA", "math.CO",
        "math.DG", "math.MG", "math.NT", "math.PR", "math.OC", "math.AT",
        "math.GT", "math.AC", "math.NA", "math.LO", "math.ST", "math.QA",
        "math.RT", "math.DS", "math.SP",
      ] },
      { id: "algebra", label: "Algebra", arxivCategories: ["math.AG", "math.RA"] },
      { id: "analysis", label: "Analysis", arxivCategories: ["math.AP", "math.CA", "math.FA"] },
      { id: "combinatorics", label: "Combinatorics", arxivCategories: ["math.CO"] },
      { id: "geometry", label: "Geometry", arxivCategories: ["math.DG", "math.MG"] },
      { id: "number-theory", label: "Number Theory", arxivCategories: ["math.NT"] },
      { id: "probability", label: "Probability", arxivCategories: ["math.PR"] },
      { id: "optimization", label: "Optimization", arxivCategories: ["math.OC"] },
      { id: "topology", label: "Topology", arxivCategories: ["math.AT", "math.GT"] },
    ],
  },
  {
    id: "quant",
    label: "Quant. Finance",
    subtopics: [
      { id: "everything", label: "Everything", arxivCategories: [
        "q-fin.CP", "q-fin.MF", "q-fin.PM", "q-fin.PR", "q-fin.RM",
        "q-fin.TR", "q-fin.EC", "q-fin.GN", "q-fin.ST",
      ] },
      { id: "comp-finance", label: "Comp. Finance", arxivCategories: ["q-fin.CP"] },
      { id: "math-finance", label: "Mathematical Finance", arxivCategories: ["q-fin.MF"] },
      { id: "portfolio", label: "Portfolio Mgmt", arxivCategories: ["q-fin.PM"] },
      { id: "pricing", label: "Pricing", arxivCategories: ["q-fin.PR"] },
      { id: "risk", label: "Risk Mgmt", arxivCategories: ["q-fin.RM"] },
      { id: "trading", label: "Trading", arxivCategories: ["q-fin.TR"] },
    ],
  },
  {
    id: "physics",
    label: "Physics",
    subtopics: [
      { id: "everything", label: "Everything", arxivCategories: [
        "astro-ph", "cond-mat", "hep-ph", "hep-th", "quant-ph", "gr-qc",
        "math-ph", "nucl-th", "nucl-ex", "hep-ex", "hep-lat",
        "physics.comp-ph", "physics.data-an", "physics.gen-ph",
      ] },
      { id: "astrophysics", label: "Astrophysics", arxivCategories: ["astro-ph"] },
      { id: "condensed-matter", label: "Condensed Matter", arxivCategories: ["cond-mat"] },
      { id: "hep", label: "HEP", arxivCategories: ["hep-ph", "hep-th"] },
      { id: "quantum", label: "Quantum", arxivCategories: ["quant-ph"] },
      { id: "stat-mech", label: "Statistical Mechanics", arxivCategories: ["cond-mat.stat-mech"] },
    ],
  },
  {
    id: "stat",
    label: "Statistics",
    subtopics: [
      { id: "everything", label: "Everything", arxivCategories: [
        "stat.AP", "stat.CO", "stat.ME", "stat.ML", "stat.TH", "stat.OT",
      ] },
      { id: "applications", label: "Applications", arxivCategories: ["stat.AP"] },
      { id: "computation", label: "Computation", arxivCategories: ["stat.CO"] },
      { id: "methodology", label: "Methodology", arxivCategories: ["stat.ME"] },
      { id: "ml", label: "ML", arxivCategories: ["stat.ML"] },
      { id: "theory", label: "Theory", arxivCategories: ["stat.TH"] },
    ],
  },
  {
    id: "eess",
    label: "Elec. Eng.",
    subtopics: [
      { id: "everything", label: "Everything", arxivCategories: [
        "eess.AS", "eess.IV", "eess.SP", "eess.SY",
      ] },
      { id: "audio-speech", label: "Audio/Speech", arxivCategories: ["eess.AS"] },
      { id: "image-video", label: "Image/Video", arxivCategories: ["eess.IV"] },
      { id: "signal", label: "Signal Processing", arxivCategories: ["eess.SP"] },
      { id: "systems", label: "Systems", arxivCategories: ["eess.SY"] },
    ],
  },
];

export function getTopicById(topicId: TopicId): Topic | undefined {
  return TOPICS.find((t) => t.id === topicId);
}

export function getSubtopicsForTopic(topicId: TopicId): Subtopic[] {
  return getTopicById(topicId)?.subtopics ?? [];
}

export function getArxivCategoriesForSubtopic(
  topicId: TopicId,
  subtopicId: string
): string[] {
  const topic = getTopicById(topicId);
  if (!topic) return [];
  const sub = topic.subtopics.find((s) => s.id === subtopicId);
  return sub?.arxivCategories ?? [];
}

export function isHuggingFaceSource(topicId: TopicId, subtopicId: string): boolean {
  return topicId === "ai" && subtopicId === "everything";
}

export function getTopicLabel(topicId: TopicId): string {
  return getTopicById(topicId)?.label ?? topicId;
}

export function getSubtopicLabel(topicId: TopicId, subtopicId: string): string {
  const topic = getTopicById(topicId);
  if (!topic) return subtopicId;
  const sub = topic.subtopics.find((s) => s.id === subtopicId);
  return sub?.label ?? subtopicId;
}
