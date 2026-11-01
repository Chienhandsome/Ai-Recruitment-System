export interface QuestionEvaluation {
  score: number | null;
  comment: string;
}

export interface InterviewReviewDraft {
  ratings: Record<number, QuestionEvaluation>;
  overallScore: number | null;
  overallNote: string;
  viewed: number[];
}

export function emptyReviewDraft(): InterviewReviewDraft {
  return { ratings: {}, overallScore: null, overallNote: '', viewed: [] };
}

export function getReviewAverage(ratings: InterviewReviewDraft['ratings']): number | null {
  const scores = Object.values(ratings).flatMap(({ score }) => score === null ? [] : [score]);
  return scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length * 10) : null;
}

// Drafts are scoped to the reviewer, without persisting their access token.
export function reviewDraftKey(token: string, sessionId: string): string | null {
  try {
    const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { sub } = JSON.parse(atob(encoded));
    return typeof sub === 'string' && sub ? `interview-review:v1:${sub}:${sessionId}` : null;
  } catch {
    return sessionId === 'ui-preview-only' ? 'interview-review:v1:preview' : null;
  }
}

export function parseReviewDraft(raw: string | null, questionNumbers: number[], now = Date.now()): InterviewReviewDraft {
  const draft = emptyReviewDraft();
  if (!raw) return draft;
  try {
    const value = JSON.parse(raw);
    if (!Number.isFinite(value.savedAt) || now - value.savedAt > 7 * 86400000 || value.savedAt > now) return draft;
    if (value.ratings && typeof value.ratings === 'object') {
      for (const number of questionNumbers) {
        const rating = value.ratings[number];
        if (!rating || typeof rating.comment !== 'string') continue;
        const score = Number.isInteger(rating.score) && rating.score >= 1 && rating.score <= 10 ? rating.score : null;
        draft.ratings[number] = { score, comment: rating.comment };
      }
    }
    if (Number.isInteger(value.overallScore) && value.overallScore >= 0 && value.overallScore <= 100) draft.overallScore = value.overallScore;
    if (typeof value.overallNote === 'string') draft.overallNote = value.overallNote;
    if (Array.isArray(value.viewed)) draft.viewed = questionNumbers.filter(number => value.viewed.includes(number));
  } catch { /* A damaged or old draft should never prevent reviewing an interview. */ }
  return draft;
}

export function formatQuestionReviews(ratings: InterviewReviewDraft['ratings']): string {
  return Object.entries(ratings).map(([number, rating]) =>
    `• Câu ${number}: ${rating.score === null ? 'Chưa chấm' : `${rating.score}/10 đ`}${rating.comment ? ` - ${rating.comment}` : ''}`,
  ).join('\n');
}
