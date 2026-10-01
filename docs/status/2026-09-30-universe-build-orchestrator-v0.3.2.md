# Universe build orchestrator v0.3.2

Runtime validation on Neon Free (512 MiB) showed that `pg_database_size(current_database())` can be materially below the provider metric used to enforce `neon.max_cluster_size`. Two Lévis targets reached READY and a later migration then hit the provider hard limit even though v0.3.1 estimated nominal headroom.

Changes:

- discover and call the relocatable Neon `pg_cluster_size()` function when available; use it as the capacity-used metric for preflight;
- retain a configurable safety reserve above estimated target schema growth;
- expose provider/current/all-database measurements in `worlds_storage`;
- report and reclaim orphaned non-current BUILDING/VALIDATING releases with `worlds_gc --incomplete`;
- make post-purge bridge-user cleanup and audit best-effort so hard-quota conditions do not misreport a completed storage reclaim;
- preserve root build errors when a hard provider failure closes the child connection; advisory locks fail safe on session close.

The release/data model is unchanged; no Django migration is required.
