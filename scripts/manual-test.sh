#!/bin/bash

# Create a lead
RESPONSE=$(curl -s -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Manual Test","phone":"555-9999","channel":"web"}')

echo "Create lead response:"
echo "$RESPONSE" | jq '.'

# Extract ID
LEAD_ID=$(echo "$RESPONSE" | jq -r '.lead.id')
echo ""
echo "Lead ID: $LEAD_ID"

# Send message
echo ""
echo "Sending message..."
curl -s -X POST "http://localhost:3000/api/leads/$LEAD_ID/messages" \
  -H "Content-Type: application/json" \
  -d '{"message":"test message"}' | jq '.'
