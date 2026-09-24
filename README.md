# US — наше пространство

v1.0.0 — первая версия, которую уже имеет смысл выкладывать на GitHub Pages и проверять вдвоём на телефонах.

## Что уже работает

- два приватных Firebase-аккаунта в одном пространстве пары;
- realtime presence / last seen;
- эмоции, сила состояния и короткая заметка;
- realtime-касания с доставкой после офлайна;
- общие денежные цели и история пополнений;
- XP пары, уровни, достижения и внутренняя валюта;
- общий 2D-мир, магазин предметов и комната;
- общий питомец с развитием от XP пары;
- ежедневный вопрос с раскрытием ответа партнёра после собственного ответа;
- ежедневная игра «угадай выбор партнёра»;
- маленькое совместное задание дня;
- PWA для добавления на экран iPhone;
- автоматический deploy на GitHub Pages через GitHub Actions.

## Самый простой запуск через GitHub

### 1. Подготовь Firebase

В Firebase Console создай Web App и включи:

- Authentication → Sign-in method → Email/Password;
- Firestore Database.

Открой настройки Web App. Firebase покажет объект `firebaseConfig`. Из него понадобятся 6 значений:

- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

### 2. Загрузи проект на GitHub

Загрузи **содержимое архива**, а не внешнюю папку, в корень репозитория. В корне должны лежать `package.json`, `src`, `public`, `.github` и остальные файлы.

Основная ветка должна называться `main`.

### 3. Добавь Firebase-переменные в GitHub

Открой репозиторий:

`Settings → Secrets and variables → Actions → Variables → New repository variable`

Создай:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Вставь соответствующие значения из Firebase Web App.

### 4. Включи GitHub Pages

`Settings → Pages → Build and deployment → Source → GitHub Actions`

После следующего commit/push workflow `.github/workflows/deploy-pages.yml` сам установит зависимости, соберёт приложение и опубликует его.

### 5. Разреши домен GitHub в Firebase Auth

Когда GitHub покажет адрес сайта вида:

`https://USERNAME.github.io/REPOSITORY/`

в Firebase открой:

`Authentication → Settings → Authorized domains`

и добавь:

`USERNAME.github.io`

Иначе Firebase Authentication может отклонять вход с GitHub Pages.

### 6. Опубликуй Firestore Rules

Самый простой способ без терминала:

1. Firebase Console → Firestore Database → Rules;
2. открой файл `firestore.rules` из проекта;
3. замени содержимое редактора Firebase на содержимое этого файла;
4. нажми `Publish`.

Это обязательно: v1.0 добавляет новые коллекции ежедневных активностей.

## Локальный запуск

Скопируй `.env.example` в `.env`, заполни Firebase config и выполни:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Данные ежедневных механик

v1.0 использует:

- `couples/{coupleId}/dailyQuestionAnswers`
- `couples/{coupleId}/dailyChoiceAnswers`
- `couples/{coupleId}/dailyQuestCompletions`

Ответы и выбор на текущий день неизменяемы после отправки. Это нужно, чтобы после раскрытия ответа партнёра нельзя было переписать свой прогноз.

## Безопасность

Firebase Web App config сам по себе не является серверным секретом. Доступ к данным пары ограничивает `firestore.rules`. Не заменяй правила на `allow read, write: if true`.
