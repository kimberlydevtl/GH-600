#!/usr/bin/env bash
# The verification ladder. One script, two callers:
#   - agents run it in their loop before claiming anything works
#   - CI runs the SAME script as the required "ladder" check (.github/workflows/verify.yml)
# Each rung is a check that can actually fail, and each proves something the rung
# before it does not. Stops at the first red rung.
set -uo pipefail
cd "$(dirname "$0")/.."
mkdir -p .verify
ROWS=.verify/rows.md
: > "$ROWS"
PORT="${VERIFY_PORT:-3917}"
BUILD_ID="verify-$(date +%s)-$RANDOM"
PID=""

report() {
  { echo "## Verification ladder"; echo; echo "| Rung | Result | Evidence |"; echo "|---|---|---|"; cat "$ROWS"; } > .verify/report.md
  echo; cat .verify/report.md
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then cat .verify/report.md >> "$GITHUB_STEP_SUMMARY"; fi
}
cleanup() { [ -n "$PID" ] && kill "$PID" 2>/dev/null; }
trap cleanup EXIT
pass() { echo "| $1 | PASS | $2 |" >> "$ROWS"; echo "PASS  $1"; }
fail() { echo "| $1 | FAIL | $2 |" >> "$ROWS"; echo "FAIL  $1: $2"; report; exit 1; }
oneline() { head -c 300 "$1" | tr '\n|' '  '; }

# Rung 1: typecheck. Proves the code is consistent. Does not prove it builds or runs.
if npm run -s typecheck > .verify/1-typecheck.log 2>&1; then
  pass "1 Typecheck" "api, web and mcp clean"
else
  fail "1 Typecheck" "$(oneline .verify/1-typecheck.log)"
fi

# Rung 2: tests. Proves the behaviour you thought to test. Nothing more.
if npm test -s > .verify/2-tests.log 2>&1; then
  pass "2 Tests" "$(grep -E '^# (pass|fail)' .verify/2-tests.log | tr -d '#' | tr '\n' ' ')"
else
  fail "2 Tests" "$(grep -E '^# (pass|fail)' .verify/2-tests.log | tr -d '#' | tr '\n' ' ') see .verify/2-tests.log"
fi

# Rung 3: production build. Typecheck passing does not mean the bundle builds.
if npm run -s build > .verify/3-build.log 2>&1; then
  pass "3 Build" "web bundle, api and mcp compiled"
else
  fail "3 Build" "$(tail -c 300 .verify/3-build.log | tr '\n|' '  ')"
fi

# Rung 4: run the BUILT app and prove it is THIS build serving real data.
# /api/health would pass on any old build, so we check a build id only this run knows,
# real data paths, and that the UI bundle the page references actually loads.
BUILD_ID="$BUILD_ID" PORT="$PORT" node api/dist/server.js > .verify/4-server.log 2>&1 &
PID=$!
for _ in $(seq 1 50); do curl -sf "http://localhost:$PORT/api/health" >/dev/null && break; sleep 0.2; done
B="http://localhost:$PORT"
VERSION=$(curl -s "$B/api/version")
ME=$(curl -s -H 'x-user: ben' "$B/api/me")
ANON=$(curl -s -o /dev/null -w '%{http_code}' "$B/api/leave")
LIST=$(curl -s -H 'x-user: ben' "$B/api/leave")
ASSET=$(curl -s "$B/" | grep -oE '/assets/[^"]+\.js' | head -1)
ASSET_CODE=$(curl -s -o /dev/null -w '%{http_code}' "$B${ASSET:-/missing.js}")
if echo "$VERSION" | grep -q "$BUILD_ID" && echo "$ME" | grep -q '"role":"manager"' \
   && [ "$ANON" = "401" ] && echo "$LIST" | grep -q '"items"' && [ "$ASSET_CODE" = "200" ]; then
  pass "4 Running app" "this build is live ($BUILD_ID), /api/me ok, anonymous 401, data returned, UI bundle ${ASSET} 200"
else
  fail "4 Running app" "version=$VERSION me=$(echo "$ME" | head -c 80) anon=$ANON asset=${ASSET:-none}:$ASSET_CODE"
fi

# Rung 5: MCP. Start the MCP server like an agent would, discover tools, call one.
# Also proves least privilege: read mode must NOT expose write tools.
WRITE=$(LEAVE_API_URL="$B" LEAVE_USER=ben npx --no-install tsx mcp/src/smoke.ts write 2> .verify/5-mcp.log)
READ=$(LEAVE_API_URL="$B" LEAVE_USER=ben npx --no-install tsx mcp/src/smoke.ts read 2>> .verify/5-mcp.log)
if echo "$WRITE" | grep -q 'approve_request' && ! echo "$READ" | grep -q 'approve_request' \
   && echo "$READ" | grep -q '"pendingVisible":[1-9]'; then
  pass "5 MCP tools" "write mode exposes approve_request, read mode does not, list_requests returns data"
else
  fail "5 MCP tools" "write=$WRITE read=$READ"
fi

# Rung 6: no secrets committed. Credentials belong in secrets or app settings.
if grep -rInE "(password\s*=\s*['\"][^'\"]+|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|ghp_[A-Za-z0-9]{30,}|AccountKey=[A-Za-z0-9+/=]{20,})" \
     --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.verify --exclude-dir=dist --exclude=verify.sh . > .verify/6-secrets.log; then
  fail "6 No secrets" "possible secret found, see .verify/6-secrets.log"
else
  pass "6 No secrets" "no credential patterns found"
fi

report
