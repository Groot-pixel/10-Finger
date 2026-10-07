import type { JSX } from 'react'
import { useTranslation } from '../i18n/useTranslation'

export function ComingSoonPage({ title }: { title: string }): JSX.Element {
  const { t } = useTranslation()
  return (
    <section>
      <h1>{title}</h1>
      <p>{t('comingSoon')}</p>
    </section>
  )
}
