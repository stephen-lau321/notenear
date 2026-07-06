import { Injectable } from "@nestjs/common";

export interface ScoreInput {
  content: string;
  instrument?: string | null;
  city?: string | null;
  street?: string | null;
  district?: string | null;
  hoursAgo?: number | null;
  commentCount?: number;
  accountSignals?: Record<string, any> | null;
  budget?: number | null;
}

export interface ScoreDetail {
  timeliness: number;
  completeness: number;
  authenticity: number;
  competition: number;
  budget: number;
}

export interface ScoreResult {
  totalScore: number;
  grade: "HIGH" | "MEDIUM" | "LOW";
  detail: ScoreDetail;
  action: "IMMEDIATE_PUSH" | "MANUAL_REVIEW" | "AUTO_FILTER";
}

@Injectable()
export class ScoringService {
  private readonly weights = {
    timeliness: 0.25,
    completeness: 0.25,
    authenticity: 0.3,
    competition: 0.15,
    budget: 0.05,
  };

  score(input: ScoreInput): ScoreResult {
    const detail: ScoreDetail = {
      timeliness: this.scoreTimeliness(input.hoursAgo),
      completeness: this.scoreCompleteness(input),
      authenticity: this.scoreAuthenticity(input.accountSignals),
      competition: this.scoreCompetition(input.commentCount ?? 0),
      budget: this.scoreBudget(input.budget),
    };

    const totalScore = parseFloat(
      (
        detail.timeliness * this.weights.timeliness +
        detail.completeness * this.weights.completeness +
        detail.authenticity * this.weights.authenticity +
        detail.competition * this.weights.competition +
        detail.budget * this.weights.budget
      ).toFixed(1)
    );

    const grade: "HIGH" | "MEDIUM" | "LOW" =
      totalScore >= 70 ? "HIGH" : totalScore >= 50 ? "MEDIUM" : "LOW";

    const action =
      totalScore >= 70
        ? "IMMEDIATE_PUSH"
        : totalScore >= 50
          ? "MANUAL_REVIEW"
          : "AUTO_FILTER";

    return { totalScore, grade, detail, action };
  }

  private scoreTimeliness(hoursAgo?: number | null): number {
    if (hoursAgo == null) return 40;
    if (hoursAgo <= 1) return 100;
    if (hoursAgo <= 4) return 90;
    if (hoursAgo <= 8) return 70;
    if (hoursAgo <= 24) return 30;
    return 10;
  }

  private scoreCompleteness(input: ScoreInput): number {
    let score = 0;
    if (input.instrument) score += 40;
    if (input.city) score += 25;
    if (input.street || input.district) score += 20;
    if ((input.content?.length ?? 0) > 30) score += 15;
    return Math.min(score, 100);
  }

  private scoreAuthenticity(
    signals?: Record<string, any> | null
  ): number {
    if (!signals) return 50;
    let score = 50;
    if (signals.has_life_content) score += 25;
    if (signals.has_kids_content) score += 15;
    if (signals.is_marketing_account) score -= 35;
    if ((signals.note_count ?? 0) >= 10) score += 10;
    if ((signals.note_count ?? 0) === 0) score -= 20;
    return Math.max(0, Math.min(100, score));
  }

  private scoreCompetition(commentCount: number): number {
    if (commentCount <= 3) return 100;
    if (commentCount <= 6) return 75;
    if (commentCount <= 10) return 50;
    if (commentCount <= 15) return 25;
    return 10;
  }

  private scoreBudget(budget?: number | null): number {
    if (budget == null) return 50;
    if (budget >= 180 && budget <= 600) return 100;
    if (budget >= 100 && budget <= 800) return 70;
    return 40;
  }
}
