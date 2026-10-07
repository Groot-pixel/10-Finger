import { createContext, useContext } from 'react'
import type { Language } from '@shared/types'
import { translations } from './translations'

export const LanguageContext = createContext<Language>('de')

function getPath(obj: unknown, path: string[]): unknown {
  return path.reduce<unknown>((acc, key) => (typeof acc === 'object' && acc !== null ? (acc as Record<string, unknown>)[key] : undefined), obj)
}

export function useTranslation(): { t: (key: string, params?: Record<string, string>) => string; language: Language } {
  const language = useContext(LanguageContext)
  const dict = translations[language]

  function t(key: string, params?: Record<string, string>): string {
    const value = getPath(dict, key.split('.'))
    let text = typeof value === 'string' ? value : key
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        text = text.replace(`{${paramKey}}`, paramValue)
      }
    }
    return text
  }

  return { t, language }
}
