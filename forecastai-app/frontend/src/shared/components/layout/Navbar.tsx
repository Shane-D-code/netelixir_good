import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useAlerts } from '../../../features/alerts/hooks/useAlerts';
import AlertBell from '../ui/AlertBell';

interface NavItem {
  label: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/' },
  { label: 'Forecast', path: '/forecast' },
  { label: 'Budget', path: '/budget' },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Planner', path: '/planner' },
  { label: 'Alerts', path: '/alerts' },
];

const MORE_ITEMS: NavItem[] = [
  { label: 'Creative Fatigue', path: '/creative-fatigue' },
  { label: 'Time Machine', path: '/time-machine' },
  { label: 'Reports', path: '/reports' },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadCount, alerts, acknowledge } = useAlerts();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar fixed left-0 right-0 top-0 z-50">
      <div className="mx-auto mt-3 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="nav-inner flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 no-underline">
              <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: 'var(--accent)' }}>
                <svg className="h-4 w-4" style={{ color: '#FFFFFF' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="logo-text text-base" style={{ color: 'var(--text-primary)' }}>
                Forecast<span style={{ color: 'var(--accent)' }}>AI</span>
              </span>
            </Link>
          </div>

          <div className="hidden items-center gap-0.5 lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                {item.label}
              </Link>
            ))}
            <div className="relative">
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className="nav-item"
                style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}
              >
                More
                <svg className="inline-block ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {moreOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-48 py-2"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-lg)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  {MORE_ITEMS.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMoreOpen(false)}
                      className="block px-4 py-2"
                      style={{
                        color: isActive(item.path) ? 'var(--accent)' : 'var(--text-secondary)',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AlertBell
              unreadCount={unreadCount}
              alerts={alerts}
              onOpen={() => navigate('/alerts')}
              onAcknowledge={acknowledge}
            />
            <div className="hidden sm:flex items-center gap-2">
              <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
                {user?.email}
              </span>
              <button
                onClick={logout}
                className="btn-ghost text-xs"
                style={{ padding: '6px 12px' }}
              >
                Logout
              </button>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn-ghost lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="nav-inner mt-2 px-4 py-3 lg:hidden">
            <div className="space-y-1">
              {[...NAV_ITEMS, ...MORE_ITEMS].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`nav-item block w-full text-left ${isActive(item.path) ? 'active' : ''}`}
                  style={{ textDecoration: 'none' }}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t my-2" style={{ borderColor: 'var(--border)' }} />
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="nav-item block w-full text-left"
                style={{ color: 'var(--error)' }}
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
