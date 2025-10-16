# Настройка Ngrok для Finansik API

Этот документ описывает, как настроить ngrok для проброса ваших API endpoints через публичные URL.

## Предварительные требования

1. ✅ Аккаунт ngrok (зарегистрирован)
2. ✅ Ngrok агент установлен и настроен
3. ✅ Токен авторизации получен

## Настройка

### 1. Установка токена авторизации

Создайте файл `.env` в корне проекта `Finansik/api/` и добавьте ваш токен:

```bash
# .env файл
NGROK_AUTHTOKEN=your_actual_ngrok_token_here
DATABASE_URL=postgresql://postgres:postgres@db:5432/finansik?schema=public
JWT_SECRET=dev_secret_change_me
PORT=3000
```

### 2. Запуск проекта

#### Для Windows (PowerShell):
```powershell
# Установите токен
$env:NGROK_AUTHTOKEN = "your_actual_ngrok_token_here"

# Запустите скрипт
.\start-ngrok.ps1
```

#### Для Linux/macOS (Bash):
```bash
# Установите токен
export NGROK_AUTHTOKEN="your_actual_ngrok_token_here"

# Сделайте скрипт исполняемым и запустите
chmod +x start-ngrok.sh
./start-ngrok.sh
```

#### Ручной запуск:
```bash
# Установите токен
export NGROK_AUTHTOKEN="your_actual_ngrok_token_here"

# Запустите docker-compose
docker-compose up --build -d
```

## Доступные Endpoints

После запуска у вас будут доступны следующие публичные URL:

### 🔗 API Endpoints
- **Базовый URL**: `https://your-subdomain.ngrok.io/api/`
- **Аутентификация**: `https://your-subdomain.ngrok.io/api/auth/`
- **Категории**: `https://your-subdomain.ngrok.io/api/categories/`
- **Операции**: `https://your-subdomain.ngrok.io/api/operations/`
- **Финансы**: `https://your-subdomain.ngrok.io/api/finance/`
- **Цели**: `https://your-subdomain.ngrok.io/api/goals/`
- **Кредиты**: `https://your-subdomain.ngrok.io/api/loans/`
- **Уведомления**: `https://your-subdomain.ngrok.io/api/notifications/`
- **Отчеты**: `https://your-subdomain.ngrok.io/api/reports/`
- **Аналитика**: `https://your-subdomain.ngrok.io/api/analytics/`

### 📖 Документация
- **Swagger UI**: `https://your-subdomain.ngrok.io/docs/`
- **Health Check**: `https://your-subdomain.ngrok.io/health`

### 🗄️ Управление БД
- **Prisma Studio**: `https://your-subdomain.ngrok.io/studio/`

### 📊 Мониторинг
- **Ngrok Dashboard**: `http://localhost:4040`

## Получение URL

После запуска вы можете получить актуальные URL несколькими способами:

### 1. Через веб-интерфейс ngrok
Откройте http://localhost:4040 в браузере для просмотра всех активных туннелей.

### 2. Через API ngrok
```bash
curl http://localhost:4040/api/tunnels | jq
```

### 3. Через логи контейнера
```bash
docker-compose logs ngrok
```

## Структура проекта

```
Finansik/api/
├── docker-compose.yml     # Конфигурация Docker с ngrok
├── ngrok.yml             # Конфигурация ngrok туннелей
├── start-ngrok.sh        # Bash скрипт для запуска
├── start-ngrok.ps1       # PowerShell скрипт для запуска
├── .env                  # Переменные окружения (создать самостоятельно)
└── NGROK_SETUP.md        # Эта документация
```

## Устранение неполадок

### Проблема: Токен не принимается
**Решение**: Убедитесь, что токен правильно установлен в переменной окружения `NGROK_AUTHTOKEN`.

### Проблема: Туннели не создаются
**Решение**: Проверьте логи ngrok: `docker-compose logs ngrok`

### Проблема: API недоступен
**Решение**: Убедитесь, что API контейнер запущен: `docker-compose ps`

## Остановка сервисов

```bash
docker-compose down
```

## Безопасность

⚠️ **Важно**: Эти URL публично доступны в интернете. Не используйте их для продакшена без дополнительной аутентификации и защиты.
