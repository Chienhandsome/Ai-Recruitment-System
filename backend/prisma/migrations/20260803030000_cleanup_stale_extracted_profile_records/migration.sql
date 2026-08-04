-- Keep only EXTRACTED profile rows belonging to the current primary resume.
-- MANUAL rows are deliberately untouched.
DELETE FROM "candidate_skills" AS item
USING "candidate_profiles" AS profile
WHERE item."candidate_id" = profile."id"
  AND item."source" = 'EXTRACTED'
  AND item."resume_id" IS DISTINCT FROM profile."primary_resume_id";

DELETE FROM "work_experiences" AS item
USING "candidate_profiles" AS profile
WHERE item."candidate_profile_id" = profile."id"
  AND item."source" = 'EXTRACTED'
  AND item."resume_id" IS DISTINCT FROM profile."primary_resume_id";

DELETE FROM "educations" AS item
USING "candidate_profiles" AS profile
WHERE item."candidate_profile_id" = profile."id"
  AND item."source" = 'EXTRACTED'
  AND item."resume_id" IS DISTINCT FROM profile."primary_resume_id";

DELETE FROM "projects" AS item
USING "candidate_profiles" AS profile
WHERE item."candidate_profile_id" = profile."id"
  AND item."source" = 'EXTRACTED'
  AND item."resume_id" IS DISTINCT FROM profile."primary_resume_id";

DELETE FROM "certificates" AS item
USING "candidate_profiles" AS profile
WHERE item."candidate_profile_id" = profile."id"
  AND item."source" = 'EXTRACTED'
  AND item."resume_id" IS DISTINCT FROM profile."primary_resume_id";
