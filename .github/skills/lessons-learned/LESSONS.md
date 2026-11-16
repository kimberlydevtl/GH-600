# Lessons learned

Search this file for the symptom before guessing. Add a row when a non-obvious failure is
fixed (see SKILL.md). Rows marked *(this repo)* happened while building this kit; the rest
were learned on similar React + API + Azure internal tools.

## Verification and evidence

| Symptom | Cause | Fix | Prevent |
|---|---|---|---|
| Deploy "succeeded" but users still see old behaviour | `/api/health` returns 200 on the old build too | Check `/api/version` for this build's id and the current bundle hash | Decision 0005, ladder rung 4 |
| Typecheck green, page is blank | Typecheck does not run the bundle; a runtime error in the browser | Open the console, read the first red error | Ladder rung 3 (build) and rung 4 (bundle loads) |
| Browser test clicked the wrong element *(this repo)* | Text selector "Approve" matched the "Approved" label first | Select by role and name (`button` with text) instead of raw text | Prefer role-based selectors in UI tests |
| A test "passes" but would also pass if the code were wrong | Test asserts something the change never touches | Break the code on purpose, confirm the test goes red, then restore | `verify-ladder`: pick the check that would go red |

## TypeScript and build

| Symptom | Cause | Fix | Prevent |
|---|---|---|---|
| `TS2322 ... Response<any> is not assignable to type 'void'` in an Express handler *(this repo)* | `return res.status(...).json(...)` returns a Response where Express types expect void | Call `res.status(...).json(...)` then `return;` on its own line | Pattern used in all routes here |
| White screen right after adding a library | A CommonJS dependency that `require()`s at runtime is not pre-bundled by Vite | Install the transitive dependency and add it to `optimizeDeps.include` | Run rung 4 after adding any UI dependency |
| White screen right after deleting a file | A surviving import of the deleted file, often a relative `./X` that a path search missed | Search for the file's base name, then fix or recreate the import | Typecheck and build before committing deletions |
| Dev server still 404s a file you deleted or renamed | Vite's transform cache | Restart the dev server | |
| UI looks stale after a rebuild | Browser cached the old bundle | Open a new tab (not a reload), or check the bundle hash in the page source | Rung 4 checks the served bundle |
| `tsc -b` errors about a referenced project | Referenced tsconfig is missing `composite: true` or `outDir` | Add both to the referenced tsconfig | |

## Identity and sign-in (Entra, MSAL)

| Symptom | Cause | Fix | Prevent |
|---|---|---|---|
| Sign-in page shows `AADSTS50011` | This origin is not a SPA redirect URI on the app registration | Add the exact origin (localhost port or the App Service host) as a SPA redirect URI | List every origin in `entra-auth` setup |
| Signs in, then every `/api` call is 401 | API audience or issuer does not match the token | Accept the client id and `api://{clientId}` as audiences, and both v1 and v2 issuers | `entra-auth` skill |
| App shows "Loading..." forever after a day away, no `/api` calls in the network tab | MSAL silent renewal hangs once the session cookie is gone | Token health check on boot and tab focus, hard timeout around silent renewal, redirect on failure | `entra-auth` skill, stale-session section |
| API calls return a 302 to a login page instead of 401 | App Service Authentication (Easy Auth) is on, in front of in-app MSAL | Turn Easy Auth off; validate tokens in the API | Decision 0007 |
| Signed-in user sees an empty app | User is not provisioned in `user_roles`, and the API returned empty data instead of 403 | Return 403 "not provisioned"; show a clear message in the UI | Decision 0006 |

## Azure SQL and managed identity

| Symptom | Cause | Fix | Prevent |
|---|---|---|---|
| Signs in fine, data endpoints hang or 500, logs mention ManagedIdentityCredential or login failed | The App Service managed identity is not a user in the database | As the SQL Entra admin: `CREATE USER [<app-name>] FROM EXTERNAL PROVIDER` and grant reader/writer | `azure-sql-mi` skill |
| Local `sqlcmd` or the local API cannot reach the database | Your IP is blocked by the SQL server firewall (VPN changes it) | Add your current IP as a firewall rule, or connect from an allowed network | |
| Everything hangs under load locally | Many requests each start their own `az` CLI token call at once | Cache the token and share one in-flight token request | `azure-sql-mi` token cache |

## Azure App Service and deploy

| Symptom | Cause | Fix | Prevent |
|---|---|---|---|
| Deploy reports "worker failed to start within the allotted time" | Cold start of a new build, usually a false alarm | Verify with rung 7 (build id on the live URL) before treating it as a failure; turn on Always On | `deploy-azure` skill |
| `az webapp list` does not show an app that is clearly live | Missing role on the subscription; elevation (for example PIM) not activated | Activate the required role, then retry | Check access before deploy day |
| Bare `name.azurewebsites.net` does not resolve | Newer apps use regional host names (`name-<hash>.<region>-01.azurewebsites.net`) | Use the default host name from `az webapp show` | Store the real host in the deploy workflow |
| Garbled characters (for example `Â·`) in HTML or email | Missing `charset=utf-8` | Add `<meta charset="utf-8">`; entity-encode special characters in email | |
