import React from 'react';
import { useAppStore } from '../../store/appStore';
import { PageName } from '../../types';
import { classNames } from '../../utils/formatters';

const NAV_ITEMS: { label: string; page: PageName }[] = [
  { label: 'Dashboard', page: 'dashboard' },
  { label: 'Forecast', page: 'forecast' },
  { label: 'Budget', page: 'budget' },
  { label: 'Analytics', page: 'analytics' },
];

export default function Navbar() {
  const currentPage = useAppStore((s) => s.currentPage);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const isMobileMenuOpen = useAppStore((s) => s.isMobileMenuOpen);
  const setMobileMenuOpen = useAppStore((s) => s.setMobileMenuOpen);

  return (
    <nav className="navbar fixed left-0 right-0 top-0 z-50">
      <div className="mx-auto mt-3 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="nav-inner flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: 'var(--accent)' }}>
              <svg className="h-4 w-4" style={{ color: 'var(--bg-main)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="logo-text text-base">
              Forecast<span style={{ color: 'var(--accent)' }}>AI</span>
            </span>
          </div>

          <div className="hidden items-center gap-0.5 md:flex">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.page}
                onClick={() => setCurrentPage(item.page)}
                className={classNames(
                  'nav-item',
                  currentPage === item.page && 'active'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button className="btn-secondary hidden sm:inline-flex text-xs px-3 py-1.5">
              Export
            </button>
            <button
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              className="btn-ghost md:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="nav-inner mt-2 px-4 py-3 md:hidden">
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.page}
                  onClick={() => {
                    setCurrentPage(item.page);
                    setMobileMenuOpen(false);
                  }}
                  className={classNames(
                    'nav-item block w-full text-left',
                    currentPage === item.page && 'active'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
