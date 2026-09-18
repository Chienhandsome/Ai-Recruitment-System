UPDATE "applications"
SET "hr_decision" = 'CONSIDER'::"HrDecision"
WHERE "current_stage" IN (
  'SHORTLISTED'::"ApplicationStage",
  'INTERVIEW_SCHEDULED'::"ApplicationStage",
  'INTERVIEWED'::"ApplicationStage"
)
AND "hr_decision" = 'ACCEPTED'::"HrDecision";
