#!/bin/bash

PORT=3002

# Create lead
echo "Creating lead..."
RESPONSE=$(curl -s -X POST http://localhost:$PORT/api/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","phone":"555-1234","channel":"web"}')

LEAD_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "Lead ID: $LEAD_ID"
echo ""

# Send message
echo "Sending message to Claude..."
curl -s -X POST "http://localhost:$PORT/api/leads/$LEAD_ID/messages" \
  -H "Content-Type: application/json" \
  -d '{"message":"How much for a full detail?"}' | python -m json.tool

echo ""
echo "Done!"
