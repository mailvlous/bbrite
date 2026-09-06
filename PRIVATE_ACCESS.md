# Private Access Requirements

Bbrite is private by design. Cloudflare Access is the primary authentication
boundary for every application route and API endpoint. Do not use URL secrecy
or add an application username/password flow.

## Cloudflare Access setup

1. Create one self-hosted Cloudflare Access application for every hostname that
   serves Bbrite, including the Workers hostname if it remains reachable.
2. Add one Allow policy for the exact email address that owns Bbrite. Do not
   add an Allow Everyone, bypass, service-token, or catch-all policy.
3. Configure these Worker variables with values from that Access application:

```text
ACCESS_TEAM_DOMAIN=your-team.cloudflareaccess.com
ACCESS_AUD=your-access-application-audience
ACCESS_ALLOWED_EMAIL=you@example.com
```

4. Keep `GITHUB_TOKEN` as a Cloudflare secret. It must never be prefixed with
   `PUBLIC_`, placed in client-side code, or returned by an endpoint.

The Worker independently verifies the Access JWT signature, issuer, audience,
validity period, subject, and exact allowlisted email. Missing configuration or
an invalid assertion fails closed with HTTP 401. Every API route also requires
the verified identity from middleware before it can read or change content.
