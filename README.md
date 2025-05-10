# LO App

Мобильное приложение на базе React Native для взаимодействия с API LO с пользовательским дизайном.

## Особенности

- Современный пользовательский интерфейс с фиолетовой цветовой схемой
- Возможность получения реальных данных из API LO
- Резервные мок-данные при недоступности API
- Полностью нативный дизайн и интерфейс для выбранных данных
- Адаптивная система авторизации с несколькими методами (password grant, client credentials)
- Детальное отображение постов со всеми их атрибутами
- Пагинация для ленты постов
- Обновление ленты через pull-to-refresh

## Структура проекта

```
LOApp/
├── src/                    # Исходный код приложения
│   ├── components/         # React компоненты
│   │   ├── Auth/           # Компоненты авторизации
│   │   └── Posts/          # Компоненты для отображения постов
│   ├── navigation/         # Навигация приложения
│   ├── services/           # Сервисы для работы с API
│   ├── types/              # TypeScript типы и интерфейсы
│   └── utils/              # Вспомогательные утилиты
├── assets/                 # Статические ресурсы
└── App.tsx                 # Корневой компонент приложения
```

## Реализованные экраны

1. **TokenInputScreen** - экран входа с красивым фоном и возможностью авторизации через API или демонстрационным режимом.
2. **PostListScreen** - экран ленты постов с пользовательским дизайном, реализующим:
   - Красивые карточки постов
   - Аватары пользователей
   - Отображение изображений с правильными пропорциями
   - Индикатор дополнительных фотографий
   - Форматированное время публикации
   - Интерактивные кнопки действий

## Авторизация

Приложение пытается получить доступ к API несколькими способами:

1. Password grant (логин/пароль)
2. Client credentials
3. Custom-метод

В случае неудачи используются тестовые данные для демонстрации функциональности.

## Использование

1. Установите зависимости:

```
npm install
```

2. Запустите приложение:

```
npm start
```

3. Отсканируйте QR-код с помощью Expo Go на вашем устройстве или запустите в эмуляторе.

## Кастомизация

Дизайн приложения легко настраивается. Основные цвета и стили определены в `src/navigation/AppNavigator.tsx`.

## Особенности реализации

- Приложение сначала пытается получить реальные данные из API
- При проблемах с авторизацией или доступом автоматически переходит на мок-данные
- Все компоненты созданы с нуля, не используя готовые компоненты LO
- Отображение информации адаптируется под различные форматы и размеры контента

## Features

- OAuth2 authentication with PKCE flow
- Posts feed with infinite scrolling
- Token management
- Modern UI with responsive design

## Tech Stack

- React Native
- Expo
- TypeScript
- React Navigation
- Axios for API requests
- AsyncStorage for data persistence
- FlashList for optimized lists

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- LO API credentials

### Installation

1. Clone the repository

   ```
   git clone https://github.com/yourusername/LOApp.git
   cd LOApp
   ```

2. Install dependencies

   ```
   npm install
   ```

3. Update the LO API credentials in `src/services/api.ts`

   ```typescript
   const CLIENT_ID = 1; // Replace with your actual LO client ID
   ```

4. Start the development server

   ```
   npx expo start
   ```

5. Scan the QR code with the Expo Go app on your phone or run on a simulator

## Authentication

The app uses OAuth2 with PKCE (Proof Key for Code Exchange) for secure authentication:

1. User initiates the login process
2. A code challenge is generated
3. User is redirected to the LO authentication page
4. After successful authentication, user is redirected back with an authorization code
5. The app exchanges the code for an access token
6. The token is stored securely for future API calls

## Project Structure

```
LOApp/
├── src/
│   ├── components/     # UI components
│   │   ├── Auth/       # Authentication components
│   │   └── Posts/      # Post feed components
│   ├── navigation/     # Navigation configuration
│   ├── services/       # API services
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── app.json            # Expo configuration
└── README.md           # This file
```

## API Integration

The app integrates with the LO API:

- Authentication via `/auth` and `/identity/token` endpoints
- Posts feed via `/posts/feed/` endpoint

## Troubleshooting

### Authentication Issues

- Make sure your CLIENT_ID is correct and has the necessary permissions
- Check that the redirect URI matches what's configured in the LO platform
- Ensure the PKCE flow parameters are correctly formatted

### Build Issues

- Clear Expo caches with `expo start --clear`
- Update dependencies if you encounter version conflicts

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- LO Platform for the API
- The React Native and Expo communities for the excellent tooling
