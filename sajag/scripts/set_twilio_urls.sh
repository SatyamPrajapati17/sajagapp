#!/usr/bin/env bash
# Sajag AI — Twilio & Retell Tunnel Webhook Configurator

TUNNEL_URL="$1"
if [ -z "$TUNNEL_URL" ]; then
    read -p "Enter your public tunnel URL (e.g. https://xxxx.ngrok-free.app): " TUNNEL_URL
fi

TUNNEL_URL="${TUNNEL_URL%/}"
HOST_ONLY=$(echo "$TUNNEL_URL" | sed -e 's|^[^/]*//||')
WS_URL="wss://$HOST_ONLY/llm-ws"
VOICE_URL="$TUNNEL_URL/twilio/voice"
STATUS_URL="$TUNNEL_URL/twilio/status"
RETELL_WEBHOOK="$TUNNEL_URL/retell/webhook"

echo "====================================================="
echo "Sajag AI — Twilio & Retell Webhook URLs"
echo "====================================================="
echo "Base Tunnel:             $TUNNEL_URL"
echo "Twilio Voice Webhook:    $VOICE_URL (POST)"
echo "Twilio Status Callback:  $STATUS_URL (POST)"
echo "Retell Custom-LLM WS:    $WS_URL"
echo "Retell Webhook:          $RETELL_WEBHOOK"
echo "====================================================="

# Update backend/.env
ENV_FILE="$(dirname "$0")/../backend/.env"
if [ -f "$ENV_FILE" ]; then
    if grep -q "^PUBLIC_BASE_URL=" "$ENV_FILE"; then
        sed -i.bak "s|^PUBLIC_BASE_URL=.*|PUBLIC_BASE_URL=$TUNNEL_URL|" "$ENV_FILE"
    else
        echo "PUBLIC_BASE_URL=$TUNNEL_URL" >> "$ENV_FILE"
    fi
    echo "[+] Updated backend/.env with PUBLIC_BASE_URL=$TUNNEL_URL"
fi

