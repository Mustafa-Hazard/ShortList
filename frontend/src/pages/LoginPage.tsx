import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, LogIn, UserCheck, ShieldCheck, Briefcase, Lock } from 'lucide-react';
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
      setError(err.response?.data?.message || 'Invalid credentials');
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
      setError(err.response?.data?.message || 'Demo login failed');
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
        minHeight: 'calc(100vh - 65px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '2.5rem',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '0.6rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              marginBottom: '1rem',
            }}
          >
            <Sparkles size={28} color="white" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.3rem' }}>
            Sign in to TalentBridge AI Recruitment Portal
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: 'var(--danger-bg)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.8125rem',
              marginBottom: '1.25rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
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
            <LogIn size={18} />
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <p
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.75rem',
              textAlign: 'center',
            }}
          >
            Quick Demo Role Switcher
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleDemoLogin('candidate@talentbridge.dev')}
              style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
            >
              <UserCheck size={14} color="#818cf8" /> Candidate
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleDemoLogin('recruiter@acme.dev')}
              style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
            >
              <Briefcase size={14} color="#c084fc" /> Recruiter
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleDemoLogin('hm@acme.dev')}
              style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
            >
              <Lock size={14} color="#fbbf24" /> Hiring Mgr
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleDemoLogin('admin@acme.dev')}
              style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
            >
              <ShieldCheck size={14} color="#f87171" /> Admin
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
