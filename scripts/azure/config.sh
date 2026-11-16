# Shared names for the Azure scripts. Edit here, nowhere else. Mirrors docs/azure-target.md.
REPO="${REPO:-kimberlydevtl/GH-600}"
REVIEWER="${REVIEWER:-kimberlydevtl}"
LOCATION="eastus2"
SUBSCRIPTION_NAME="Azure Demo"

TEST_RG="Github-test";  TEST_PLAN="plan-gh600-test"; TEST_APP="leave-gh600-kty-test"; TEST_ID="gh600-deploy-test"
COPILOT_ID="gh600-copilot"   # Copilot cloud agent: Contributor on Github-test, Reader on Github
PROD_RG="Github";       PROD_PLAN="plan-gh600";      PROD_APP="leave-gh600-kty";      PROD_ID="gh600-deploy"

# Until Entra sign-in (#8) is live, production runs in demo auth as "staging".
# The API refuses AUTH_MODE=demo with NODE_ENV=production on purpose.
PROD_NODE_ENV="${PROD_NODE_ENV:-staging}"; PROD_AUTH_MODE="${PROD_AUTH_MODE:-demo}"

log()  { printf '\033[1m==> %s\033[0m\n' "$*"; }
skip() { printf '    (exists) %s\n' "$*"; }
