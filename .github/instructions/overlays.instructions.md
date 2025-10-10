---
applyTo: "src/lib/overlays/**,packages/overlays/**,src/app/(overlays)/**"
---

# Area Instructions — Overlays (GitHub/GitLab PRs, Tags, CI)

## Purpose
Enrich the local DAG with optional remote metadata (PR/MR, tags/releases, CI). Respect privacy: overlays are opt-in, **read-only**, and **rate-limit friendly**.

## Non-negotiables
- **Auth**: OAuth with PKCE; **read-only scopes**; tokens **in memory** by default; explicit user consent per repo.
- **Rate limiting**:
  - **GitHub REST/GraphQL**: observe **secondary limits** and endpoint limits (e.g., REST “points/min”, GraphQL up to **2000 points/min**, concurrency ≤ **100**, and GraphQL content-creation caps). Back off on `Retry-After`/rate headers. :contentReference[oaicite:11]{index=11}
  - **GitHub GraphQL content creation caps** exist (not typical for read), so keep overlays strictly read-only and batched. :contentReference[oaicite:12]{index=12}
  - **GitLab**: treat limits as **configurable** per instance; consult headers and docs; back off and paginate. GitLab.com has product-specific pages and a consolidated handbook for current limits. :contentReference[oaicite:13]{index=13}

## Implementation guidance
- **Mapping commits → PRs**: prefer GitHub GraphQL fields that associate commits with PRs (and PR numbers/URLs). For CI, use Checks/Statuses endpoints (read-only).
- **Caching**: cache overlay responses by `(host, repo, commit, page)` with TTL; avoid re-hitting on pan/zoom.
- **Failure modes**: overlays must **degrade gracefully** (UI badges absent). No local data leaves the browser unless overlay is enabled.

## Do / Don’t
**Do**
- Use **pagination**; respect ETags and conditional requests when possible.
- Add exponential backoff and jitter; surface remaining quota in dev overlay panel.

**Don’t**
- Don’t expand scopes or store tokens beyond session without **explicit** opt-in.
- Don’t block core DAG render on overlay timeouts; show non-blocking spinners.

## Acceptance criteria (per PR)
- Scope review: list of exact scopes, where tokens live, and lifetime.
- Evidence of **rate-limit handling** (headers parsed, backoff on 403/429).
- Toggle to disable overlays globally.

## References
- **GitHub REST rate limits** (points/min; concurrency). :contentReference[oaicite:14]{index=14}
- **GitHub GraphQL limits**. :contentReference[oaicite:15]{index=15}
- **GitLab rate limits & handbook**. :contentReference[oaicite:16]{index=16}
