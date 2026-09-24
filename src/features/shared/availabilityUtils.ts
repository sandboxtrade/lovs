import type { WeekdayKey, WeeklyAvailability } from '../../types/models'

export const DAY_LABELS: Record<WeekdayKey, string> = {
  mon: 'Пн',
  tue: 'Вт',
  wed: 'Ср',
  thu: 'Чт',
  fri: 'Пт',
  sat: 'Сб',
  sun: 'Вс',
}

export const FULL_DAY_LABELS: Record<WeekdayKey, string> = {
  mon: 'Понедельник',
  tue: 'Вторник',
  wed: 'Среда',
  thu: 'Четверг',
  fri: 'Пятница',
  sat: 'Суббота',
  sun: 'Воскресенье',
}

export const DAY_INDEX: WeekdayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
export const STEP_MINUTES = 30
export const MIN_WINDOW_MINUTES = 90
const SEARCH_HORIZON_DAYS = 14

export type MutualWindow = {
  startMs: number
  endMs: number
}

export function hasScheduleEntries(schedule: WeeklyAvailability | undefined) {
  if (!schedule) return false
  return Object.values(schedule.days).some((windows) => windows.length > 0)
}

export function toLocalParts(timestampMs: number, timezoneOffsetMinutes: number) {
  const pseudoLocal = new Date(timestampMs - timezoneOffsetMinutes * 60_000)
  const weekdayKey = DAY_INDEX[pseudoLocal.getUTCDay()]
  const minuteOfDay = pseudoLocal.getUTCHours() * 60 + pseudoLocal.getUTCMinutes()
  return { weekdayKey, minuteOfDay }
}

export function isBusyAt(schedule: WeeklyAvailability, timestampMs: number) {
  const { weekdayKey, minuteOfDay } = toLocalParts(timestampMs, schedule.timezoneOffsetMinutes)
  return schedule.days[weekdayKey].some((window) => minuteOfDay >= window.startMinutes && minuteOfDay < window.endMinutes)
}

export function isFreeForWindow(schedule: WeeklyAvailability, startMs: number, endMs: number) {
  for (let cursor = startMs; cursor < endMs; cursor += STEP_MINUTES * 60_000) {
    if (isBusyAt(schedule, cursor)) return false
  }
  return !isBusyAt(schedule, endMs - 1)
}

export function roundToNextStep(timestampMs: number) {
  const stepMs = STEP_MINUTES * 60_000
  return Math.ceil(timestampMs / stepMs) * stepMs
}

export function findNextMutualWindow(schedules: WeeklyAvailability[], nowMs = Date.now()): MutualWindow | null {
  if (!schedules.length || schedules.some((schedule) => !hasScheduleEntries(schedule))) return null
  const startSearch = roundToNextStep(nowMs)
  const horizon = startSearch + SEARCH_HORIZON_DAYS * 24 * 60 * 60_000
  const durationMs = MIN_WINDOW_MINUTES * 60_000
  const stepMs = STEP_MINUTES * 60_000

  for (let cursor = startSearch; cursor <= horizon; cursor += stepMs) {
    const endMs = cursor + durationMs
    if (schedules.every((schedule) => isFreeForWindow(schedule, cursor, endMs))) {
      return { startMs: cursor, endMs }
    }
  }

  return null
}

export function formatCountdown(targetMs: number, nowMs = Date.now()) {
  const diff = Math.max(0, targetMs - nowMs)
  const totalMinutes = Math.round(diff / 60_000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) return `через ${days} д ${hours} ч`
  if (hours > 0) return `через ${hours} ч ${minutes} мин`
  return `через ${Math.max(1, minutes)} мин`
}

export function formatWindowLabel(window: MutualWindow, viewerOffsetMinutes: number) {
  const startLocal = new Date(window.startMs - viewerOffsetMinutes * 60_000)
  const endLocal = new Date(window.endMs - viewerOffsetMinutes * 60_000)
  const weekdayKey = DAY_INDEX[startLocal.getUTCDay()]
  const sameDay = startLocal.getUTCDate() === endLocal.getUTCDate() && startLocal.getUTCMonth() === endLocal.getUTCMonth()
  const startTime = `${String(startLocal.getUTCHours()).padStart(2, '0')}:${String(startLocal.getUTCMinutes()).padStart(2, '0')}`
  const endTime = `${String(endLocal.getUTCHours()).padStart(2, '0')}:${String(endLocal.getUTCMinutes()).padStart(2, '0')}`
  return sameDay
    ? `${FULL_DAY_LABELS[weekdayKey]} · ${startTime}–${endTime}`
    : `${FULL_DAY_LABELS[weekdayKey]} · ${startTime} → ${endTime}`
}

export function getMeetingSummary(
  ownSchedule: WeeklyAvailability | undefined,
  partnerSchedule: WeeklyAvailability | undefined,
  partnerConnected: boolean,
  partnerName?: string,
  nowMs = Date.now(),
) {
  if (!partnerConnected) {
    return {
      summary: '1 из 2',
      detail: 'Когда подключится партнёр, появится общее свободное окно.',
    }
  }

  const ownReady = hasScheduleEntries(ownSchedule)
  const partnerReady = hasScheduleEntries(partnerSchedule)

  if (!ownReady && !partnerReady) {
    return {
      summary: 'Заполните недели',
      detail: 'Добавьте занятость вам обоим, и приложение посчитает время до встречи.',
    }
  }

  if (!ownReady) {
    return {
      summary: 'Нужно твоё расписание',
      detail: 'Укажи занятые промежутки, чтобы появился прогноз.',
    }
  }

  if (!partnerReady) {
    return {
      summary: `${partnerName ?? 'Партнёр'} ещё не заполнил неделю`,
      detail: 'Как только оба расписания будут готовы, появится ближайшее окно.',
    }
  }

  const nextWindow = findNextMutualWindow([ownSchedule as WeeklyAvailability, partnerSchedule as WeeklyAvailability], nowMs)
  if (!nextWindow) {
    return {
      summary: 'Пока нет общего окна',
      detail: 'В ближайшие 14 дней не найдено длинного свободного промежутка.',
    }
  }

  return {
    summary: formatCountdown(nextWindow.startMs, nowMs),
    detail: formatWindowLabel(nextWindow, ownSchedule?.timezoneOffsetMinutes ?? new Date().getTimezoneOffset()),
  }
}
