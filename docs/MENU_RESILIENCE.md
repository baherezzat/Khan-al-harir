# Menu resilience — 2026-11-25

UI, cart and WhatsApp checkout flow are unchanged.

## Layers
- CDN: complete live responses cached for 60 seconds; saved responses 15 seconds.
- Warm function: last complete snapshot plus a 30-second failure backoff and shared in-flight refresh.
- Durable storage: optional Redis REST store; complete snapshots have no TTL. An owner-checked 30-second lock coordinates refresh across instances. Atomic timestamp comparison prevents older writes replacing newer data.
- Bundled disaster backup: data/menu-backup.json, 32 categories / 301 products, verified 2026-11-25. Available even on a cold start without Redis. This is a deployment-time backup, not a continuously persisted latest snapshot.
- Browser: existing cached menu remains usable. An older server fallback does not replace a newer browser snapshot.

Incomplete or empty source results never replace a complete backup. Source refresh has a 12-second overall deadline. Refresh attempts happen on requests, not on a scheduler. Successful refresh resumes automatically. Endpoint metadata includes fetchedAt, stale, and persistence; none changes the customer workflow.

## Required production activation
1. In the khan101 Vercel project, connect an Upstash Redis database via Storage/Marketplace, or use an existing Redis REST database.
2. Supply UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Production environment variables. Existing KV_REST_API_URL and KV_REST_API_TOKEN are also supported. Never put credentials in HTML, Git, or chat.
3. Redeploy, request /api/menu, and verify persistence=durable after a complete source refresh. Confirm the snapshot key khan:menu:33:last-complete:v1 exists.
4. Verify a cold instance can read it with the source deliberately unavailable in a staging environment. Do not disrupt the production restaurant menu for this test.

Production Redis connection verified on 2026-11-25: /api/menu-health read a complete snapshot from actual Redis (fetchedAt 2026-11-25T18:22:19.124Z, 32 categories, 301 products). Its isolated source-outage simulation recovered that snapshot successfully without disabling the real upstream. The health route is read-only and cached for 30 seconds; it does not expose connection credentials.

## Verification and limits
Run node --test tests/*.test.js. Tests cover cold starts, total/partial source failure, recovery, storage failure, shared 100-client refresh, distributed refresh lock, and snapshot persistence across new service instances using a mock durable store. This is not a measured maximum production customer capacity.

Source-hosted dish images remain dependent on their existing image cache/upstream; the website's image fallback remains in place. Saved prices can be out of date during an upstream outage. WhatsApp orders still require the customer to press Send and the restaurant to confirm; this does not add a server order queue or staff acceptance dashboard.
