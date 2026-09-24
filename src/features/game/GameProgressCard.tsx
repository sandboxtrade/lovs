import { ACHIEVEMENTS } from './gameProgress'
import { useGameProgress } from './useGameProgress'

type Props = {
  coupleId: string
  memberIds: string[]
}

export function GameProgressCard({ coupleId, memberIds }: Props) {
  const { progress, error } = useGameProgress(coupleId, memberIds)
  const unlocked = ACHIEVEMENTS.filter((item) => progress.unlockedAchievementIds.has(item.id))

  return (
    <section className="card game-card">
      <div className="section-title game-title">
        <div>
          <span className="muted">Наш прогресс</span>
          <h2>Уровень {progress.level}</h2>
        </div>
        <div className="xp-total">
          <strong>{progress.totalXp}</strong>
          <span>XP</span>
        </div>
      </div>

      <div className="game-level-progress">
        <div className="game-level-copy">
          <span>{progress.currentLevelXp} / {progress.nextLevelXp} XP</span>
          <strong>{progress.levelProgress}%</strong>
        </div>
        <div className="progress game-progress"><span style={{ width: `${progress.levelProgress}%` }} /></div>
        <small>XP даётся за реальные действия, а не за бесконечные нажатия.</small>
      </div>

      <div className="game-stats">
        <div>
          <span>Дней вместе здесь</span>
          <strong>{progress.activeDays}</strong>
        </div>
        <div>
          <span>Совместный бонус</span>
          <strong>+{progress.pairBonusXp} XP</strong>
        </div>
        <div>
          <span>Достижений</span>
          <strong>{unlocked.length}/{ACHIEVEMENTS.length}</strong>
        </div>
      </div>

      <details className="achievements">
        <summary>
          <span>Достижения</span>
          <small>{unlocked.length} открыто</small>
        </summary>
        <div className="achievement-grid">
          {ACHIEVEMENTS.map((achievement) => {
            const isUnlocked = progress.unlockedAchievementIds.has(achievement.id)
            return (
              <article className={`achievement ${isUnlocked ? 'unlocked' : 'locked'}`} key={achievement.id}>
                <span className="achievement-emoji" aria-hidden="true">{isUnlocked ? achievement.emoji : '◌'}</span>
                <div>
                  <strong>{achievement.title}</strong>
                  <small>{achievement.description}</small>
                </div>
              </article>
            )
          })}
        </div>
      </details>

      {error ? <p className="sync-warning game-error">{error}</p> : null}
    </section>
  )
}
