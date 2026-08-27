#!/bin/bash
# Deploy Wallet Agent schema to Supabase Agent Niyog project

ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-""}"
PROJECT_REF="xyoiwvzifgfwvvwdqjsf"
MIGRATION_FILE="/home/brinto/New Agent/supabase/migrations/20260826000000_wallet_agent_schema.sql"

echo "=========================================="
echo "  Wallet Agent — Supabase Schema Deploy"
echo "  Project: Agent Niyog ($PROJECT_REF)"
echo "=========================================="

# Read the SQL file
SQL=$(cat "$MIGRATION_FILE")

# Execute migration via Management API
echo ""
echo "→ Deploying schema migration..."
RESPONSE=$(curl -s -X POST \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  --data-binary "{\"query\": $(echo "$SQL" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')}")

echo "Response: $RESPONSE"

# Check for errors
if echo "$RESPONSE" | grep -q '"error"'; then
  echo ""
  echo "✗ Migration failed — check error above"
  exit 1
else
  echo ""
  echo "✓ Schema migration deployed successfully!"
fi

# Verify tables were created
echo ""
echo "→ Verifying created tables..."
TABLES=$(curl -s -X POST \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT tablename FROM pg_tables WHERE schemaname = '"'"'public'"'"' ORDER BY tablename;"}')

echo "Tables: $TABLES"
