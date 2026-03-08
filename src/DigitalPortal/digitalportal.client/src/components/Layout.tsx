import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function FlagNO() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 16" width="22" height="16" role="img" aria-hidden="true">
      <rect width="22" height="16" fill="#EF2B2D" />
      <rect x="6" width="4" height="16" fill="#fff" />
      <rect y="6" width="22" height="4" fill="#fff" />
      <rect x="7" width="2" height="16" fill="#002868" />
      <rect y="7" width="22" height="2" fill="#002868" />
    </svg>
  );
}

function FlagGB() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="22" height="16" role="img" aria-hidden="true">
      <clipPath id="gb-clip">
        <path d="M0 0v30h60V0z" />
      </clipPath>
      <path d="M0 0v30h60V0z" fill="#012169" />
      <path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6" />
      <path d="M0 0l60 30m0-30L0 30" clipPath="url(#gb-clip)" stroke="#C8102E" strokeWidth="4" />
      <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
      <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

export default function Layout() {
  const { t, i18n } = useTranslation();
  const isNorwegian = i18n.language === 'nb';

  const toggleLanguage = () => {
    i18n.changeLanguage(isNorwegian ? 'en' : 'nb');
  };

  const navLinks = [
    { to: '/', label: t('nav.home'), end: true },
    { to: '/sluttbruker-api', label: t('nav.sluttbrukerApi') },
    { to: '/tjenesteeier-api', label: t('nav.tjenesteeigerApi') },
    { to: '/pdp', label: t('nav.pdp') },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-2 no-underline">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1E4D8C' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
                  <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900 text-lg">DigitalPortal</span>
            </NavLink>

            {/* Nav + actions */}
            <div className="flex items-center gap-2">
              <nav className="hidden md:flex items-center gap-1 mr-2">
                {navLinks.map(({ to, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md text-sm font-medium transition-colors no-underline ${
                        isActive
                          ? 'text-white'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`
                    }
                    style={({ isActive }) => isActive ? { backgroundColor: '#1E4D8C' } : {}}
                  >
                    {label}
                  </NavLink>
                ))}
              </nav>

              {/* Language switcher */}
              <button
                onClick={toggleLanguage}
                title={t('lang.switchTo')}
                aria-label={t('lang.switchTo')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700 cursor-pointer"
              >
                {isNorwegian ? <FlagGB /> : <FlagNO />}
                <span className="hidden sm:inline">
                  {isNorwegian ? 'EN' : 'NO'}
                </span>
              </button>

              {/* Altinn docs link */}
              <a
                href="https://docs.altinn.studio"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-lg no-underline transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#1E4D8C' }}
              >
                {t('nav.altinnDocs')}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          <p>DigitalPortal – {t('footer.tagline')}</p>
          <p className="mt-1">{t('footer.org')}</p>
        </div>
      </footer>
    </div>
  );
}
