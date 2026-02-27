#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

USER_EMAIL="mikewhittom27@gmal.com"
ORG_NAME="HappyHead"

COMPANY_CONTEXT=$(cat <<'EOF'
# Happy Head – Company Context

## Mission
Happy Head is a telehealth company focused on personalized hair loss treatments.

## Core Services
- Online medical consultation
- Prescription hair loss medication
- Subscription-based fulfillment
- Customer support for treatment management

## Target Audience
- Men and women experiencing hair loss
- US-based customers
## Payment & Disputes
- If a Stripe dispute is won, the charge is reinstated.
- Order status should reflect payment success.
- Pending Payment is not considered a valid final state.

## Webhooks
- Production webhook endpoint:
  https://api.happyhead.com/2x-solutions-middleware/webhooks/post-call
- Staging and dev endpoints must not be mixed.

## Order Status Logic
- Processing = Paid
- Pending Payment = Awaiting charge
- Completed = Fulfilled
## Knowledge Usage Rules

- Only answer using retrieved internal documents.
- If information is missing, say: "I don't have enough information."
- Do not invent policies.
- Prioritize the most recent documents.
- Slack messages are less authoritative than official documentation.
## Tone & Communication Style

- Be concise.
- Be professional but friendly.
- Avoid speculation.
- If uncertain, ask clarifying questions.
## Restrictions

- Do not provide medical advice beyond documented policies.
- Do not guess customer data.
- Do not expose internal API keys or secrets.
- Do not assume environment (dev/staging/prod) unless specified.
EOF
)

extract_id() {
  node -e 'const fs=require("fs");const raw=fs.readFileSync(0,"utf8");const data=JSON.parse(raw);if(!data?.id){process.stderr.write(`Missing id in response: ${raw}\n`);process.exit(1)}process.stdout.write(data.id);'
}

post_json() {
  local endpoint="$1"
  local payload="$2"

  printf "%s" "$payload" | curl --silent --show-error --fail \
    -X POST "${BASE_URL}${endpoint}" \
    -H "Content-Type: application/json" \
    --data-binary @-
}

echo "[1/4] Create user: ${USER_EMAIL}"
USER_RESPONSE=$(post_json "/user" "{\"email\":\"${USER_EMAIL}\"}")
USER_ID=$(printf "%s" "$USER_RESPONSE" | extract_id)
echo "User created: ${USER_ID}"

echo "[2/4] Create organization: ${ORG_NAME}"
ORG_RESPONSE=$(post_json "/organization" "{\"name\":\"${ORG_NAME}\"}")
ORG_ID=$(printf "%s" "$ORG_RESPONSE" | extract_id)
echo "Organization created: ${ORG_ID}"

echo "[3/4] Link user and organization"
ORG_USER_RESPONSE=$(post_json "/organization-user" "{\"userId\":\"${USER_ID}\",\"organizationId\":\"${ORG_ID}\"}")
ORG_USER_ID=$(printf "%s" "$ORG_USER_RESPONSE" | extract_id)
echo "Organization-user link created: ${ORG_USER_ID}"

echo "[4/4] Create organization context"
CONTEXT_JSON=$(printf "%s" "$COMPANY_CONTEXT" | node -e 'const fs=require("fs");const raw=fs.readFileSync(0,"utf8");process.stdout.write(JSON.stringify(raw));')
ORG_CONTEXT_RESPONSE=$(post_json "/organization-context" "{\"organizationId\":\"${ORG_ID}\",\"createdBy\":\"${USER_ID}\",\"updatedBy\":\"${USER_ID}\",\"context\":${CONTEXT_JSON}}")
ORG_CONTEXT_ID=$(printf "%s" "$ORG_CONTEXT_RESPONSE" | extract_id)
echo "Organization context created: ${ORG_CONTEXT_ID}"

echo "Done."
echo "userId=${USER_ID}"
echo "organizationId=${ORG_ID}"
echo "organizationUserId=${ORG_USER_ID}"
echo "organizationContextId=${ORG_CONTEXT_ID}"
