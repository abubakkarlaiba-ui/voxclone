# VoxClone Development Startup Script
# Starts Kokoro TTS server + Next.js dev server

$kokoroDir = "C:\Users\HOME\Desktop\Kokoro-FastAPI"
$voxcloneDir = "C:\Users\HOME\Desktop\ai voice generator and text in voice website\voxclone"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VoxClone Development Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Kokoro server is already running on port 8000
$kokoroRunning = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($kokoroRunning) {
    Write-Host "[Kokoro] Server already running on port 8000" -ForegroundColor Green
} else {
    Write-Host "[Kokoro] Starting TTS server on port 8000..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$kokoroDir'; python server.py" -WindowStyle Normal
    Write-Host "[Kokoro] Server starting in new window (may take a few seconds to load model)" -ForegroundColor Green
}

Write-Host ""
Write-Host "[Next.js] Starting dev server..." -ForegroundColor Yellow
Write-Host "[Next.js] Access at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "[Kokoro]  Access at: http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop. Close the Kokoro window separately." -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan

Set-Location $voxcloneDir
npm run dev
