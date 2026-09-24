export function friendlyFirebaseError(cause: unknown, fallback: string) {
  const raw = cause instanceof Error ? cause.message : String(cause ?? '')
  const normalized = raw.toLowerCase()

  if (
    normalized.includes('permission-denied') ||
    normalized.includes('permission_denied') ||
    normalized.includes('missing or insufficient permissions')
  ) {
    return 'Нет доступа к общим данным. Нужно опубликовать актуальные Firestore Rules из проекта.'
  }

  if (normalized.includes('unavailable') || normalized.includes('network')) {
    return 'Нет связи с Firebase. Проверь интернет и попробуй ещё раз.'
  }

  return raw || fallback
}
