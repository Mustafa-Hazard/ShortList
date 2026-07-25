import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Briefcase, UserPlus } from 'lucide-react';
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
          maxWidth: '500px',
        }}
      >
        <div className="blueprint-panel-header">
          <span className="mono-tag tag-brass">[REGISTER 01]</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--fg-muted)' }}>NEW OPERATOR MANIFEST</span>
        </div>

        <div style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Account Registration</h2>
            <p style={{ color: 'var(--fg-muted)', fontSize: '0.8125rem', marginTop: '0.2rem' }}>
              Register candidate or recruiter access to TalentBridge transit line
            </p>
          </div>

          {/* Account Type Toggle */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              marginBottom: '1.5rem',
              background: '#0B131C',
              padding: '0.25rem',
              border: '1px solid var(--line-grey)',
            }}
          >
            <button
              type="button"
              className={`btn ${accountType === 'candidate' ? 'btn-brass' : 'btn-secondary'}`}
              onClick={() => setAccountType('candidate')}
              style={{ fontSize: '0.75rem' }}
            >
              <User size={14} /> Candidate
            </button>
            <button
              type="button"
              className={`btn ${accountType === 'recruiter' ? 'btn-brass' : 'btn-secondary'}`}
              onClick={() => setAccountType('recruiter')}
              style={{ fontSize: '0.75rem' }}
            >
              <Briefcase size={14} /> Recruiter
            </button>
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

          <form onSubmit={handleRegister}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">FIRST NAME</label>
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
                <label className="form-label">LAST NAME</label>
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
              <label className="form-label">EMAIL ADDRESS</label>
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
              <label className="form-label">ACCESS KEY [PASSWORD]</label>
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
                <label className="form-label">COMPANY ORGANIZATION NAME</label>
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
              className="btn btn-brass"
              disabled={isLoading}
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
            >
              <UserPlus size={16} />
              {isLoading ? 'CREATING MANIFEST...' : 'REGISTER ACCOUNT'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--fg-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-brass)', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
