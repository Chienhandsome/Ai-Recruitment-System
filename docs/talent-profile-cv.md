# Full Talent Pool profile and original CV

## Entry points and permissions

- Open a profile drawer in `/recruiter/talent-pool`, then select **Xem hồ sơ đầy đủ**.
- Full page: `/recruiter/talent-pool/[candidateId]`. It uses the recruiter session and existing paid Talent Pool entitlement.
- Locked profiles redact identity/contact in professional text, hide external project/certificate links, and omit all CV metadata.
- Unlocks belong to an individual HR account. Viewing an unlocked profile or requesting its CV does not consume additional credits.
- Detail and CV access require the candidate's current sharing consent and active job-seeking visibility, including for previously unlocked HR accounts.
- Existing job applications retain their own submitted CV, snapshot, source, stage, and evaluation. This feature never replaces or evaluates them.

## CV delivery

`POST /api/billing/talent-pool/:candidateId/resume-access?mode=preview|download`

- Authenticated `RECRUITER` only, UUID validation, paid entitlement, current visibility, and requester-specific unlock checks.
- Resolves the current primary CV on the backend; clients cannot choose a resume ID, bucket, or storage path.
- Only an owned, uploaded, `PARSED` primary CV is served. Pending/failed CVs do not fall back to an older file.
- PDF supports inline viewing; DOCX supports downloading the original. The download response uses the storage attachment option.
- Uses the CV's recorded bucket; new uploads persist the bucket actually used by storage.
- Returns `{ url, expiresAt, fileName, mimeType }` with a 60-second signed URL and `Cache-Control: private, no-store`.
- Rechecks candidate visibility and primary CV after storage I/O. A changed CV or withdrawn consent rejects the response.
- A previously issued URL can remain usable for up to its short expiry. A file already downloaded cannot be revoked. PDF already rendered in another tab may remain visible.
- The inline preview removes its iframe after the link expiry and offers instructions to request a fresh preview. Browser PDF support varies; a new-tab link and original download remain available.

## Local acceptance checks

1. With a paid HR and visible candidate, open the full profile. Confirm projects/certificates appear when present and locked responses expose no CV metadata or contact text.
2. Unlock once. Confirm original profile text, contact details, and primary CV metadata appear. Refresh and view again without another debit.
3. Preview a PDF, close the dialog, then download the original. Verify its filename and content. Repeat download with DOCX; there should be no inline preview button for DOCX.
4. Wait for preview expiry and request a fresh preview. Inspect network responses for `no-store`; URLs are not part of the profile JSON.
5. Change the candidate's primary CV. A new request serves the new CV; while it is pending/failed, access is blocked. Previously submitted applications keep their original CV.
6. Disable candidate sharing, expire the candidate's job-seeking access, or expire the HR package. New profile/file requests must fail even after an old unlock.
7. Verify anonymous/candidate-role requests, another HR's unlock, absent CV, missing storage object, and a primary CV change during link generation.

Automated HTTP tests run the real controller, services, and auth/role guards with in-memory Prisma/storage fixtures and mocked token verification. They do not establish a real Supabase authentication/storage E2E result. Browser verification uses synthetic profile data and a local PDF; no real candidate notifications are sent.

No Prisma schema change or new migration is required.
