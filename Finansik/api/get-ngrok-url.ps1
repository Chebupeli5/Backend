# PowerShell script to get ngrok URL
Write-Host "Getting ngrok URL..." -ForegroundColor Green

# Wait a bit for ngrok to start
Start-Sleep -Seconds 5

# Get ngrok URL from logs
$ngrokUrl = docker-compose logs ngrok | Select-String "started tunnel" | ForEach-Object { 
    if ($_ -match "https://[a-zA-Z0-9-]+\.ngrok-free\.dev") {
        $matches[0]
    } elseif ($_ -match "https://[a-zA-Z0-9-]+\.ngrok\.io") {
        $matches[0]
    }
}

if ($ngrokUrl) {
    Write-Host "Ngrok URL found: $ngrokUrl" -ForegroundColor Green
    Write-Host "Swagger UI: $ngrokUrl/docs" -ForegroundColor Yellow
    Write-Host "Adminer: $ngrokUrl/adminer/" -ForegroundColor Yellow
    Write-Host "API Health: $ngrokUrl/health" -ForegroundColor Yellow
    
    # Copy to clipboard
    $ngrokUrl | Set-Clipboard
    Write-Host "URL copied to clipboard!" -ForegroundColor Green
} else {
    Write-Host "Ngrok URL not found. Make sure ngrok container is running." -ForegroundColor Red
    Write-Host "Try: docker-compose logs ngrok" -ForegroundColor Yellow
}
