-- Close published jobs that are already past their application deadline.
UPDATE "job_postings"
SET
  "status" = 'CLOSED',
  "closed_at" = COALESCE("closed_at", CURRENT_TIMESTAMP)
WHERE "status" = 'PUBLISHED'
  AND "expiry_date" IS NOT NULL
  AND "expiry_date" <= CURRENT_TIMESTAMP;

-- Older published records predate published_at tracking.
UPDATE "job_postings"
SET "published_at" = "created_at"
WHERE "status" = 'PUBLISHED'
  AND "published_at" IS NULL;

-- Backfill categories conservatively from recognizable titles. Unknown jobs
-- remain uncategorized instead of receiving an inaccurate classification.
UPDATE "job_postings" AS job
SET "category_id" = category."id"
FROM "job_categories" AS category
WHERE job."category_id" IS NULL
  AND category."slug" = CASE
    WHEN job."title" ~* '(marketing|seo|content|truyền thông)' THEN 'marketing-pr'
    WHEN job."title" ~* '(designer|ui/ux|figma|đồ họa)' THEN 'design-media'
    WHEN job."title" ~* '(engineer|developer|frontend|backend|nestjs|python|llm|software)' THEN 'it-software'
    ELSE NULL
  END;

CREATE INDEX "job_postings_status_expiry_date_published_at_idx"
  ON "job_postings"("status", "expiry_date", "published_at");
