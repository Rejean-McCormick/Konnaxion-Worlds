# Konnaxion — Common Identity Implementation

## Status

Implementation contract for the kOA common identity architecture.

## Decision

```text
standalone-first
+ local Django/allauth account
+ optional OIDC federation
+ Konnaxion-local authorization
```

Konnaxion keeps `users.User` as its application account. OIDC adds an external identity link through django-allauth `SocialAccount`; it does not replace the local user model.

## Identity key

The external identity key is:

```text
issuer + subject (sub)
```

Email, display name and Konnaxion username are attributes, not federation keys. Konnaxion does not silently merge an OIDC identity into an existing local account because the email matches.

## Login paths

Local:

```text
/accounts/login/
```

Federated, default provider ID:

```text
/accounts/oidc/koa-common/login/
/accounts/oidc/koa-common/login/callback/
```

The login template automatically lists configured social/OIDC providers.

## Authorization

After either login method:

```text
authenticated external/local identity
→ Konnaxion users.User
→ Konnaxion groups / flags / permissions
→ domain authorization
```

OIDC claims do not directly grant Konnaxion administrator or domain roles.

## Account ontology

Interactive browser sessions are allowed by default only for:

```text
account_type = human
is_klone = false
is_active = true
```

Service accounts and synthetic klones remain domain actors but are not interactive users by default.

## API authentication

Browser APIs use Django session authentication and CSRF. The legacy DRF username/password token endpoint is removed from the public surface. Machine-to-machine integrations should use a dedicated integration credential/contract rather than a human password token.

## Production routing

Production is same-origin:

```text
/          Next.js
/api/      Django
/accounts/ Django/allauth/OIDC
/admin/    Django admin via allauth
/users/    Django user management
/static/   Django/WhiteNoise
/media/    media service
```

The CSRF cookie is readable by the browser frontend and is echoed as `X-CSRFToken`; the session cookie stays HttpOnly.

## Environment

```env
COMMON_OIDC_ENABLED=false
COMMON_OIDC_PROVIDER_ID=koa-common
COMMON_OIDC_NAME=kOA Identity
COMMON_OIDC_SERVER_URL=https://id.example.org/realms/koa
COMMON_OIDC_CLIENT_ID=konnaxion
COMMON_OIDC_CLIENT_SECRET=...
```

OIDC is optional. When disabled, local Konnaxion login remains fully functional.
