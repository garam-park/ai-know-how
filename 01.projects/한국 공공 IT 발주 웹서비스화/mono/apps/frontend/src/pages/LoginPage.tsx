import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/projects');
    } catch (err: any) {
      setError(err?.message || '로그인에 실패했습니다.');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 32, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>로그인</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>이메일</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            style={{ width: '100%', padding: 8, border: '1px solid #cbd5e0', borderRadius: 4, boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>비밀번호</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            style={{ width: '100%', padding: 8, border: '1px solid #cbd5e0', borderRadius: 4, boxSizing: 'border-box' }} />
        </div>
        {error && <p style={{ color: '#e53e3e', marginBottom: 12, fontSize: 14 }}>{error}</p>}
        <button type="submit" style={{ width: '100%', padding: 10, background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer' }}>
          로그인
        </button>
      </form>
      <p style={{ marginTop: 16, textAlign: 'center', fontSize: 14 }}>
        계정이 없으신가요? <Link to="/register" style={{ color: '#2b6cb0' }}>회원가입</Link>
      </p>
    </div>
  );
}
