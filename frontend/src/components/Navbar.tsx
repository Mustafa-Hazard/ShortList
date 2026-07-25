import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, LogOut, Briefcase, User as UserIcon, Shield, Layers } from 'lucide-react';
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

  const getRoleBadgeClass = (role?: Role) => {
    switch (role) {
      case Role.CANDIDATE:
        return 'badge-primary';
      case Role.RECRUITER:
        return 'badge-ai';
      case Role.HIRING_MANAGER:
        return 'badge-warning';
      case Role.ADMIN:
        return 'badge-danger';
      default:
        return 'badge-primary';
    }
  };

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(11, 15, 25, 0.8)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0.8rem 1.5rem',
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
            fontSize: '1.25rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              padding: '0.35rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={20} color="white" />
          </div>
          TalentBridge
        </Link>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              to={getDashboardPath()}
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.4rem' }}
            >
              {user.role === Role.CANDIDATE && <Briefcase size={14} />}
              {user.role === Role.RECRUITER && <Layers size={14} />}
              {user.role === Role.HIRING_MANAGER && <UserIcon size={14} />}
              {user.role === Role.ADMIN && <Shield size={14} />}
              Dashboard
            </Link>

            <NotificationBell />

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  {user.firstName} {user.lastName}
                </span>
                <span className={`badge ${getRoleBadgeClass(user.role)}`} style={{ fontSize: '0.65rem', alignSelf: 'flex-end' }}>
                  {user.role.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleLogout}
                title="Logout"
                style={{ padding: '0.4rem' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
