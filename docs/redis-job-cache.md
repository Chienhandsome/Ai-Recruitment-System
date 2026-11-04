# Public job cache

The backend uses `REDIS_URL` for public job lists (30 seconds) and job categories
(30 minutes). Details, recommendations with a candidate profile, application
state, and recruiter/admin responses are not cached. The existing Nest RAM
CacheModule is preserved; public jobs use ioredis directly for atomic generation
operations and bounded commands without an offline write queue.

## Local development

1. Run `docker compose up -d redis` from the repository root.
2. Add `REDIS_URL=redis://127.0.0.1:6379` to your ignored `backend/.env`.
3. Restart the backend. Look for `Redis public jobs cache connected.`

Use a separate Redis instance for each environment. `REDIS_CACHE_PREFIX` can
override the default namespace `recruitment:public:v1`. Without REDIS_URL, or
while Redis is unavailable, reads go directly to the database. Redis failures
must never fail an application write or block startup. Reconnection rotates
both cache generations before enabling cache reads again.

Production uses Render Key Value in the same workspace/region as the backend,
with an internal connection URL, `allkeys-lru`, and external access disabled.
No connection values belong in Git. Cache data is disposable and needs no disk.

## Correctness and invalidation

- Keys hash a fixed-order tuple of every supported filter and pagination input.
  Search/location whitespace and default pagination are normalized.
- The minimum expiry date across ALL matching jobs bounds the cache deadline,
  including jobs outside the requested page (which affect counts).
- Each namespace has a random generation. Invalidation replaces generations
  atomically; an in-flight read can only populate its old, unreachable namespace.
  Generation eviction creates a new random value, never resurrecting old entries.
- HTTP writes conservatively invalidate BOTH namespaces after handlers complete,
  so database transactions have already committed. This includes company,
  department, skill, recruiter, admin, application/quota, contract, and dispute
  mutations. Error responses also invalidate because some writes may have committed.
  This intentionally trades some hit rate for complete coverage of cross-module
  changes. Reads do not invalidate. Old keys expire naturally; no KEYS/FLUSHDB.
- The scheduled expiry handler explicitly invalidates after each committed update.
  Future background writers and direct database scripts must explicitly call
  `JobCacheService.invalidate()` after commit or allow entries to expire.
- Concurrent misses for a key share a single database load within one process.
- During an outage, invalidation is best effort. Other still-connected instances
  may serve entries until their TTL; a reconnect clears old generations. There
  is no transactional outbox/strict distributed consistency guarantee.

## Verification

Run backend build and the jobs/cache tests. The cache tests use a real disposable
Redis when `REDIS_TEST_URL` is supplied and otherwise skip the integration suite:

```powershell
$env:REDIS_TEST_URL = 'redis://127.0.0.1:6379'
Set-Location backend
node node_modules/jest/bin/jest.js --runInBand job-cache jobs.service candidate-jobs.controller
```

Integration tests use a unique namespace and remove only their own keys.
First fill a public list, then repeat the same request. The production log
`Public cache hits=... misses=...` is emitted on the first hit and every 100 hits.
`JobCacheService.getStats()` supplies process-local hit/miss/bypass/error counters
for internal diagnostics and tests; it is not a new public endpoint.
For rollback set `REDIS_URL` to empty and redeploy; APIs continue against the DB.
