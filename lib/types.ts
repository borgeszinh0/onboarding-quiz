export type Dimension =
  | "possibility"
  | "currentImportance"
  | "generalImportance"
  | "action"
  | "satisfaction"
  | "concern";

export interface DimensionConfig {
  key: Dimension;
  label: string;
  description: string;
}

export interface Domain {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  description: string;
  prompt: string;
}

export type DomainScores = Record<Dimension, number>;

export interface QualitativeEntry {
  domainId: string;
  text: string;
}

export interface NarrativeEntry {
  domainId: string;
  text: string;
}

export interface EnvironmentEntry {
  question: string;
  answer: string;
}

export interface SmartGoal {
  goal: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
  linkedDomainId: string;
}

export interface QuizState {
  step: QuizStep;
  username: string;
  scores: Record<string, DomainScores>;
  qualitative: QualitativeEntry[];
  narratives: NarrativeEntry[];
  environment: EnvironmentEntry[];
  goals: SmartGoal[];
}

export type QuizStep =
  | "welcome"
  | "quantitative"
  | "qualitative"
  | "narrative"
  | "environment"
  | "smart"
  | "result";
