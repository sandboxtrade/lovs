import { useEffect, useState } from 'react'
import type { PlanOption, PlanScope } from '../../types/models'
import { subscribeToPlanOptions } from './planService'

export function usePlans(coupleId: string, scope: PlanScope) {
  const [options, setOptions] = useState<PlanOption[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    return subscribeToPlanOptions(coupleId, scope, setOptions, setError)
  }, [coupleId, scope])
  return { options, error }
}
