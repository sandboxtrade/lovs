export function FirebaseSetupScreen() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">НУЖЕН FIREBASE CONFIG</p>
        <h1>Подключите базу</h1>
        <p className="auth-copy">
          Откройте <code>public/firebase-config.js</code> и вставьте туда значения
          <code> firebaseConfig </code> из Firebase Console.
        </p>
        <div className="setup-note">
          GitHub Variables и файл <code>.env</code> для опубликованной версии больше не нужны.
          После заполнения файла перезапустите деплой. Правила Firestore уже лежат в <code>firestore.rules</code>.
        </div>
      </section>
    </main>
  )
}
