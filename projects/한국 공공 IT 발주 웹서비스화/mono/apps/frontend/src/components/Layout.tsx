import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#1a365d', color: '#fff', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>
              공공IT 수주관리
            </Link>
            <nav style={{ display: 'flex', gap: 16 }}>
              <Link to="/projects" style={{ color: '#e2e8f0', textDecoration: 'none' }}>프로젝트</Link>
              <Link to="/companies" style={{ color: '#e2e8f0', textDecoration: 'none' }}>회사</Link>
            </nav>
          </div>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#e2e8f0', fontSize: 14 }}>{user.name}</span>
              <button
                onClick={handleLogout}
                style={{ background: 'transparent', border: '1px solid #e2e8f0', color: '#e2e8f0', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </header>
      <main style={{ flex: 1, padding: 24, background: '#f7fafc' }}>
        <Outlet />
      </main>
    </div>
  );
}
