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
