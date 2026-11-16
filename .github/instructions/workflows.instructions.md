---
applyTo: ".github/workflows/**"
---
# GitHub Actions workflows

- Set `permissions:` explicitly at the top, read-only by default (`contents: read`).
- Elevate only the single job that needs it, by only the scope it needs.
- Never echo secrets or pass them to steps that do not need them.
- For Azure, sign in with OIDC (federated credentials). Never store a client secret.
- Do not rename the `ladder` job in `verify.yml`: the ruleset requires that check.
