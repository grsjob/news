<!-- @format -->

# Приложение сбора и обработки новостей

## Описание проекта

Приложение предназначено для агрегации новостей из различных источников, их обработки на бэкенде с использованием языковых моделей (LLM) и отправки обработанных данных конечному пользователю через различные каналы уведомлений.

В текущей версии (MVP) поддерживается отправка уведомлений через Telegram, с возможностью расширения функционала в будущем.

## Архитектура проекта

Проект построен по модульной архитектуре и состоит из следующих основных компонентов:

### Core (`src/core/`)

- **Core.ts** - центральный класс приложения, который управляет всеми процессами:
  - Инициализация источников новостей
  - Обработка статей через LLM
  - Управление уведомлениями
  - Очистка старых статей

### Источники новостей (`src/sources/`)

- **Sources.ts** - менеджер источников новостей
- **BaseSource.ts** - базовый класс для всех источников
- **TelegramSource.ts** - источник для получения новостей из Telegram
- **DvpToSource.ts** - источник для получения новостей из Dvp.to

### Сервисы (`src/services/`)

- **LLMProcessor** (`src/services/llm/`) - обработка статей с помощью языковых моделей
- **NotificationService** (`src/services/notification/`) - отправка уведомлений
- **SchedulerService** (`src/services/scheduler/`) - планировщик задач для автоматического сбора новостей

### База данных (`src/db/`)

