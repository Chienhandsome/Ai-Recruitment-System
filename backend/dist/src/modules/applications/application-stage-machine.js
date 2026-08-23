"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowedApplicationTransitions = allowedApplicationTransitions;
exports.canTransitionApplication = canTransitionApplication;
exports.applicationTransitionRequiresNote = applicationTransitionRequiresNote;
exports.hrDecisionForStage = hrDecisionForStage;
const client_1 = require("@prisma/client");
const TRANSITIONS = {
    [client_1.ApplicationStage.RECEIVED]: [
        client_1.ApplicationStage.SCREENING,
        client_1.ApplicationStage.SHORTLISTED,
        client_1.ApplicationStage.REJECTED,
    ],
    [client_1.ApplicationStage.SCREENING]: [
        client_1.ApplicationStage.SHORTLISTED,
        client_1.ApplicationStage.INTERVIEW_SCHEDULED,
        client_1.ApplicationStage.REJECTED,
    ],
    [client_1.ApplicationStage.SHORTLISTED]: [
        client_1.ApplicationStage.INTERVIEW_SCHEDULED,
        client_1.ApplicationStage.SCREENING,
        client_1.ApplicationStage.OFFERED,
        client_1.ApplicationStage.REJECTED,
    ],
    [client_1.ApplicationStage.INTERVIEW_SCHEDULED]: [
        client_1.ApplicationStage.INTERVIEWED,
        client_1.ApplicationStage.SHORTLISTED,
        client_1.ApplicationStage.REJECTED,
    ],
    [client_1.ApplicationStage.INTERVIEWED]: [
        client_1.ApplicationStage.OFFERED,
        client_1.ApplicationStage.INTERVIEW_SCHEDULED,
        client_1.ApplicationStage.SHORTLISTED,
        client_1.ApplicationStage.REJECTED,
    ],
    [client_1.ApplicationStage.OFFERED]: [
        client_1.ApplicationStage.HIRED,
        client_1.ApplicationStage.INTERVIEWED,
        client_1.ApplicationStage.SHORTLISTED,
        client_1.ApplicationStage.REJECTED,
    ],
    [client_1.ApplicationStage.REJECTED]: [client_1.ApplicationStage.SCREENING],
    [client_1.ApplicationStage.HIRED]: [],
    [client_1.ApplicationStage.WITHDRAWN]: [],
};
function allowedApplicationTransitions(currentStage) {
    return [...TRANSITIONS[currentStage]];
}
function canTransitionApplication(currentStage, targetStage) {
    return TRANSITIONS[currentStage].includes(targetStage);
}
function applicationTransitionRequiresNote(currentStage, targetStage) {
    if (targetStage === client_1.ApplicationStage.REJECTED)
        return true;
    if (currentStage === client_1.ApplicationStage.REJECTED)
        return true;
    if (currentStage === client_1.ApplicationStage.OFFERED &&
        targetStage === client_1.ApplicationStage.SHORTLISTED) {
        return true;
    }
    return (targetStage === client_1.ApplicationStage.SCREENING &&
        (currentStage === client_1.ApplicationStage.SHORTLISTED ||
            currentStage === client_1.ApplicationStage.OFFERED));
}
function hrDecisionForStage(stage) {
    switch (stage) {
        case client_1.ApplicationStage.RECEIVED:
            return client_1.HrDecision.PENDING;
        case client_1.ApplicationStage.SCREENING:
            return client_1.HrDecision.CONSIDER;
        case client_1.ApplicationStage.REJECTED:
            return client_1.HrDecision.REJECTED;
        case client_1.ApplicationStage.SHORTLISTED:
        case client_1.ApplicationStage.INTERVIEW_SCHEDULED:
        case client_1.ApplicationStage.INTERVIEWED:
        case client_1.ApplicationStage.OFFERED:
        case client_1.ApplicationStage.HIRED:
            return client_1.HrDecision.ACCEPTED;
        case client_1.ApplicationStage.WITHDRAWN:
            return client_1.HrDecision.PENDING;
    }
}
//# sourceMappingURL=application-stage-machine.js.map