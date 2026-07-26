# Pro-tip: Run this file to start the Go control plane API!

# Set environment variables
$env:DATABASE_URL="postgresql://aegis:localpassword@localhost:5432/aegisforge?sslmode=disable"
$env:PORT="8080"
$env:AEGIS_ENV="development"

# Verify Go is installed. If not, alert the user.
$goCheck = Get-Command go -ErrorAction SilentlyContinue
$goPath = "go"

if (-not $goCheck) {
    if (Test-Path "C:\Program Files\Go\bin\go.exe") {
        $goPath = "C:\Program Files\Go\bin\go.exe"
    } else {
        Write-Host "❌ Error: Go 1.23+ is not installed on this system or not in your PATH." -ForegroundColor Red
        Write-Host "Please download it here: https://go.dev/dl/" -ForegroundColor Yellow
        Write-Host "Or install it via winget: winget install GoLang.Go" -ForegroundColor Yellow
        Exit
    }
}

Write-Host "🚀 Starting Go Control Plane API on port 8080..." -ForegroundColor Cyan
cd "f:\Aegis Crucible\services\control-plane"
& $goPath run cmd/api/main.go
