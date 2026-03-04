import { TFile } from "obsidian";

export interface DSAFrontmatter {
  tags: string[];
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  attempts: number;
  last_attempt: string;
  time_spent_minutes: number;
  hints_used: number;
  next_review: string;
  solved: boolean;
}

export interface DSANote {
  file: TFile;
  frontmatter: DSAFrontmatter;
  path: string;
}

export interface PluginSettings {
  solutionHeading: string;
  trackTimeSpent: boolean;
  trackHintsUsed: boolean;
  dsaTag: string;
  spacedRepetitionEnabled: boolean;
  reviewIntervalDays: number;
  dashboardSortField: "attempts" | "last_attempt" | "topic" | "difficulty";
}

export interface VaultStats {
  totalProblems: number;
  totalAttempts: number;
  solvedCount: number;
  topicBreakdown: Record<string, number>;
  difficultyBreakdown: Record<string, number>;
  mostAttempted: DSANote[];
  dueForReview: DSANote[];
}

export const DEFAULT_SETTINGS: PluginSettings = {
  solutionHeading: "## My Solution",
  trackTimeSpent: true,
  trackHintsUsed: true,
  dsaTag: "dsa",
  spacedRepetitionEnabled: false,
  reviewIntervalDays: 7,
  dashboardSortField: "attempts",
};
