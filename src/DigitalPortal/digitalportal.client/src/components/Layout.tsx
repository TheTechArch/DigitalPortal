import { NavLink, Outlet } from 'react-router-dom';

const navLinks = [
  { to: '/', label: 'Hjem', end: true },
  { to: '/sluttbruker-api', label: 'Sluttbruker-API' },
  { to: '/tjenesteeier-api', label: 'Tjenesteeier-API' },
  { to: '/pdp', label: 'PDP' },
];

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <NavLink to="/" className="flex items-center gap-3 no-underline">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1E4D8C' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
                    <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900 text-lg">DigitalPortal</span>
              </div>
            </NavLink>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-md text-sm font-medium transition-colors no-underline ${
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

            <a
              href="https://docs.altinn.studio"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg no-underline transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1E4D8C' }}
            >
              Altinn-dokumentasjon
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          <p>DigitalPortal – Referanseimplementasjon for Altinn tilgangsstyring</p>
          <p className="mt-1">Digitaliseringsdirektoratet</p>
        </div>
      </footer>
    </div>
  );
}
