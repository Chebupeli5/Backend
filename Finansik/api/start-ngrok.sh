#!/bin/bash

# Скрипт для запуска проекта с ngrok

echo "🚀 Запуск Finansik API с ngrok..."

# Проверяем наличие переменной окружения NGROK_AUTHTOKEN
if [ -z "$NGROK_AUTHTOKEN" ]; then
    echo "❌ Ошибка: Переменная NGROK_AUTHTOKEN не установлена"
    echo "Установите токен: export NGROK_AUTHTOKEN=your_token_here"
    exit 1
fi

# Останавливаем существующие контейнеры
echo "🛑 Остановка существующих контейнеров..."
docker-compose down

# Собираем и запускаем контейнеры
echo "🔨 Сборка и запуск контейнеров..."
docker-compose up --build -d

# Ждем запуска ngrok
echo "⏳ Ожидание запуска ngrok..."
sleep 10

# Получаем URL туннелей
echo "🌐 Получение URL туннелей..."
echo ""
echo "📋 Доступные endpoints:"
echo "========================"

# API endpoints
echo "🔗 API сервис:"
curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[] | select(.name=="api") | .public_url' 2>/dev/null || echo "   API туннель еще не готов"

echo ""
echo "📖 Swagger документация:"
curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[] | select(.name=="docs") | .public_url' 2>/dev/null || echo "   Docs туннель еще не готов"

echo ""
echo "🗄️  Prisma Studio (управление БД):"
curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[] | select(.name=="studio") | .public_url' 2>/dev/null || echo "   Studio туннель еще не готов"

echo ""
echo "📊 Ngrok веб-интерфейс: http://localhost:4040"
echo ""
echo "✅ Проект запущен! Используйте URL выше для доступа к API."
