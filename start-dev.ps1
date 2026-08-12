# VoxClone Development Startup Script
# Starts Edge TTS server + Next.js dev server

$ttsDir = "C:\Users\HOME\Desktop\ai voice generator and text in voice website\voxclone\tts-server"
$voxcloneDir = "C:\Users\HOME\Desktop\ai voice generator and text in voice website\voxclone"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VoxClone Development Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if TTS server is already running on port 8000
$ttsRunning = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($ttsRunning) {
    Write-Host "[Edge TTS] Server already running on port 8000" -ForegroundColor Green
} else {
    Write-Host "[Edge TTS] Starting TTS server on port 8000..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ttsDir'; python server.py" -WindowStyle Normal
    Write-Host "[Edge TTS] Server starting in new window..." -ForegroundColor Green
}

Write-Host ""
Write-Host "[Next.js] Starting dev server..." -ForegroundColor Yellow
Write-Host "[Next.js] Access at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "[Edge TTS] Access at: http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop. Close the TTS window separately." -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan

Set-Location $voxcloneDir
npm run dev
