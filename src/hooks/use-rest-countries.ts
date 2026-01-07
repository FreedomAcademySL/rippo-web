import { useMemo } from 'react'

import { CALLING_CODE_OPTIONS, COUNTRY_OPTIONS } from '@/data/country-options'

interface UseRestCountriesState {
  countries: typeof COUNTRY_OPTIONS
  callingCodes: typeof CALLING_CODE_OPTIONS
  loading: boolean
  error: string | null
}

export const useRestCountries = (): UseRestCountriesState => {
  return useMemo(
    () => ({
      countries: COUNTRY_OPTIONS,
      callingCodes: CALLING_CODE_OPTIONS,
      loading: false,
      error: null,
    }),
    [],
  )
}










