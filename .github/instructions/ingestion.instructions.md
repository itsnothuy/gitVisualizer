---
applyTo: "src/lib/git/**,packages/ingestion/**"
---

# Area Instructions — Ingestion (Local repos, isomorphic-git)

## Purpose
Enable **local-first** ingestion: open a local repo directory, or clone shallow into a browser FS. Never upload repository contents by default.

## Non-negotiables
- **Local directory**: use **File System Access API** pickers (`showDirectoryPicker`) with clear permission prompts. Store handles carefully; don’t assume cross-session permission persistence unless confirmed.
- **Browser FS**: for remotes, use **isomorphic-git** with **LightningFS**; use **shallow clone** (`depth`) and **singleBranch**. Note: may require a **CORS proxy** for clone endpoints.
- **OPFS**: prefer **Origin Private File System** for caching (fast, quota-bounded, worker-friendly).

## Do / Don’t
**Do**
- Feature-flag network cloning separately from local folder ingestion.
- Expose a “no-network mode” for maximum privacy.
- Validate repo structure and memorize only non-sensitive metadata needed for layout.

**Don’t**
- Don’t persist tokens, secrets, or file contents outside OPFS/IndexedDB.
- Don’t assume Firefox/Safari parity for File System Access; feature-detect and provide fallbacks.

## Acceptance criteria (per PR)
- Local picker UX: clear copy about access; “disconnect & purge” action that wipes OPFS/IndexedDB.
- Shallow clone path uses `depth` and `singleBranch`; docs mention the CORS proxy requirement.
- No file content leaves the device without opt-in.

## References
- **File System Access API**: https://developer.mozilla.org/en-US/docs/Web/API/File_System_API
- **isomorphic-git**: https://isomorphic-git.org/docs/en/browser
