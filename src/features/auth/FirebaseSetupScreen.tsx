export function FirebaseSetupScreen() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">НУЖЕН FIREBASE CONFIG</p>
        <h1>Подключите базу</h1>
        <p className="auth-copy">Создайте файл <code>.env</code> по образцу <code>.env.example</code> и вставьте настройки Web App из Firebase Console.</p>
        <div className="setup-note">
          После этого включите Email/Password в Authentication и создайте Firestore Database. Правила уже лежат в <code>firestore.rules</code>.
        </div>
      </section>
    </main>
  )
}
