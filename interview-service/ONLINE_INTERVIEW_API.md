# Online Interview API contract

Recruitment System calls the internal API using `X-Interview-System-Key`. The
service returns a one-time candidate link; it never needs access to the
Recruitment System database.

## Create an interview

```http
POST /v1/internal/interviews
X-Interview-System-Key: dev-interview-system-key
Content-Type: application/json
```

```json
{
  "recruitment_application_id": "application-id",
  "candidate": {
    "id": "candidate-id",
    "email": "candidate@example.com",
    "display_name": "Nguyễn Văn A"
  },
  "cv": { "summary": "Backend developer", "skills": ["Java", "Spring Boot"] },
  "jd": { "title": "Backend Developer", "requirements": ["Java", "SQL"] },
  "config": {
    "opening_questions": ["Bạn hãy giới thiệu bản thân."],
    "competencies": ["technical_experience", "problem_solving"],
    "max_questions": 6
  },
  "expires_in_hours": 72,
  "callback_url": "https://recruitment.example.com/api/interview-events"
}
```

`expires_in_hours` is between 1 and 240 (10 days). The response contains
`launch_url`, which Recruitment System sends to the candidate.

## Candidate runtime

1. Candidate opens `launch_url` in `interview-web`.
2. They request and verify a six-digit email OTP.
3. The launch link is consumed and cannot be used again.
4. Candidate Web uses the returned access token only in session storage.
5. Video, transcript and security events belong to Interview Service.

Candidate Web calls the two authenticated participant endpoints internally:

- `POST /v1/participant/speech/synthesize` with `{ "question_number": 1 }`
  returns provider-generated MP3 for the current server-issued question.
- `POST /v1/participant/speech/transcribe` uploads a 16 kHz mono PCM WAV body
  with `X-Interview-Question-Number`. It returns `{ "text": "..." }`.

Both endpoints require Google Cloud Speech configuration on the service by
default. Provider credentials are never returned to the browser. Azure can be
selected as a fallback with `INTERVIEW_SPEECH_PROVIDER=azure`.

## Completion callback

Interview Service sends the following event for `COMPLETED`, `TERMINATED`, and
`EXPIRED` sessions:

```http
POST /api/interview-events
Content-Type: application/json
X-Interview-Event-Id: <uuid>
X-Interview-Timestamp: <unix-seconds>
X-Interview-Signature: v1=<hex-hmac-sha256>
```

```json
{
  "event_id": "event-uuid",
  "event_type": "interview.completed",
  "occurred_at": "2026-09-13T10:00:00+00:00",
  "data": {
    "interview_id": "interview-uuid",
    "recruitment_application_id": "application-id",
    "status": "COMPLETED",
    "transcript": [],
    "videos": [],
    "security_events": [],
    "termination_reason": null
  }
}
```

Verify `X-Interview-Signature` over the exact bytes received:

```text
HMAC_SHA256(INTERVIEW_CALLBACK_SECRET, timestamp + "." + raw_body)
```

The receiver should reject timestamps older than five minutes and store
`X-Interview-Event-Id` with a unique constraint before applying the event. Return
any `2xx` only after the event is durably accepted. Redirects are not followed.

Inspect delivery status in the internal report. An operator can queue a failed
event again with:

```http
POST /v1/internal/interviews/{interviewId}/callback/retry
X-Interview-System-Key: ...
```

For local development without SMTP, the OTP is printed in the Interview Service
terminal as `DEV OTP for <email>: <code>`.

## HR report

```http
GET /v1/internal/interviews/{interviewId}/report
X-Interview-System-Key: dev-interview-system-key
```

The report is metadata only; it never returns object keys or local video paths.
Recruitment System can retrieve one video through the internal endpoint below.
When Supabase is enabled, this endpoint reads from the private Storage bucket;
the browser never gets Supabase credentials.

```http
GET /v1/internal/interviews/{interviewId}/videos/{videoId}
X-Interview-System-Key: dev-interview-system-key
```

For browser playback, request a short-lived signed URL. This keeps the bucket
private while allowing the browser to use byte-range streaming and CDN caching.
Local storage returns `url: null`, allowing the Recruitment System to use its
authenticated proxy fallback.

```http
GET /v1/internal/interviews/{interviewId}/videos/{videoId}/playback
X-Interview-System-Key: dev-interview-system-key
```
