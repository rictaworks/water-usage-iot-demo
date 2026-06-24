'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDroplet,
  faGauge,
  faBell,
  faFlaskVial,
  faMicrochip,
  faGlobe,
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

const LOCALES = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'zh', label: '中文' },
  { code: 'ru', label: 'Русский' },
  { code: 'es', label: 'Español' },
  { code: 'ar', label: 'العربية' },
] as const;

interface NavItem {
  href: string;
  labelKey: 'dashboard' | 'alerts' | 'simulator' | 'register';
  icon: typeof faGauge;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', labelKey: 'dashboard', icon: faGauge },
  { href: '/alerts', labelKey: 'alerts', icon: faBell },
  { href: '/simulator', labelKey: 'simulator', icon: faFlaskVial },
  { href: '/register', labelKey: 'register', icon: faMicrochip },
];

interface SidebarProps {
  locale: string;
}

export default function Sidebar({ locale }: SidebarProps) {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const pathname = usePathname();

  const getLocalizedHref = (path: string) => `/${locale}${path === '/' ? '' : path}`;

  const isActive = (path: string) => {
    const localizedPath = getLocalizedHref(path);
    return pathname === localizedPath;
  };

  const handleLocaleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = event.target.value;
    const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), '') || '/';
    window.location.href = `/${newLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
  };

  return (
    <aside
      className="flex flex-col h-screen"
      style={{ width: '228px', minWidth: '228px', backgroundColor: '#070e1c' }}
    >
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <FontAwesomeIcon icon={faDroplet} className="text-xl" style={{ color: '#00c8ff' }} />
          <span className="font-semibold text-white text-lg">Water IoT</span>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ href, labelKey, icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={getLocalizedHref(href)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm"
                  style={{
                    color: active ? '#00c8ff' : 'rgba(255,255,255,0.6)',
                    backgroundColor: active ? 'rgba(0,200,255,0.1)' : 'transparent',
                  }}
                >
                  <FontAwesomeIcon icon={icon} className="w-4 h-4" />
                  <span>{t(labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/10">
        <label className="flex items-center gap-2 text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <FontAwesomeIcon icon={faGlobe} />
          <span>{tCommon('language')}</span>
        </label>
        <select
          value={locale}
          onChange={handleLocaleChange}
          className="w-full px-2 py-1.5 rounded text-sm text-white border border-white/20 focus:outline-none focus:border-accent"
          style={{ backgroundColor: '#0a1628' }}
        >
          {LOCALES.map(({ code, label }) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}
