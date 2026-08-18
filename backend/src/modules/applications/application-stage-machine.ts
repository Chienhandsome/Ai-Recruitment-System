import { ApplicationStage, HrDecision } from '@prisma/client';

const TRANSITIONS: Record<ApplicationStage, readonly ApplicationStage[]> = {
  [ApplicationStage.RECEIVED]: [
    ApplicationStage.SCREENING,
    ApplicationStage.SHORTLISTED,
    ApplicationStage.REJECTED,
  ],
  [ApplicationStage.SCREENING]: [
    ApplicationStage.SHORTLISTED,
    ApplicationStage.REJECTED,
  ],
  [ApplicationStage.SHORTLISTED]: [
    ApplicationStage.SCREENING,
    ApplicationStage.OFFERED,
    ApplicationStage.REJECTED,
  ],
  [ApplicationStage.INTERVIEW_SCHEDULED]: [
    ApplicationStage.INTERVIEWED,
    ApplicationStage.REJECTED,
  ],
  [ApplicationStage.INTERVIEWED]: [
    ApplicationStage.OFFERED,
    ApplicationStage.REJECTED,
  ],
  [ApplicationStage.OFFERED]: [
    ApplicationStage.HIRED,
    ApplicationStage.SHORTLISTED,
    ApplicationStage.REJECTED,
  ],
  [ApplicationStage.REJECTED]: [ApplicationStage.SCREENING],
  [ApplicationStage.HIRED]: [],
  [ApplicationStage.WITHDRAWN]: [],
};

export function allowedApplicationTransitions(
  currentStage: ApplicationStage,
): ApplicationStage[] {
  return [...TRANSITIONS[currentStage]];
}

export function canTransitionApplication(
  currentStage: ApplicationStage,
  targetStage: ApplicationStage,
): boolean {
  return TRANSITIONS[currentStage].includes(targetStage);
}

export function applicationTransitionRequiresNote(
  currentStage: ApplicationStage,
  targetStage: ApplicationStage,
): boolean {
  if (targetStage === ApplicationStage.REJECTED) return true;
  if (currentStage === ApplicationStage.REJECTED) return true;
  if (
    currentStage === ApplicationStage.OFFERED &&
    targetStage === ApplicationStage.SHORTLISTED
  ) {
    return true;
  }

  return (
    targetStage === ApplicationStage.SCREENING &&
    (currentStage === ApplicationStage.SHORTLISTED ||
      currentStage === ApplicationStage.OFFERED)
  );
}

export function hrDecisionForStage(stage: ApplicationStage): HrDecision {
  switch (stage) {
    case ApplicationStage.RECEIVED:
      return HrDecision.PENDING;
    case ApplicationStage.SCREENING:
      return HrDecision.CONSIDER;
    case ApplicationStage.REJECTED:
      return HrDecision.REJECTED;
    case ApplicationStage.SHORTLISTED:
    case ApplicationStage.INTERVIEW_SCHEDULED:
    case ApplicationStage.INTERVIEWED:
    case ApplicationStage.OFFERED:
    case ApplicationStage.HIRED:
      return HrDecision.ACCEPTED;
    case ApplicationStage.WITHDRAWN:
      return HrDecision.PENDING;
  }
}
