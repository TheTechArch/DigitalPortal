import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const navLinks = [
  { to: '/', label: 'Hjem', end: true },
  { to: '/mine-klienter', label: 'Mine klienter' },
  { to: '/autoriserte-parter', label: 'Autoriserte parter' },
  { to: '/tilkoblinger', label: 'Tilkoblinger' },
  { to: '/sluttbruker-api', label: 'Sluttbruker-API' },
  { to: '/tjenesteeier-api', label: 'Tjenesteeier-API' },
  { to: '/pdp', label: 'PDP' },
];

export default function Layout() {
  const { isAuthenticated, tokenInfo, logout } = useAuth();
  const navigate = useNavigate();

  const displayName =
    (tokenInfo?.idTokenClaims?.['name'] as string | undefined)
    ?? (tokenInfo?.accessTokenClaims?.['sub'] as string | undefined)
    ?? null;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

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

              {/* Auth area */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  {/* Active session indicator + link to token page */}
                  <NavLink
                    to="/auth/callback"
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-green-200 bg-green-50 text-green-800 text-sm font-medium no-underline hover:bg-green-100 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    {displayName ? displayName.split(' ')[0] : 'Innlogget'}
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Logg ut
                  </button>
                </div>
              ) : (
                <NavLink
                  to="/login"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-lg no-underline transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#1E4D8C' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Logg inn
                </NavLink>
              )}

              {/* Altinn docs */}
              <a
                href="https://docs.altinn.studio"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg no-underline hover:bg-gray-50 transition-colors"
              >
                Docs
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <p>DigitalPortal – Referanseimplementasjon for Altinn tilgangsstyring</p>
          <p className="mt-1">Digitaliseringsdirektoratet</p>
        </div>
      </footer>
    </div>
  );
}
