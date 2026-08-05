# Bootstrap HashiCorp Vault transit engine for local testing
$vaultAddr = "http://localhost:8200"
$vaultToken = "root"

Write-Host "Checking connection to HashiCorp Vault at $vaultAddr..." -ForegroundColor Cyan

try {
    $health = Invoke-RestMethod -Uri "$vaultAddr/v1/sys/health" -Method Get -TimeoutSec 3
    Write-Host "✅ Vault is online (Sealed: $($health.sealed), Version: $($health.version))" -ForegroundColor Green
} catch {
    Write-Host "❌ Vault is unreachable at $vaultAddr. Make sure docker-compose is running." -ForegroundColor Red
    Exit
}

# Check if transit is mounted
Write-Host "Checking if transit secrets engine is enabled..." -ForegroundColor Cyan
$headers = @{
    "X-Vault-Token" = $vaultToken
}

try {
    $mounts = Invoke-RestMethod -Uri "$vaultAddr/v1/sys/mounts" -Headers $headers -Method Get
    if (-not $mounts."transit/") {
        Write-Host "Transit engine is not mounted. Mounting now..." -ForegroundColor Yellow
        $body = @{
            type = "transit"
            description = "Transit secrets engine for Aegis passport signing"
        } | ConvertTo-Json
        
        $mountResp = Invoke-RestMethod -Uri "$vaultAddr/v1/sys/mounts/transit" -Headers $headers -Method Post -Body $body -ContentType "application/json"
        Write-Host "✅ Transit secrets engine mounted successfully" -ForegroundColor Green
    } else {
        Write-Host "✅ Transit secrets engine already mounted" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Failed to query or mount Vault transit engine: $_" -ForegroundColor Red
    Exit
}

# Check if passport-key exists
Write-Host "Checking if passport-key exists..." -ForegroundColor Cyan
try {
    $keyInfo = Invoke-RestMethod -Uri "$vaultAddr/v1/transit/keys/passport-key" -Headers $headers -Method Get
    Write-Host "✅ passport-key already exists (type: $($keyInfo.data.type))" -ForegroundColor Green
} catch {
    Write-Host "passport-key not found. Creating ed25519 signing key now..." -ForegroundColor Yellow
    try {
        $body = @{
            type = "ed25519"
        } | ConvertTo-Json
        $keyResp = Invoke-RestMethod -Uri "$vaultAddr/v1/transit/keys/passport-key" -Headers $headers -Method Post -Body $body -ContentType "application/json"
        Write-Host "✅ Cryptographic passport-key (ed25519) generated successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to create passport-key: $_" -ForegroundColor Red
        Exit
    }
}

Write-Host "🎉 Vault bootstrapping complete." -ForegroundColor Green
