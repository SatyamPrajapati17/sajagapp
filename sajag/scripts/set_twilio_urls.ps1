param (
    [Parameter(Mandatory=$false)]
    [string]$TunnelUrl = ""
)

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Sajag AI — Twilio & Retell Tunnel Webhook Configurator" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# 1. Prompt for URL if not supplied as argument
if (-not $TunnelUrl) {
    $TunnelUrl = Read-Host "Enter your public tunnel URL (e.g. https://xxxx.ngrok-free.app)"
}

$TunnelUrl = $TunnelUrl.Trim().TrimEnd('/')
if (-not $TunnelUrl.StartsWith("http")) {
    $TunnelUrl = "https://" + $TunnelUrl
}

$HostOnly = $TunnelUrl -replace "https://", "" -replace "http://", ""
$WsUrl = "wss://$HostOnly/llm-ws"
$VoiceUrl = "$TunnelUrl/twilio/voice"
$StatusUrl = "$TunnelUrl/twilio/status"
$RetellWebhook = "$TunnelUrl/retell/webhook"

Write-Host "`n[*] Generated Tunnel Endpoints:" -ForegroundColor Yellow
Write-Host "    - Base Tunnel URL:        $TunnelUrl"
Write-Host "    - Twilio Voice Webhook:   $VoiceUrl (POST)"
Write-Host "    - Twilio Status Callback: $StatusUrl (POST)"
Write-Host "    - Retell Custom-LLM WS:   $WsUrl"
Write-Host "    - Retell Lifecycle Webhook: $RetellWebhook"

# 2. Update .env file with PUBLIC_BASE_URL
$EnvPath = Join-Path $PSScriptRoot "..\backend\.env"
if (Test-Path $EnvPath) {
    $EnvContent = Get-Content $EnvPath
    if ($EnvContent -match "^PUBLIC_BASE_URL=") {
        $EnvContent = $EnvContent -replace "^PUBLIC_BASE_URL=.*", "PUBLIC_BASE_URL=$TunnelUrl"
    } else {
        $EnvContent += "`nPUBLIC_BASE_URL=$TunnelUrl"
    }
    Set-Content -Path $EnvPath -Value $EnvContent
    Write-Host "[+] Updated backend\.env with PUBLIC_BASE_URL=$TunnelUrl" -ForegroundColor Green
}

# 3. Configure Twilio Number via Python Helper
Write-Host "`n[*] Updating Twilio Phone Number via Twilio REST API..." -ForegroundColor Yellow
$PythonScript = @"
import os, sys
from dotenv import load_dotenv
load_dotenv('sajag/backend/.env')
from twilio.rest import Client

sid = os.getenv('TWILIO_ACCOUNT_SID')
token = os.getenv('TWILIO_AUTH_TOKEN')
phone = os.getenv('TWILIO_FROM')

if not sid or not token:
    print('[-] Twilio SID or Token missing in backend/.env')
    sys.exit(0)

try:
    client = Client(sid, token)
    numbers = client.incoming_phone_numbers.list()
    target_num = None
    if phone:
        for n in numbers:
            if n.phone_number == phone:
                target_num = n
                break
    if not target_num and numbers:
        target_num = numbers[0]

    if target_num:
        target_num.update(
            voice_url='$VoiceUrl',
            voice_method='POST',
            status_callback='$StatusUrl',
            status_callback_method='POST'
        )
        print(f'[+] Successfully updated Twilio number {target_num.phone_number} ({target_num.sid})')
    else:
        print('[!] No active incoming phone numbers found on this Twilio account. You can configure in Twilio Console or buy a number.')
except Exception as e:
    print(f'[!] Twilio update notice: {e}')
"@

Set-Content -Path (Join-Path $PSScriptRoot "update_twilio_tmp.py") -Value $PythonScript
& (Join-Path $PSScriptRoot "..\backend\.venv\Scripts\python.exe") (Join-Path $PSScriptRoot "update_twilio_tmp.py")
Remove-Item (Join-Path $PSScriptRoot "update_twilio_tmp.py") -ErrorAction SilentlyContinue

Write-Host "`n=====================================================" -ForegroundColor Cyan
Write-Host "COPY-PASTE THESE INTO RETELL DASHBOARD (retellai.com):" -ForegroundColor White
Write-Host "  1. Agent Custom LLM URL: $WsUrl" -ForegroundColor Green
Write-Host "  2. Agent Webhook URL:    $RetellWebhook" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Cyan

