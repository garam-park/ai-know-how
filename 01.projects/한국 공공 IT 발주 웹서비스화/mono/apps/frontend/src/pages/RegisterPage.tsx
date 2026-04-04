import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', name: '', tel: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      navigate('/login');
    } catch (err: any) {
      setError(err?.message || '회원가입에 실패했습니다.');
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 32, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>회원가입</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>이메일</label>
          <input type="email" value={form.email} onChange={set('email')} required
            style={{ width: '100%', padding: 8, border: '1px solid #cbd5e0', borderRadius: 4, boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>비밀번호</label>
          <input type="password" value={form.password} onChange={set('password')} required minLength={8}
            style={{ width: '100%', padding: 8, border: '1px solid #cbd5e0', borderRadius: 4, boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>이름</label>
          <input type="text" value={form.name} onChange={set('name')} required
            style={{ width: '100%', padding: 8, border: '1px solid #cbd5e0', borderRadius: 4, boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>전화번호 (선택)</label>
          <input type="text" value={form.tel} onChange={set('tel')}
            style={{ width: '100%', padding: 8, border: '1px solid #cbd5e0', borderRadius: 4, boxSizing: 'border-box' }} />
        </div>
        {error && <p style={{ color: '#e53e3e', marginBottom: 12, fontSize: 14 }}>{error}</p>}
        <button type="submit" style={{ width: '100%', padding: 10, background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer' }}>
          가입하기
        </button>
      </form>
      <p style={{ marginTop: 16, textAlign: 'center', fontSize: 14 }}>
        이미 계정이 있으신가요? <Link to="/login" style={{ color: '#2b6cb0' }}>로그인</Link>
      </p>
    </div>
  );
}
