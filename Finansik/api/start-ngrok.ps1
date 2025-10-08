# PowerShell скрипт для запуска проекта с ngrok

Write-Host "🚀 Запуск Finansik API с ngrok..." -ForegroundColor Green

# Проверяем наличие переменной окружения NGROK_AUTHTOKEN
if (-not $env:NGROK_AUTHTOKEN) {
    Write-Host "❌ Ошибка: Переменная NGROK_AUTHTOKEN не установлена" -ForegroundColor Red
    Write-Host "Установите токен: `$env:NGROK_AUTHTOKEN = 'your_token_here'" -ForegroundColor Yellow
    exit 1
}

# Останавливаем существующие контейнеры
Write-Host "🛑 Остановка существующих контейнеров..." -ForegroundColor Yellow
docker-compose down

# Собираем и запускаем контейнеры
Write-Host "🔨 Сборка и запуск контейнеров..." -ForegroundColor Yellow
docker-compose up --build -d

# Ждем запуска ngrok
Write-Host "⏳ Ожидание запуска ngrok..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Получаем URL туннелей
Write-Host "🌐 Получение URL туннелей..." -ForegroundColor Green
Write-Host ""
Write-Host "📋 Доступные endpoints:" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

try {
    # API endpoints
    Write-Host "🔗 API сервис:" -ForegroundColor White
    $apiUrl = (Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" | Where-Object { $_.name -eq "api" }).public_url
    if ($apiUrl) {
        Write-Host "   $apiUrl" -ForegroundColor Green
    } else {
        Write-Host "   API туннель еще не готов" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "📖 Swagger документация:" -ForegroundColor White
    $docsUrl = (Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" | Where-Object { $_.name -eq "docs" }).public_url
    if ($docsUrl) {
        Write-Host "   $docsUrl" -ForegroundColor Green
    } else {
        Write-Host "   Docs туннель еще не готов" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "🗄️  Adminer (управление БД):" -ForegroundColor White
    $adminerUrl = (Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" | Where-Object { $_.name -eq "adminer" }).public_url
    if ($adminerUrl) {
        Write-Host "   $adminerUrl" -ForegroundColor Green
    } else {
        Write-Host "   Adminer туннель еще не готов" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Не удалось получить URL туннелей. Возможно, ngrok еще запускается." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 Ngrok веб-интерфейс: http://localhost:4040" -ForegroundColor Magenta
Write-Host ""
Write-Host "✅ Проект запущен! Используйте URL выше для доступа к API." -ForegroundColor Green
