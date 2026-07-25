import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, UserCheck, ShieldCheck, Briefcase, Lock } from 'lucide-react';
import { useAuthStore, Role } from '../store/useAuthStore';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      if (user) {
        navigate(getRoleRoute(user.role));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication error: Invalid credentials');
    }
  };

  const handleDemoLogin = async (roleEmail: string) => {
    setEmail(roleEmail);
    setError('');
    try {
      await login(roleEmail, 'Password123!');
      const user = useAuthStore.getState().user;
      if (user) {
        navigate(getRoleRoute(user.role));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Demo authentication failed');
    }
  };

  const getRoleRoute = (role: Role) => {
    switch (role) {
      case Role.CANDIDATE:
        return '/candidate';
      case Role.RECRUITER:
        return '/recruiter';
      case Role.HIRING_MANAGER:
        return '/hiring-manager';
      case Role.ADMIN:
        return '/admin';
      default:
        return '/candidate';
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <div
        className="blueprint-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
        }}
      >
        <div className="blueprint-panel-header">
          <span className="mono-tag tag-brass">[AUTH-TERMINAL 01]</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--fg-muted)' }}>SECURE PIPELINE ACCESS</span>
        </div>

        <div style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Dispatch Control</h2>
            <p style={{ color: 'var(--fg-muted)', fontSize: '0.8125rem', marginTop: '0.2rem' }}>
              Sign in to manage candidates across ordered stage transit lines.
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '2px',
                background: 'var(--signal-rust-bg)',
                border: '1px solid var(--signal-rust)',
                color: '#d96950',
                fontSize: '0.8125rem',
                fontFamily: 'var(--font-mono)',
                marginBottom: '1.25rem',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">ACCOUNT EMAIL [ID]</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@talentbridge.dev"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">ACCESS KEY [PASSWORD]</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
            >
              <LogIn size={16} />
              {isLoading ? 'AUTHENTICATING...' : 'SIGN IN TO DISPATCH'}
            </button>
          </form>

          <div
            style={{
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--line-grey)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: 'var(--fg-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.75rem',
              }}
            >
              DEMO ROLE QUICK SWITCH:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleDemoLogin('candidate@talentbridge.dev')}
                style={{ fontSize: '0.72rem', justifyContent: 'flex-start' }}
              >
                <UserCheck size={13} color="var(--fg-main)" /> Candidate
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleDemoLogin('recruiter@acme.dev')}
                style={{ fontSize: '0.72rem', justifyContent: 'flex-start' }}
              >
                <Briefcase size={13} color="var(--accent-brass)" /> Recruiter
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleDemoLogin('hm@acme.dev')}
                style={{ fontSize: '0.72rem', justifyContent: 'flex-start' }}
              >
                <Lock size={13} color="#79ab92" /> Hiring Mgr
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleDemoLogin('admin@acme.dev')}
                style={{ fontSize: '0.72rem', justifyContent: 'flex-start' }}
              >
                <ShieldCheck size={13} color="#d96950" /> Admin
              </button>
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--fg-muted)' }}>
            Need new credentials?{' '}
            <Link to="/register" style={{ color: 'var(--accent-brass)', fontWeight: 600 }}>
              Register requisition account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
