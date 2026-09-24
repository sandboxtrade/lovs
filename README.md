# US v1.1.8

Private two-person PWA built with React, TypeScript, Vite and Firebase.

## GitHub Pages

The project is deployed through `.github/workflows/deploy-pages.yml`.

GitHub repository settings:

1. Settings -> Pages
2. Source -> GitHub Actions
3. Push to `main`

No GitHub Action variables are required for Firebase anymore.

## Firebase config

Edit this single file:

`public/firebase-config.js`

Paste the Firebase Web App config values into it:

```js
window.__FIREBASE_CONFIG__ = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
}
```

The app loads this configuration at runtime. `.env` remains supported for local development but is not required for GitHub Pages.

## Firebase Console

The Firebase project itself still needs:

- Authentication -> Email/Password enabled
- Firestore Database created
- `sandboxtrade.github.io` added to Authentication authorized domains (or your own GitHub Pages domain)
- contents of `firestore.rules` published in Firestore Rules

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```


## Сохранение данных

Основные данные пары хранятся в Firestore и восстанавливаются после закрытия браузера/PWA:
эмоции, фотографии, следующая встреча, планы и оценки, копилка, XP/достижения,
покупки комнаты, питомец, ежедневные ответы и история касаний. Авторизация использует
browserLocalPersistence, поэтому аккаунт также остаётся активным между обычными сессиями.

Фотографии перед записью автоматически уменьшаются и сжимаются до безопасного размера
для одного документа Firestore.
