import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAgencyAuth } from '../../contexts/AgencyAuthContext';

const AgencyLoginPage: React.FC = () => {
  const { login } = useAgencyAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordChanged = searchParams.get('passwordChanged') === '1';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/agency', { replace: true });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-admin-base px-4">
      <div className="w-full max-w-md rounded-2xl border border-admin-border bg-admin-surface p-6 shadow-xl">
        <h1 className="text-xl font-bold text-white mb-1">Agency sign in</h1>
        <p className="text-sm text-zinc-500 mb-6">Agency portal — manage hosts and referrals.</p>
        {passwordChanged && (
          <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200 mb-4">
            Password updated. Sign in with your new password.
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-admin-elevated border border-admin-border px-3 py-2.5 text-sm text-white"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-admin-elevated border border-admin-border px-3 py-2.5 text-sm text-white"
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-admin-accent text-admin-base font-semibold py-3 text-sm disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AgencyLoginPage;
