# ReactNoteNinja

Современное веб-приложение для создания и управления заметками, построенное с использованием React, Express и TypeScript.

## 🚀 Технологии

- Frontend:
  - React 18
  - TypeScript
  - Vite
  - TailwindCSS
  - React Query
  - React Hook Form
  - Radix UI компоненты

- Backend:
  - Node.js
  - Express
  - TypeScript
  - PostgreSQL
  - Drizzle ORM
  - JWT для аутентификации

## 📋 Требования

- Node.js 18+ 
- PostgreSQL 14+
- npm или yarn

## 🛠 Установка и запуск

1. Клонируйте репозиторий:
```bash
git clone [https://github.com/nursekak/reactTransportlog]
cd reactTransportlog
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env` в корневой директории и добавьте необходимые переменные окружения:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/databasename
JWT_SECRET=your-secret-key
NODE_ENV=development
```

4. Запустите миграции базы данных:
```bash
npm run db:push
```

5. Запуск в режиме разработки:
```bash
npm run dev
```

6. Для production сборки:
```bash
npm run build
npm start
```

## 🌐 Доступные скрипты

- `npm run dev` - Запуск в режиме разработки
- `npm run build` - Сборка проекта
- `npm start` - Запуск production версии
- `npm run check` - Проверка типов TypeScript
- `npm run db:push` - Применение миграций базы данных

## 🔒 Безопасность

- Все API-эндпоинты защищены JWT-аутентификацией
- Пароли хешируются с использованием bcrypt
- Настроен CORS для безопасных cross-origin запросов
- Используются secure cookies для хранения сессий

## 🔧 Конфигурация

### Настройка базы данных
База данных настраивается через переменную окружения `DATABASE_URL`. Убедитесь, что у вас установлен PostgreSQL и создана база данных.

### Настройка CORS
CORS настройки находятся в `server/index.ts`. Для production необходимо настроить список разрешенных доменов.

### Порты
- Development: Frontend - 3000, Backend - 5000
- Production: Единый порт 5000

## 📦 Production Deployment

1. Убедитесь, что все переменные окружения настроены правильно
2. Выполните сборку проекта:
```bash
npm run build
```
3. Запустите приложение:
```bash
npm start
```

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для ваших изменений
3. Внесите изменения
4. Создайте Pull Request

## 📝 Лицензия

MIT

## 👥 Авторы

- [Черний Глеб А]

## 📞 Поддержка

При возникновении проблем создавайте issue в репозитории проекта. 
