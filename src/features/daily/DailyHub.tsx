import { useMemo, useState } from 'react'
import type { Couple, UserProfile } from '../../types/models'
import { completeDailyQuest, submitDailyChoice, submitDailyQuestion } from './dailyService'
import { useDaily } from './useDaily'

type Props = {
  couple: Couple
  profile: UserProfile
}

function ChoiceButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: string
  onClick: () => void
}) {
  return (
    <button type="button" className={active ? 'active' : ''} onClick={onClick}>
      {children}
    </button>
  )
}

export function DailyHub({ couple, profile }: Props) {
  const daily = useDaily(couple.id)
  const partnerId = couple.memberIds.find((id) => id !== profile.uid)
  const partnerName = partnerId ? couple.members[partnerId]?.displayName ?? 'второй человек' : 'второй человек'
  const selfQuestion = daily.questions.find((item) => item.uid === profile.uid)
  const partnerQuestion = partnerId ? daily.questions.find((item) => item.uid === partnerId) : undefined
  const selfChoice = daily.choices.find((item) => item.uid === profile.uid)
  const partnerChoice = partnerId ? daily.choices.find((item) => item.uid === partnerId) : undefined
  const selfQuestDone = daily.quest.some((item) => item.uid === profile.uid)
  const partnerQuestDone = partnerId ? daily.quest.some((item) => item.uid === partnerId) : false
  const [answer, setAnswer] = useState('')
  const [ownChoice, setOwnChoice] = useState<'a' | 'b' | null>(null)
  const [partnerGuess, setPartnerGuess] = useState<'a' | 'b' | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const formattedDate = useMemo(() => (
    new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' })
      .format(new Date(`${daily.dayKey}T12:00:00Z`))
  ), [daily.dayKey])

  async function saveQuestion() {
    setBusy('question')
    setMessage(null)
    try {
      await submitDailyQuestion(couple.id, profile.uid, daily.dayKey, answer)
      setAnswer('')
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Не удалось сохранить ответ')
    } finally {
      setBusy(null)
    }
  }

  async function saveChoice() {
    if (!ownChoice || !partnerGuess) {
      setMessage('Сначала выбери свой вариант и прогноз ответа партнёра')
      return
    }
    setBusy('choice')
    setMessage(null)
    try {
      await submitDailyChoice(couple.id, profile.uid, daily.dayKey, ownChoice, partnerGuess)
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Не удалось сохранить выбор')
    } finally {
      setBusy(null)
    }
  }

  async function finishQuest() {
    setBusy('quest')
    setMessage(null)
    try {
      await completeDailyQuest(couple.id, profile.uid, daily.dayKey)
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Не удалось отметить задание')
    } finally {
      setBusy(null)
    }
  }

  const partnerAnswerVisible = Boolean(selfQuestion && partnerQuestion)
  const choiceReveal = Boolean(selfChoice && partnerChoice)
  const didGuessPartner = choiceReveal && selfChoice?.partnerGuess === partnerChoice?.ownChoice
  const partnerGuessedYou = choiceReveal && partnerChoice?.partnerGuess === selfChoice?.ownChoice
  const label = (value: 'a' | 'b') => value === 'a' ? daily.content.choice.optionA : daily.content.choice.optionB

  return (
    <section className="card daily-hub">
      <div className="section-title daily-title">
        <div>
          <span className="muted">{formattedDate}</span>
          <h2>Сегодня вдвоём</h2>
        </div>
        <span className="daily-score">{daily.quest.length + daily.questions.length + daily.choices.length}/6</span>
      </div>

      <article className="daily-section">
        <div className="daily-section-head">
          <span className="daily-icon">01</span>
          <div><strong>Вопрос дня</strong><small>Ответ второго откроется после твоего</small></div>
        </div>
        <p className="daily-prompt">{daily.content.question}</p>
        {selfQuestion ? (
          <div className="daily-answer-grid">
            <div><span>Ты</span><p>{selfQuestion.answer}</p></div>
            <div className={partnerAnswerVisible ? '' : 'locked'}>
              <span>{partnerName}</span>
              <p>{partnerAnswerVisible ? partnerQuestion?.answer : partnerQuestion ? 'Ответ уже есть — сначала ответь сам(а)' : 'Пока не ответил(а)'}</p>
            </div>
          </div>
        ) : (
          <div className="daily-answer-form">
            <textarea
              value={answer}
              maxLength={500}
              placeholder="Твой ответ…"
              onChange={(event) => setAnswer(event.target.value)}
            />
            <button type="button" disabled={busy !== null || !answer.trim()} onClick={() => void saveQuestion()}>
              {busy === 'question' ? 'Сохраняю…' : 'Ответить'}
            </button>
          </div>
        )}
      </article>

      <article className="daily-section">
        <div className="daily-section-head">
          <span className="daily-icon">02</span>
          <div><strong>Насколько ты меня знаешь</strong><small>Сначала выбираете, потом видите совпадения</small></div>
        </div>
        <p className="daily-prompt">{daily.content.choice.prompt}</p>
        {selfChoice ? (
          <div className="choice-result">
            <div><span>Твой выбор</span><strong>{label(selfChoice.ownChoice)}</strong></div>
            <div><span>Ты поставил(а) на {partnerName}</span><strong>{label(selfChoice.partnerGuess)}</strong></div>
            {choiceReveal ? (
              <div className="guess-verdict">
                <b>{didGuessPartner ? '✓ Ты угадал(а)' : '× Ты не угадал(а)'}</b>
                <small>{partnerName}: {label(partnerChoice!.ownChoice)} · {partnerGuessedYou ? 'твой ответ угадан' : 'твой ответ не угадан'}</small>
              </div>
            ) : <div className="guess-verdict waiting"><b>Ждём второй ответ</b><small>Твой прогноз уже зафиксирован</small></div>}
          </div>
        ) : (
          <div className="choice-game">
            <div className="choice-row">
              <span>Что выбираешь ты?</span>
              <div><ChoiceButton active={ownChoice === 'a'} onClick={() => setOwnChoice('a')}>{daily.content.choice.optionA}</ChoiceButton><ChoiceButton active={ownChoice === 'b'} onClick={() => setOwnChoice('b')}>{daily.content.choice.optionB}</ChoiceButton></div>
            </div>
            <div className="choice-row">
              <span>Что выберет {partnerName}?</span>
              <div><ChoiceButton active={partnerGuess === 'a'} onClick={() => setPartnerGuess('a')}>{daily.content.choice.optionA}</ChoiceButton><ChoiceButton active={partnerGuess === 'b'} onClick={() => setPartnerGuess('b')}>{daily.content.choice.optionB}</ChoiceButton></div>
            </div>
            <button className="daily-submit" type="button" disabled={busy !== null || !ownChoice || !partnerGuess} onClick={() => void saveChoice()}>
              {busy === 'choice' ? 'Фиксирую…' : 'Зафиксировать выбор'}
            </button>
          </div>
        )}
      </article>

      <article className="daily-section quest-section">
        <div className="daily-section-head">
          <span className="daily-icon">03</span>
          <div><strong>Маленькое задание</strong><small>{daily.quest.length}/2 выполнено</small></div>
        </div>
        <p className="daily-prompt">{daily.content.quest}</p>
        <div className="quest-progress"><span className={selfQuestDone ? 'done' : ''}>Ты {selfQuestDone ? '✓' : '○'}</span><span className={partnerQuestDone ? 'done' : ''}>{partnerName} {partnerQuestDone ? '✓' : '○'}</span></div>
        <button className="daily-submit" type="button" disabled={busy !== null || selfQuestDone} onClick={() => void finishQuest()}>
          {selfQuestDone ? 'Ты отметил(а) выполнение' : busy === 'quest' ? 'Сохраняю…' : 'Я сделал(а)'}
        </button>
        {selfQuestDone && partnerQuestDone ? <div className="daily-complete">Готово вдвоём · задание дня закрыто</div> : null}
      </article>

      {message ? <p className="daily-message">{message}</p> : null}
      {daily.error ? <p className="sync-warning game-error">{daily.error}</p> : null}
    </section>
  )
}
