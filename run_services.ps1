# Pro-tip: Run this file to start the Python Aegis Cruc engine services in parallel!

$apiJobs = @()

# Read OpenRouter API Key
$openrouterKey = (Get-Content "f:\Aegis Crucible\.env" | Select-String "OPENROUTER_API_KEY=" | ForEach-Object { 
    if ($_.Line.Contains("=")) { $_.Line.Split("=")[1].Trim() } else { "" }
})
$anthropicKey = (Get-Content "f:\Aegis Crucible\.env" | Select-String "ANTHROPIC_API_KEY=" | ForEach-Object { 
    if ($_.Line.Contains("=")) { $_.Line.Split("=")[1].Trim() } else { "" }
})
$openaiKey = (Get-Content "f:\Aegis Crucible\.env" | Select-String "OPENAI_API_KEY=" | ForEach-Object { 
    if ($_.Line.Contains("=")) { $_.Line.Split("=")[1].Trim() } else { "" }
})

# 1. Attack Generator (Port 8001)
Write-Host "🚀 Starting Attack Generator on Port 8001..." -ForegroundColor Cyan
$generatorJob = Start-Process -FilePath "f:\Aegis Crucible\services\attack-generator\.venv\Scripts\python.exe" `
  -ArgumentList "-m uvicorn src.api:app --host 0.0.0.0 --port 8001" `
  -Environment @{ 
    ANTHROPIC_API_KEY = $anthropicKey; 
    OPENROUTER_API_KEY = $openrouterKey 
  } `
  -NoNewWindow -PassThru

# 2. Evaluator Agent (Port 8002)
Write-Host "🚀 Starting Evaluator Agent on Port 8002..." -ForegroundColor Magenta
$evaluatorJob = Start-Process -FilePath "f:\Aegis Crucible\services\evaluator-agent\.venv\Scripts\python.exe" `
  -ArgumentList "-m uvicorn src.api:app --host 0.0.0.0 --port 8002" `
  -Environment @{ 
    OPENAI_API_KEY = $openaiKey; 
    OPENROUTER_API_KEY = $openrouterKey 
  } `
  -NoNewWindow -PassThru

# 3. Analysis Engine (Port 8003)
Write-Host "🚀 Starting Analysis Engine on Port 8003..." -ForegroundColor Yellow
$analysisJob = Start-Process -FilePath "f:\Aegis Crucible\services\analysis-engine\.venv\Scripts\python.exe" `
  -ArgumentList "-m uvicorn src.api:app --host 0.0.0.0 --port 8003" `
  -NoNewWindow -PassThru

Write-Host "✅ All Python services running in the background!" -ForegroundColor Green
Write-Host "To stop them, run: Stop-Process -Id $($generatorJob.Id), $($evaluatorJob.Id), $($analysisJob.Id)" -ForegroundColor DarkYellow
