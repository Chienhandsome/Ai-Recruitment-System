import { ApplicationStage, HrDecision } from '@prisma/client';
export declare function allowedApplicationTransitions(currentStage: ApplicationStage): ApplicationStage[];
export declare function canTransitionApplication(currentStage: ApplicationStage, targetStage: ApplicationStage): boolean;
export declare function applicationTransitionRequiresNote(currentStage: ApplicationStage, targetStage: ApplicationStage): boolean;
export declare function hrDecisionForStage(stage: ApplicationStage): HrDecision;
