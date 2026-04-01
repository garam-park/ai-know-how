import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function ProjectCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post<{ project: { id: number } }>('/projects', {
        ...form,
        budget: form.budget ? Number(form.budget) : undefined,
      });
      navigate(`/projects/${res.result.project.id}`);
    } catch (err: any) {
      setError(err?.message || '프로젝트 생성에 실패했습니다.');
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const inputStyle = { width: '100%', padding: 8, border: '1px solid #cbd5e0', borderRadius: 4, boxSizing: 'border-box' as const };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>새 프로젝트 생성</h1>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>사업명 *</label>
          <input value={form.name} onChange={set('name')} required style={inputStyle} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>사업코드</label>
          <input value={form.code} onChange={set('code')} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>설명</label>
          <textarea value={form.description} onChange={set('description')} rows={3}
            style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>시작일 *</label>
            <input type="date" value={form.startDate} onChange={set('startDate')} required style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>종료일 *</label>
            <input type="date" value={form.endDate} onChange={set('endDate')} required style={inputStyle} />
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>예산 (원)</label>
          <input type="number" value={form.budget} onChange={set('budget')} style={inputStyle} />
        </div>
        {error && <p style={{ color: '#e53e3e', marginBottom: 12, fontSize: 14 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" style={{ padding: '10px 24px', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer' }}>
            생성
          </button>
          <button type="button" onClick={() => navigate('/projects')} style={{ padding: '10px 24px', background: '#e2e8f0', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
