# 🏦 Finansik API

> Современный REST API для управления личными финансами с полной Swagger документацией

[![API Status](https://img.shields.io/badge/API-Ready-brightgreen.svg)](https://unsystematizing-citizenly-gretchen.ngrok-free.dev/health)
[![Swagger UI](https://img.shields.io/badge/Swagger-UI-blue.svg)](https://unsystematizing-citizenly-gretchen.ngrok-free.dev/docs)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-3178C6.svg)](https://www.typescriptlang.org/)

## 🚀 Быстрый старт

### Локальная разработка

```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd Finansik/api

# Запустите с Docker Compose
docker-compose up -d

# API будет доступен на http://localhost:3000
# Swagger UI на http://localhost:3000/docs
# Adminer на http://localhost:8080

# 🌐 Внешний доступ (через ngrok):
# Swagger UI: https://unsystematizing-citizenly-gretchen.ngrok-free.dev/docs
# API Health: https://unsystematizing-citizenly-gretchen.ngrok-free.dev/health
# Adminer: https://unsystematizing-citizenly-gretchen.ngrok-free.dev/adminer/
```

### Внешний доступ через ngrok

```bash
# Получите ngrok URL
./get-ngrok-url.sh  # Linux/Mac
# или
.\get-ngrok-url.ps1  # Windows

# Откройте Swagger UI по ngrok URL
https://your-ngrok-url.ngrok-free.dev/docs
```

## 📚 API Документация

### 🔗 Ссылки

#### 🌐 Внешний доступ (рекомендуется)
- **Swagger UI**: [https://unsystematizing-citizenly-gretchen.ngrok-free.dev/docs](https://unsystematizing-citizenly-gretchen.ngrok-free.dev/docs)
- **Health Check**: [https://unsystematizing-citizenly-gretchen.ngrok-free.dev/health](https://unsystematizing-citizenly-gretchen.ngrok-free.dev/health)
- **CORS Test**: [https://unsystematizing-citizenly-gretchen.ngrok-free.dev/cors-test](https://unsystematizing-citizenly-gretchen.ngrok-free.dev/cors-test)
- **Adminer**: [https://unsystematizing-citizenly-gretchen.ngrok-free.dev/adminer/](https://unsystematizing-citizenly-gretchen.ngrok-free.dev/adminer/)

#### 🏠 Локальный доступ
- **Swagger UI**: [http://localhost:3000/docs](http://localhost:3000/docs)
- **Health Check**: [http://localhost:3000/health](http://localhost:3000/health)
- **CORS Test**: [http://localhost:3000/cors-test](http://localhost:3000/cors-test)

### 🛠 Основные возможности

- ✅ **Полная Swagger документация** с интерактивным интерфейсом
- ✅ **JWT аутентификация** с refresh токенами
- ✅ **CORS поддержка** для внешнего доступа
- ✅ **Автоматическое определение HTTPS** для ngrok
- ✅ **Валидация данных** с помощью Zod
- ✅ **TypeScript** для типобезопасности
- ✅ **Docker** для простого развертывания

## 🏗 Архитектура

```
Finansik API
├── 📁 src/
│   ├── 📁 routes/          # API маршруты
│   │   ├── auth.ts         # Аутентификация
│   │   ├── categories.ts   # Категории и лимиты
│   │   ├── assets.ts       # Активы
│   │   ├── savings_accounts.ts  # Сберегательные счета
│   │   ├── operations.ts   # Операции
│   │   ├── goals.ts        # Финансовые цели
│   │   ├── loans.ts        # Кредиты
│   │   └── ...
│   ├── 📁 middleware/      # Middleware
│   ├── 📁 types/          # TypeScript типы
│   ├── 📁 utils/          # Утилиты
│   ├── app.ts             # Express приложение
│   └── openapi.ts         # Swagger конфигурация
├── 📁 prisma/             # База данных
├── docker-compose.yml     # Docker конфигурация
└── nginx.conf            # Nginx прокси
```

## 🔐 Аутентификация

API использует JWT токены для аутентификации:

```bash
# Регистрация
POST /api/auth/signup
{
  "login": "user@example.com",
  "password": "securepassword",
  "visualname": "John Doe"
}

# Вход
POST /api/auth/login
{
  "login": "user@example.com",
  "password": "securepassword"
}

# Использование токена
Authorization: Bearer <your-jwt-token>
```

## 📊 Основные сущности

### 💰 Категории
- Создание и управление категориями расходов/доходов
- Установка лимитов для категорий
- Отслеживание балансов

### 💳 Активы
- Управление банковскими счетами
- Отслеживание наличных средств
- Мониторинг инвестиций

### 🏦 Сберегательные счета
- Создание сберегательных счетов
- Установка процентных ставок
- Отслеживание накоплений

### 📈 Операции
- Запись доходов и расходов
- Привязка к категориям
- Фильтрация по датам

### 🎯 Финансовые цели
- Постановка целей накопления с приоритетами
- Отслеживание прогресса и аналитика
- Планирование бюджета с целевыми датами
- Добавление средств к целям
- Фильтрация по приоритетам
- Автоматическое завершение при достижении цели

## 🐳 Docker

### Сервисы

- **api**: Node.js API сервер (порт 3000)
- **db**: PostgreSQL база данных (порт 5432)
- **adminer**: Веб-интерфейс для БД (порт 8080)
- **gateway**: Nginx прокси сервер (порт 80)
- **ngrok**: Туннель для внешнего доступа

### Команды

```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f api

# Остановка
docker-compose down

# Пересборка
docker-compose up -d --build
```

## 🔧 Разработка

### Требования

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (через Docker)

### Установка зависимостей

```bash
npm install
```

### Запуск в режиме разработки

```bash
npm run dev
```

### Миграции базы данных

```bash
# Применить миграции
npm run prisma:migrate

# Заполнить тестовыми данными
npm run seed
```

## 🌐 Внешний доступ

### Через ngrok

1. Запустите контейнеры: `docker-compose up -d`
2. Получите ngrok URL: `./get-ngrok-url.sh`
3. Откройте Swagger UI: `https://your-url.ngrok-free.dev/docs`

### Через локальную сеть

1. Узнайте IP адрес сервера
2. Откройте Swagger UI: `http://YOUR_IP:3000/docs`
3. В Swagger UI выберите "Custom server" и укажите ваш IP

## 🧪 Тестирование

### Health Check

```bash
# Внешний доступ
curl https://unsystematizing-citizenly-gretchen.ngrok-free.dev/health
# Ответ: {"ok": true}

# Локальный доступ
curl http://localhost:3000/health
# Ответ: {"ok": true}
```

### CORS Test

```bash
# Внешний доступ
curl https://unsystematizing-citizenly-gretchen.ngrok-free.dev/cors-test
# Показывает информацию о CORS заголовках

# Локальный доступ
curl http://localhost:3000/cors-test
# Показывает информацию о CORS заголовках
```

### Swagger UI

#### 🌐 Внешний доступ (рекомендуется)
Откройте [https://unsystematizing-citizenly-gretchen.ngrok-free.dev/docs](https://unsystematizing-citizenly-gretchen.ngrok-free.dev/docs) для интерактивного тестирования API.

#### 🏠 Локальный доступ
Откройте [http://localhost:3000/docs](http://localhost:3000/docs) для интерактивного тестирования API.

## 📝 Примеры использования

### Создание сберегательного счета

```bash
POST /api/savings_accounts
Authorization: Bearer <token>
Content-Type: application/json

{
  "saving_name": "Emergency Fund",
  "balance": 50000,
  "interest_rate": 4.5
}
```

### Добавление операции

```bash
POST /api/operations
Authorization: Bearer <token>
Content-Type: application/json

{
  "category_id": 1,
  "type": "expense",
  "transaction": 1500
}
```

### Создание финансовой цели

```bash
POST /api/goals
Authorization: Bearer <token>
Content-Type: application/json

{
  "goal_name": "Emergency Fund",
  "goal": 50000,
  "description": "Build emergency fund for 6 months",
  "target_date": "2024-12-31T23:59:59.000Z",
  "priority": "high",
  "category": "Emergency"
}
```

### Добавление средств к цели

```bash
POST /api/goals/1/add-money
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 10000
}
```

### Получение аналитики целей

```bash
GET /api/goals/analytics/summary
Authorization: Bearer <token>
```

## 🚨 Устранение неполадок

### API не запускается

```bash
# Проверьте логи
docker-compose logs api

# Перезапустите контейнер
docker-compose restart api
```

### Проблемы с CORS

```bash
# Проверьте CORS тест
curl http://localhost:3000/cors-test

# Проверьте логи nginx
docker-compose logs gateway
```

### Swagger UI не работает

1. Убедитесь, что используете правильный URL
2. Проверьте, что API запущен: `curl http://localhost:3000/health`
3. Очистите кеш браузера

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Добавьте тесты
5. Создайте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License.

## 👥 Команда

- **Backend**: Node.js + TypeScript + Express
- **Database**: PostgreSQL + Prisma ORM
- **Documentation**: Swagger/OpenAPI 3.0
- **Deployment**: Docker + Docker Compose
- **Tunneling**: ngrok

---

<div align="center">

**Сделано с ❤️ для управления личными финансами**

[🚀 Начать работу](https://unsystematizing-citizenly-gretchen.ngrok-free.dev/docs) • [📖 Документация](https://unsystematizing-citizenly-gretchen.ngrok-free.dev/docs) • [🐛 Сообщить об ошибке](https://github.com/your-repo/issues)

</div>