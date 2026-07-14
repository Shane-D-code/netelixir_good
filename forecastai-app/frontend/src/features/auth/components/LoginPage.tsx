import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import GlassCard from '../../../shared/components/ui/GlassCard';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'var(--bg-main)' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold tracking-tight mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <span style={{ color: 'var(--accent)' }}>Forecast</span>AI
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            AI-powered demand forecasting platform
          </p>
        </div>

        <GlassCard>
          <h2
            className="text-xl font-semibold mb-6"
            style={{ color: 'var(--text-primary)' }}
          >
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                style={{ color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 500 }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                style={{ color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 500 }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{
                  background: 'rgba(178, 59, 59, 0.08)',
                  color: 'var(--error)',
                  border: '1px solid rgba(178, 59, 59, 0.15)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full mt-2 flex items-center justify-center gap-2"
              style={{
                background: loading ? 'var(--accent-light)' : 'var(--accent)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '999px',
                padding: '14px 32px',
                fontWeight: 600,
                fontSize: '14px',
                opacity: loading || !email || !password ? 0.7 : 1,
                cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              {loading ? (
                <>
                  <div
                    className="spinner"
                    style={{
                      width: 18,
                      height: 18,
                      borderWidth: 2,
                      borderColor: 'rgba(255,255,255,0.3)',
                      borderTopColor: '#FFFFFF',
                    }}
                  />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p
            className="text-center mt-6 text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              style={{
                color: 'var(--accent)',
                fontWeight: 600,
                textDecoration: 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'inherit',
                padding: 0,
              }}
            >
              Create one
            </button>
          </p>

          <div
            className="mt-4 rounded-xl px-4 py-3 text-center"
            style={{
              background: 'rgba(99, 102, 241, 0.06)',
              border: '1px solid rgba(99, 102, 241, 0.15)',
            }}
          >
            <p style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '6px' }}>
              Demo credentials
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontFamily: 'monospace' }}>
              <button
                onClick={() => { setEmail('admin@forecastai.com'); setPassword('admin123'); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)',
                  fontWeight: 600, fontSize: '13px', fontFamily: 'monospace', padding: 0,
                }}
              >
                admin@forecastai.com
              </button>
              {' / '}
              <span style={{ color: 'var(--text-secondary)' }}>admin123</span>
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>
              Click email to auto-fill
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
