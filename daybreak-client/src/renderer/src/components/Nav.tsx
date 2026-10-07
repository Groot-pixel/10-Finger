import type { JSX } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from '../i18n/useTranslation'
import { APP_NAME } from '@shared/constants'

export function Nav(): JSX.Element {
  const { t } = useTranslation()
  const items: Array<{ to: string; label: string }> = [
    { to: '/', label: t('nav.home') },
    { to: '/mods', label: t('nav.mods') },
    { to: '/community', label: t('nav.community') },
    { to: '/cosmetics', label: t('nav.cosmetics') },
    { to: '/hosting', label: t('nav.hosting') },
    { to: '/settings', label: t('nav.settings') },
    { to: '/console', label: t('nav.console') }
  ]

  return (
    <nav>
      <strong style={{ marginLeft: '1rem' }}>{APP_NAME}</strong>
      <ul>
        {items.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} className={({ isActive }) => (isActive ? 'active' : '')} end={item.to === '/'}>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
