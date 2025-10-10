---
applyTo: "src/lib/git/**,packages/ingestion/**"
---

# Area Instructions — Ingestion (Local repos, isomorphic-git)

## Purpose
Enable **local-first** ingestion: open a local repo directory, or clone shallow into a browser FS. Never upload repository contents by default.

## Non-negotiables
- **Local directory**: use **File System Access API** pickers (`showDirectoryPicker`) with clear permission prompts. Store handles carefully; don’t assume cross-session permission persistence unless confirmed. :contentReference[oaicite:17]{index=17}
- **Browser FS**: for remotes, use **isomorphic-git** with **LightningFS**; use **shallow clone** (`depth`) and **singleBranch**. Note: may require a **CORS proxy** for clone endpoints. :contentReference[oaicite:18]{index=18}
- **OPFS**: prefer **Origin Private File System** for caching (fast, quota-bounded, worker-friendly). :contentReference[oaicite:19]{index=19}

## Do / Don’t
**Do**
- Feature-flag network cloning separately from local folder ingestion.
- Expose a “no-network mode” for maximum privacy.
- Validate repo structure and memorize only non-sensitive metadata needed for layout.

**Don’t**
- Don’t persist tokens, secrets, or file contents outside OPFS/IndexedDB.
- Don’t assume Firefox/Safari parity for File System Access; feature-detect and provide fallbacks. :contentReference[oaicite:20]{index=20}

## Acceptance criteria (per PR)
- Local picker UX: clear copy about access; “disconnect & purge” action that wipes OPFS/IndexedDB.
- Shallow clone path uses `depth` and `singleBranch`; docs mention the CORS proxy requirement.
- No file content leaves the device without opt-in.

## References
- **File System Access API** (MDN, Chrome docs, WICG spec). :contentReference[oaicite:21]{index=21}
- **isomorphic-git** Browser/BYOFS/LightningFS docs. :contentReference[oaicite:22]{index=22}
