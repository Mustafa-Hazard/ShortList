import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, User, Briefcase, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export function RegisterPage() {
  const [accountType, setAccountType] = useState<'candidate' | 'recruiter'>('candidate');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');

  const { registerCandidate, registerRecruiter, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (accountType === 'candidate') {
        await registerCandidate({ email, password, firstName, lastName });
        navigate('/candidate');
      } else {
        await registerRecruiter({ email, password, firstName, lastName, companyName });
        navigate('/recruiter');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
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
          maxWidth: '500px',
          padding: '2.5rem',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
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
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Create an Account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.3rem' }}>
            Join TalentBridge AI Recruitment Portal
          </p>
        </div>

        {/* Account Type Toggle */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '0.3rem',
            borderRadius: '10px',
          }}
        >
          <button
            type="button"
            className={`btn ${accountType === 'candidate' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setAccountType('candidate')}
            style={{ fontSize: '0.8rem', gap: '0.4rem' }}
          >
            <User size={16} /> Candidate
          </button>
          <button
            type="button"
            className={`btn ${accountType === 'recruiter' ? 'btn-ai' : 'btn-secondary'}`}
            onClick={() => setAccountType('recruiter')}
            style={{ fontSize: '0.8rem', gap: '0.4rem' }}
          >
            <Briefcase size={16} /> Recruiter
          </button>
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

        <form onSubmit={handleRegister}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                className="form-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane.doe@example.com"
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
              placeholder="Password123!"
              required
            />
          </div>

          {accountType === 'recruiter' && (
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                className="form-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Corporation"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className={`btn ${accountType === 'recruiter' ? 'btn-ai' : 'btn-primary'}`}
            disabled={isLoading}
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
          >
            <UserPlus size={18} />
            {isLoading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
