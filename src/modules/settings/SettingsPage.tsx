import { useState } from 'react'
import './settings.css'
import GeneralSection from './sections/GeneralSection'
import UserProfileSection from './sections/UserProfileSection'
import NotificationsSection from './sections/NotificationsSection'
import AppearanceSection from './sections/AppearanceSection'
import SecuritySection from './sections/SecuritySection'
import AboutSection from './sections/AboutSection'

type SectionId =
  | 'general'
  | 'profile'
  | 'notifications'
  | 'appearance'
  | 'security'
  | 'about'

type NavEntry = {
  id: SectionId
  label: string
  icon: string
}

const navEntries: NavEntry[] = [
  { id: 'general', label: 'Allgemein', icon: '⚙️' },
  { id: 'profile', label: 'Benutzerprofil', icon: '👤' },
  { id: 'notifications', label: 'Benachrichtigungen', icon: '🔔' },
  { id: 'appearance', label: 'Darstellung', icon: '🎨' },
  { id: 'security', label: 'Sicherheit', icon: '🔒' },
  { id: 'about', label: 'Über Facility365', icon: 'ℹ️' },
]

function SettingsPage() {
  const [active, setActive] = useState<SectionId>('general')

  return (
    <div className="settings-page">
      <aside className="settings-sidebar">
        <div className="settings-brand">
          <span className="settings-brand__logo">F</span>
          <div>
            <div className="settings-brand__name">Facility365</div>
            <div className="settings-brand__sub">Einstellungen</div>
          </div>
        </div>

        <nav className="settings-nav" aria-label="Einstellungen">
          {navEntries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={
                'settings-nav__item' + (active === entry.id ? ' is-active' : '')
              }
              aria-current={active === entry.id ? 'page' : undefined}
              onClick={() => setActive(entry.id)}
            >
              <span className="settings-nav__icon" aria-hidden="true">
                {entry.icon}
              </span>
              {entry.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="settings-content">
        {active === 'general' && <GeneralSection />}
        {active === 'profile' && <UserProfileSection />}
        {active === 'notifications' && <NotificationsSection />}
        {active === 'appearance' && <AppearanceSection />}
        {active === 'security' && <SecuritySection />}
        {active === 'about' && <AboutSection />}
      </main>
    </div>
  )
}

export default SettingsPage
