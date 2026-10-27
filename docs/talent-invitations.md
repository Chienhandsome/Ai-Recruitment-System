# Talent Pool invitations

## Entry points

- HR: `/recruiter/talent-pool` → open an unlocked profile → **Mời ứng tuyển**.
- Sent invitations: `/recruiter/talent-invitations`.
- Candidate inbox: `/candidate/invitations` (also linked from navigation and notifications).

## Rules

- An invitation belongs to one HR account, candidate, and job. Company membership is not used.
- Sending requires current Talent Pool access and an existing CV unlock. Sending consumes no additional credit.
- Only published, unexpired jobs owned by the sender can receive invitations. Applicant limits and hiring targets are checked again on acceptance.
- Only one pending invitation per HR/candidate/job is allowed. A database partial unique index enforces this across simultaneous requests.
- Invitations expire after seven days. Lists materialize expiry, and mutations independently enforce the deadline.
- Turning off job seeking prevents new invitations; existing invitations can still be accepted or declined while valid.
- Candidates select an owned, parsed CV and explicitly confirm before acceptance.
- Acceptance creates an application with source `TALENT_POOL_INVITE` and uses the existing snapshot/evaluation/retry workflow.
- Accepting and linking the application happen in one transaction. Repeated acceptance returns the same application; a competing withdrawal cannot overwrite acceptance.
- Declined, withdrawn, and expired invitations cannot be accepted. Accepted applications continue through the existing recruitment workflow.
- Notifications are written with their invitation transaction using unique event keys.
- A previously submitted application is reused before checking CV availability or eligibility for a new application. Its CV, snapshot, source, stage, and AI result are retained; it is never evaluated again by this action.
- Inbox items expose a link to an existing application even when the invitation is withdrawn, declined, or expired. Opening that link does not accept or reactivate the invitation.
- Locked Talent Pool responses redact recognizable emails, phone numbers, profile links, and the candidate's full name from public text in both search and detail. Unlocking returns the original text; stored profile data is not modified.

## Migration

`backend/prisma/migrations/20261020120000_add_talent_invitations/migration.sql`

The new table has RLS enabled; the authenticated NestJS API enforces participant access. No direct browser access to the table is required.

## Quick local verification

1. Use a paid HR account with an unlocked candidate and a published job.
2. Open the candidate profile, select **Mời ứng tuyển**, choose the job, and send.
3. Check the sent inbox: **Đang chờ**, with a seven-day deadline. Sending again to the same pending candidate/job is rejected.
4. Sign in as that candidate, open the invitation notification or inbox, and inspect the job and HR details.
5. Choose a parsed CV, confirm sharing, and submit. The invitation changes to **Đã ứng tuyển** with a link to applications.
6. The HR inbox shows **Đã ứng tuyển**; opening the application enters the normal candidate evaluation workspace.
7. Repeat with separate invitations to verify **Từ chối**, **Thu hồi**, and expiry. With job seeking disabled, an existing valid invitation remains actionable.
8. Verify wrong-recipient access, unowned/unprocessed CVs, closed/full jobs, and repeated acceptance. None should create another application or consume more unlock credits.
9. Send an invitation, then have the candidate apply directly. Close the job and remove the candidate's available CV. Both inboxes should still link to the submitted application, with the same CV, source, stage, and AI result. A valid pending invitation accepted through the API links to the same application without evaluating again.
10. Repeat with an expired/withdrawn invitation: the existing application link remains available while the old invitation retains its closed status.
11. Put contact details in the candidate's title, summary, experience, and education. Before unlocking, inspect search/detail API responses as well as the UI for redaction. After unlocking, verify the original professional text and contact fields are returned.

## Automated checks

From `backend`:

```powershell
node node_modules/jest/bin/jest.js --runInBand talent-invitations.service.spec applications.service.spec talent-pool.service.spec talent-pool-privacy.spec application-notifications.spec
```
