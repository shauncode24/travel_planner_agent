# ─────────────────────────────────────────────────────────────────────────────
# start.ps1 — launches both the Flask backend and Vite frontend in parallel
# Run from the travel_planner_agent root directory:
#   .\start.ps1
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "`n🚀  Starting Travel Planner Agent...`n" -ForegroundColor Cyan

# ── Flask API (backend) ───────────────────────────────────────────────────────
Write-Host "▶  Starting Flask API on http://localhost:8000 ..." -ForegroundColor Yellow
$flask = Start-Process powershell -ArgumentList `
  "-NoExit", "-Command", `
  "Set-Location '$PSScriptRoot\backend'; python app.py" `
  -PassThru

Start-Sleep -Seconds 2

# ── Vite dev server (frontend) ────────────────────────────────────────────────
Write-Host "▶  Starting Vite dev server on http://localhost:5173 ..." -ForegroundColor Yellow
$vite = Start-Process powershell -ArgumentList `
  "-NoExit", "-Command", `
  "Set-Location '$PSScriptRoot\frontend'; npm run dev" `
  -PassThru

Write-Host "`n✅  Both servers are starting!`n" -ForegroundColor Green
Write-Host "   Frontend  →  http://localhost:5173" -ForegroundColor White
Write-Host "   Backend   →  http://localhost:8000/api/health`n" -ForegroundColor White
Write-Host "Close the two terminal windows to stop the servers." -ForegroundColor DarkGray