- **articles.db.ts** - работа с базой данных статей
- **migrations/** - миграции базы данных

### Конфигурация (`src/config/`)

- **db.ts** - конфигурация подключения к базе данных
- **axios.ts** - конфигурация HTTP клиента

## Технологический стек

- **Backend**: Node.js, TypeScript, Express
- **База данных**: PostgreSQL
- **Оркестрация контейнеров**: Docker, Docker Compose
- **Обработка естественного языка**: LLM (поддерживаются различные модели через API)
- **Уведомления**: Telegram Bot API
- **Планировщик задач**: node-cron

## Установка и запуск

### Требования

- Node.js (версия 16 или выше)
- Docker и Docker Compose
- Доступ к LLM API (например, от SberCloud или других провайдеров)
- Telegram Bot Token (для отправки уведомлений)

### Конфигурация (.env файл)

Для корректной работы приложения необходимо создать файл `.env` в корне проекта со следующими переменными:

```text
# Настройки базы данных
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=news
DATABASE_URL=postgresql://myuser:mypassword@postgres:5432/news
DB_PORT=5432
DB_HOST=localhost

# Настройки сервера
PORT=3000
NODE_ENV=development

# Настройки LLM
LLM_MODEL=Qwen/Qwen3-Coder-480B-A35B-Instruct
LLM_BASE_URL=https://foundation-models.api.cloud.ru/v1
LLM_API_KEY=ваш_api_ключ

# Настройки уведомлений
FRONTEND_NOTIFICATIONS_ENABLED=true
FRONTEND_TELEGRAM_BOT_TOKEN=ваш_токен_бота
FRONTEND_TELEGRAM_CHAT_ID=ваш_chat_id
```

### Запуск в режиме разработки

1. Убедитесь, что Docker запущен
2. Создайте `.env` файл с необходимыми переменными окружения (пример выше)
3. Выполните команду в терминале:

```bash
docker-compose up --build
```

или

```bash
npm run docker:dev
```

4. Дождитесь запуска контейнеров
5. Backend сервис будет доступен по адресу `http://localhost:3000` (или по другому порту, указанному в переменной PORT)
6. К базе данных можно подключиться напрямую из IDE по порту 5432

Во время разработки сервис бэкенда будет автоматически перезапускаться внутри контейнера при внесении изменений в файлы в директории `src`.

### Запуск в продакшн режиме

1. Соберите проект:

```bash
npm run build
```

2. Запустите приложение:

```bash
npm start
```

или

```bash
npm run prod
```

## Использование

### Конфигурация источников новостей

Источники новостей настраиваются в файле [`src/index.ts`](src/index.ts) при инициализации Core:

```typescript
sources: {
  groups: [
    {
      id: "frontend",
      name: "Frontend News",
      enabled: true,
      sources: [
        {
          name: "dvp-frontend",
          type: "dvp" as const,
          tags: ["javascript", "react", "typescript"],
        },
        {
          name: "telegram-frontend",
          type: "telegram" as const,
          channels: ["tproger_web", "webstandards_ru"],
        },
      ],
    },
  ],
  defaultGroupId: "frontend"
}
```

#### Поддерживаемые типы источников:

1. **Telegram** - получение постов из указанных каналов
   - Параметры: `channels` - массив имен каналов

2. **Dvp.to** - получение статей с сайта dvp.to по тегам
   - Параметры: `tags` - массив тегов для фильтрации статей

### Конфигурация LLM

Обработка статей через языковую модель настраивается в файле [`src/index.ts`](src/index.ts):

```typescript
llm: {
  apiKey: process.env.LLM_API_KEY || "your-api-key-here",
  model: process.env.LLM_MODEL || "Qwen/Qwen3-Coder-480B-A35B-Instruct",
  baseUrl: process.env.LLM_BASE_URL || "https://foundation-models.api.cloud.ru/v1",
  maxTokens: 5000,
  temperature: 0.85,
  presencePenalty: 0,
  topP: 0.95,
},
```

#### Параметры LLM:

- `apiKey` - API ключ для доступа к модели
- `model` - идентификатор модели
- `baseUrl` - URL API провайдера
- `maxTokens` - максимальное количество токенов в ответе
- `temperature` - креативность ответа (0-1)
- `presencePenalty` - штраф за повторение тем
- `topP` - ограничение вероятностного распределения

### Конфигурация уведомлений

Уведомления настраиваются в файле [`src/index.ts`](src/index.ts):

```typescript
notifications: {
  groups: [
    {
      id: "frontend-notifications",
      name: "Frontend Notifications",
      config: {
        enabled: process.env.FRONTEND_NOTIFICATIONS_ENABLED !== "false",
        telegram: process.env.FRONTEND_TELEGRAM_BOT_TOKEN && process.env.FRONTEND_TELEGRAM_CHAT_ID
          ? {
              botToken: process.env.FRONTEND_TELEGRAM_BOT_TOKEN,
              chatId: process.env.FRONTEND_TELEGRAM_CHAT_ID,
            }
          : undefined,
      },
      sourceGroups: ["frontend"],
    },
  ],
  defaultGroupId: "frontend-notifications",
},
```

#### Поддерживаемые каналы уведомлений:

1. **Telegram** - отправка сообщений в Telegram
   - Параметры: `botToken`, `chatId`

### Использование классов

#### Core

Основной класс приложения, который управляет всеми процессами:

```typescript
import { Core } from "@/core/Core";

const coreConfig = {
  // конфигурация (см. примеры выше)
};

const core = new Core(coreConfig);
await core.initialize();

// Получение и обработка всех новостей
const results = await core.fetchAndProcessNews();

// Получение и обработка новостей из конкретной группы
const groupResults = await core.fetchAndProcessNewsByGroup("frontend");

// Получение статистики
const stats = core.getStatistics();
console.log(`Total articles processed: ${stats.totalArticlesProcessed}`);
console.log(`Sources count: ${stats.sourcesCount}`);
console.log(`Core initialized: ${stats.isInitialized}`);
```

#### NotificationService

Сервис для отправки уведомлений:

```typescript
import { NotificationService } from "@/services/notification";

const notificationConfig = {
  // конфигурация (см. примеры выше)
};

const notificationService = new NotificationService(notificationConfig);
core.setNotificationService(notificationService);

await notificationService.sendResults(results);

await notificationService.sendResultsToGroup("frontend-notifications", results);
```

#### SchedulerService

Сервис для планирования задач:

```typescript
import { SchedulerService } from "@/services/scheduler";

const schedulerConfig = {
  enabled: true,
  scheduleTime: "0 6 * * *", // 9 утра по Москве (7 AM UTC)
};

const schedulerService = new SchedulerService(schedulerConfig, core);
schedulerService.start();

schedulerService.stop();
```

## Планировщик задач

Приложение включает в себя планировщик задач, который автоматически собирает и обрабатывает новости по расписанию. По умолчанию планировщик запускается ежедневно в 9:00 по Москве.

Расписание можно изменить в файле [`src/index.ts`](src/index.ts):

```typescript
const schedulerConfig = {
  enabled: true,
  scheduleTime: "0 6 * * *", // формат cron
};
```

Формат cron:

- Минуты (0-59)
- Часы (0-23)
- День месяца (1-31)
- Месяц (1-12)
- День недели (0-7, где 0 и 7 - воскресенье)

## Структура базы данных

Приложение использует PostgreSQL для хранения статей. Основная таблица `articles` содержит следующие поля:

- `id` - уникальный идентификатор статьи
- `title` - заголовок статьи
- `content` - содержимое статьи
- `url` - URL статьи
- `source` - источник статьи
- `published_at` - дата публикации
- `created_at` - дата добавления в базу
- `sent` - флаг отправки уведомления

Миграции базы данных находятся в директории [`src/db/migrations/`](src/db/migrations/).

