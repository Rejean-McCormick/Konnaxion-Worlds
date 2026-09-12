# KX World schema dependency marker fix v1

Fixes isolated WorldRelease migration replay when a control-plane migration depends on a World-owned migration.

Observed graph edge:

- `users.0003_remove_user_avatar_user_profile_artwork` depends on `kreative.0002_archivedocument_culturalpartner_digitalarchive_and_more`.
- `kreative` is a World domain app; `users` remains control-plane/global.
- Previous code copied every non-target control migration into the schema-local `django_migrations` ledger before replaying World apps.
- This pre-marked `users.0003+` before `kreative` existed in migration state and caused `StateApps` to fail on the lazy relation `users.User.profile_artwork -> kreative.KreativeArtwork`.

The fix marks only non-target migrations whose dependency ancestry does not cross a World-owned migration. It also fails closed if the migration graph ever requires an interleaved control-plane migration to be physically applied inside a World schema.
