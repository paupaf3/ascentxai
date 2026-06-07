export type AnalysisTarget =
    | { mode: "goal"; goal: string }
    | { mode: "job"; jobInput: string };
