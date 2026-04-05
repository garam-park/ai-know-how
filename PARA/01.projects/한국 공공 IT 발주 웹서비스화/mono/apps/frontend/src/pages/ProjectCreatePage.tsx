import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface Company {
  id: number;
  name: string;
}

export default function ProjectCreatePage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
    companyId: '',
  });
  const [error, setError] = useState('');

  const { data: companiesData, isLoading } = useQuery({
    queryKey: ['companies', 'all'], // 단순화를 위해 keyword 없는 전체 리스트 가정 (실제로는 limit 조정 필요)
    queryFn: () => api.get<{ companies: Company[] }>('/companies?limit=100'),
  });

  const companies = companiesData?.result.companies ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!form.companyId) {
      setError('소속 회사를 선택해주세요.');
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        description: form.description.trim() || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        budget: form.budget ? Number(form.budget) : undefined,
        companyId: Number(form.companyId),
      };

      const res = await api.post<{ project: { id: number } }>('/projects', payload);
      addToast('success', '프로젝트가 성공적으로 생성되었습니다.');
      navigate(`/projects/${res.result.project.id}`);
    } catch (err: any) {
      setError(err?.message || '프로젝트 생성에 실패했습니다.');
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const inputStyle = { width: '100%', padding: 8, border: '1px solid #cbd5e0', borderRadius: 4, boxSizing: 'border-box' as const, fontSize: 14 };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 40 }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>새 프로젝트 생성</h1>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>사업명 <span style={{ color: '#e53e3e' }}>*</span></label>
          <input value={form.name} onChange={set('name')} required style={inputStyle} placeholder="진행할 프로젝트의 이름을 입력하세요" />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>소속 회사 (주관사) <span style={{ color: '#e53e3e' }}>*</span></label>
          <select value={form.companyId} onChange={set('companyId')} required style={{ ...inputStyle, background: '#fff' }} disabled={isLoading}>
            <option value="" disabled>회사를 선택하세요</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {companies.length === 0 && !isLoading && (
            <p style={{ fontSize: 13, color: '#e53e3e', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              ⚠️ 등록된 회사가 없습니다. <Link to="/companies" style={{ color: '#2b6cb0', fontWeight: 600 }}>회사 목록 관리</Link>에서 회사를 먼저 등록해 주세요.
            </p>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>사업코드</label>
          <input value={form.code} onChange={set('code')} style={inputStyle} placeholder="내부 관리용 코드가 있다면 입력하세요 (선택)" />
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>설명</label>
          <textarea value={form.description} onChange={set('description')} rows={3}
            style={{ ...inputStyle, resize: 'vertical' }} placeholder="프로젝트에 대한 간단한 설명을 작성하세요 (선택)" />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>시작일 <span style={{ color: '#e53e3e' }}>*</span></label>
            <input type="date" value={form.startDate} onChange={set('startDate')} required style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>종료일 <span style={{ color: '#e53e3e' }}>*</span></label>
            <input type="date" value={form.endDate} onChange={set('endDate')} required style={inputStyle} />
          </div>
        </div>
        
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>예산 (원)</label>
          <input type="number" value={form.budget} onChange={set('budget')} style={inputStyle} placeholder="숫자만 입력 (선택)" />
        </div>
        
        {error && <p style={{ color: '#e53e3e', marginBottom: 16, fontSize: 14, background: '#fff5f5', padding: 8, borderRadius: 4 }}>{error}</p>}
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" disabled={!form.companyId || form.startDate > form.endDate}
            style={{ padding: '10px 24px', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, cursor: (!form.companyId || form.startDate > form.endDate) ? 'not-allowed' : 'pointer', opacity: (!form.companyId || form.startDate > form.endDate) ? 0.6 : 1 }}>
            생성
          </button>
          <button type="button" onClick={() => navigate('/projects')} style={{ padding: '10px 24px', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
