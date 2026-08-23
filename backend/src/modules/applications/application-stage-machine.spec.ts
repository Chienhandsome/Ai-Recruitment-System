import { ApplicationStage, HrDecision } from '@prisma/client';
import {
  allowedApplicationTransitions,
  applicationTransitionRequiresNote,
  canTransitionApplication,
  hrDecisionForStage,
} from './application-stage-machine';

describe('application stage machine', () => {
  it('allows the v1 screening path and rejects stage skipping', () => {
    expect(
      canTransitionApplication(
        ApplicationStage.RECEIVED,
        ApplicationStage.SHORTLISTED,
      ),
    ).toBe(true);
    expect(
      canTransitionApplication(
        ApplicationStage.RECEIVED,
        ApplicationStage.HIRED,
      ),
    ).toBe(false);
  });

  it('treats hired as terminal', () => {
    expect(allowedApplicationTransitions(ApplicationStage.HIRED)).toEqual([]);
  });

  it('requires notes for rejecting, reopening and rolling back', () => {
    expect(
      applicationTransitionRequiresNote(
        ApplicationStage.SCREENING,
        ApplicationStage.REJECTED,
      ),
    ).toBe(true);
    expect(
      applicationTransitionRequiresNote(
        ApplicationStage.REJECTED,
        ApplicationStage.SCREENING,
      ),
    ).toBe(true);
    expect(
      applicationTransitionRequiresNote(
        ApplicationStage.OFFERED,
        ApplicationStage.SHORTLISTED,
      ),
    ).toBe(true);
  });

  it('maps stages to a consistent HR decision', () => {
    expect(hrDecisionForStage(ApplicationStage.RECEIVED)).toBe(
      HrDecision.PENDING,
    );
    expect(hrDecisionForStage(ApplicationStage.SCREENING)).toBe(
      HrDecision.CONSIDER,
    );
    expect(hrDecisionForStage(ApplicationStage.SHORTLISTED)).toBe(
      HrDecision.ACCEPTED,
    );
    expect(hrDecisionForStage(ApplicationStage.INTERVIEW_SCHEDULED)).toBe(
      HrDecision.ACCEPTED,
    );
    expect(hrDecisionForStage(ApplicationStage.INTERVIEWED)).toBe(
      HrDecision.ACCEPTED,
    );
    expect(hrDecisionForStage(ApplicationStage.REJECTED)).toBe(
      HrDecision.REJECTED,
    );
  });

  it('allows scheduling interviews from shortlisted and screening stages', () => {
    expect(
      canTransitionApplication(
        ApplicationStage.SHORTLISTED,
        ApplicationStage.INTERVIEW_SCHEDULED,
      ),
    ).toBe(true);
    expect(
      canTransitionApplication(
        ApplicationStage.SCREENING,
        ApplicationStage.INTERVIEW_SCHEDULED,
      ),
    ).toBe(true);
    expect(
      canTransitionApplication(
        ApplicationStage.INTERVIEW_SCHEDULED,
        ApplicationStage.INTERVIEWED,
      ),
    ).toBe(true);
    expect(
      canTransitionApplication(
        ApplicationStage.INTERVIEWED,
        ApplicationStage.OFFERED,
      ),
    ).toBe(true);
  });
});
