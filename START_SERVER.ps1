Set-Location $PSScriptRoot
Write-Host ""
Write-Host "NxtWave AI Build Sprint - Server" -ForegroundColor Cyan
Write-Host ""
py --version
py .\server.py
