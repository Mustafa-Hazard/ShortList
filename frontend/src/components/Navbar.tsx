import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Layers } from 'lucide-react';
import { useAuthStore, Role } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { NotificationBell } from './NotificationBell';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const { connectSocket, disconnectSocket } = useNotificationStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      connectSocket(user.id);
    }
    return () => {
      disconnectSocket();
    };
  }, [user?.id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case Role.CANDIDATE:
        return '/candidate';
      case Role.RECRUITER:
        return '/recruiter';
      case Role.HIRING_MANAGER:
        return '/hiring-manager';
      case Role.ADMIN:
        return '/admin';
      default:
        return '/login';
    }
  };

  return (
    <header
      style={{
        borderBottom: '1px solid var(--line-grey)',
        background: '#0B131C',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          to={getDashboardPath()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontFamily: 'var(--font-display)',
            fontSize: '1.2rem',
            fontWeight: 800,
            color: 'var(--fg-main)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          <div
            style={{
              border: '1px solid var(--accent-brass)',
              background: 'rgba(201, 122, 61, 0.15)',
              padding: '0.3rem 0.5rem',
              borderRadius: '2px',
              color: 'var(--accent-brass)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
            }}
          >
            [TB-01]
          </div>
          TALENTBRIDGE
        </Link>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              to={getDashboardPath()}
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.4rem' }}
            >
              <Layers size={14} /> Control Board
            </Link>

            <NotificationBell />

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-main)' }}>
                  {user.firstName} {user.lastName}
                </span>
                <span className="tag-mono tag-brass" style={{ fontSize: '0.62rem', alignSelf: 'flex-end' }}>
                  {user.role.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleLogout}
                title="Logout"
                style={{ padding: '0.45rem' }}
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
