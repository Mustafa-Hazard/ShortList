import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Layers, Sun, Moon } from 'lucide-react';
import { useAuthStore, Role } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { NotificationBell } from './NotificationBell';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const { connectSocket, disconnectSocket } = useNotificationStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('tb_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tb_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (user?.id) {
      connectSocket(user.id);
    }
    return () => {
      disconnectSocket();
    };
  }, [user?.id]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

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

  const getLocationBreadcrumb = () => {
    const path = location.pathname;
    if (path.includes('/candidate')) return 'CANDIDATE › DISPATCH';
    if (path.includes('/recruiter')) return 'RECRUITER › CONTROL ROOM';
    if (path.includes('/hiring-manager')) return 'HIRING MANAGER › JUNCTION';
    if (path.includes('/admin')) return 'ADMIN › TELEMETRY';
    return 'DISPATCH TERMINAL';
  };

  return (
    <header
      style={{
        borderBottom: '1px solid var(--line-grey)',
        background: 'var(--bg-panel)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
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
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        {/* Brand Mark & Instrument-Panel Location Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
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
              textDecoration: 'none',
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
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--fg-muted)',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              › <span style={{ color: 'var(--accent-brass)', fontWeight: 600 }}>{getLocationBreadcrumb()}</span>
            </span>
          )}
        </div>

        {/* Right Section: Theme Toggle, Notifications, Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Ambient Lighting Theme Toggle */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={toggleTheme}
            title="Toggle Ambient Lighting Theme"
            style={{ gap: '0.35rem', fontSize: '0.7rem' }}
          >
            {theme === 'dark' ? <Sun size={13} color="var(--accent-brass)" /> : <Moon size={13} color="var(--accent-brass)" />}
            {theme === 'dark' ? 'DAYLIGHT' : 'LAMPLIGHT'}
          </button>

          {user && (
            <>
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}
