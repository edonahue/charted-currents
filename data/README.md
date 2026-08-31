# Data workspace

Recommended layers:
- `raw/` — unchanged source payload where local storage is permitted;
- `staging/` — parsed source-shaped tables;
- `normalized/` — provenance-aware ontology;
- `published/` — rights-safe web artifacts;
- `samples/` — tiny reviewed fixtures suitable for Git.

No source file belongs in Git merely because it can be downloaded.
