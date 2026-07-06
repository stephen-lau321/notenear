# firewall-setup.ps1
# Run as Administrator to allow port 5181 through Windows Firewall
# Usage: Right-click PowerShell → Run as Administrator, then:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\firewall-setup.ps1

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Street Music - Firewall Rule Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$ruleName = "Street Music Server (Port 5181)"

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "[ERROR] This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell → Run as Administrator, then re-run this script." -ForegroundColor Yellow
    pause
    exit 1
}

# Check if rule already exists
$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "[INFO] Firewall rule already exists. Removing old rule..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName $ruleName
}

# Add inbound rule for port 5181 TCP
New-NetFirewallRule `
    -DisplayName $ruleName `
    -Description "Allow inbound TCP connections on port 5181 for Street Music web app" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 5181 `
    -Action Allow `
    -Profile Private,Domain `
    | Out-Null

Write-Host "[OK] Firewall rule added: $ruleName" -ForegroundColor Green
Write-Host "      Port 5181 is now accessible from your local network." -ForegroundColor Green
Write-Host ""
Write-Host "NOTE: This only allows connections from Private/Domain networks," -ForegroundColor Yellow
Write-Host "      NOT from the public internet. Safe for LAN use." -ForegroundColor Yellow
Write-Host ""

# Also allow Node.js through firewall (in case it's blocked)
$nodePath = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
if ($nodePath) {
    $nodeRule = "Node.js (Street Music)"
    $existingNode = Get-NetFirewallRule -DisplayName $nodeRule -ErrorAction SilentlyContinue
    if (-not $existingNode) {
        New-NetFirewallRule `
            -DisplayName $nodeRule `
            -Description "Allow Node.js for Street Music web server" `
            -Direction Inbound `
            -Protocol TCP `
            -Program $nodePath `
            -Action Allow `
            -Profile Private,Domain `
            | Out-Null
        Write-Host "[OK] Node.js firewall rule added: $nodePath" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Done! You can now access the server from other devices on your LAN." -ForegroundColor Cyan
Write-Host "Example: http://192.168.x.x:5181/xtwhttra/auth" -ForegroundColor Cyan
pause
