import { useEffect, useState } from 'react'

import { loadRestCountriesData, type RestCountriesData } from '@/services/restcountries'
import type { QuestionnaireSelectOption } from '@/types/questionnaire'

interface UseRestCountriesState extends RestCountriesData {
  loading: boolean
  error: string | null
}

const INITIAL_STATE: UseRestCountriesState = {
  countries: [],
  callingCodes: [],
  loading: true,
  error: null,
}

export const useRestCountries = (): UseRestCountriesState => {
  const [state, setState] = useState<UseRestCountriesState>(INITIAL_STATE)

  useEffect(() => {
    let isMounted = true

    const fetchData = async (): Promise<void> => {
      try {
        const data = await loadRestCountriesData()
        if (!isMounted) {
          return
        }

        setState({
          countries: data.countries ?? [],
          callingCodes: data.callingCodes ?? [],
          loading: false,
          error: null,
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'No pudimos cargar los países.',
        }))
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [])

  return state
}

export type { QuestionnaireSelectOption }
















