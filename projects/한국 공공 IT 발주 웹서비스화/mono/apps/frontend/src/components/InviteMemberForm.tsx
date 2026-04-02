import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface ProjectCompany { id: number; company: { id: number; name: string }; }

// 임시 역할 모델 (실제 백엔드 API에 맞게 수정 필요)
const FALLBACK_ROLES = [
  { id: 1, name: 'PM' },
  { id: 2, name: 'PL' },
  { id: 3, name: 'Developer' },
  { id: 4, name: 'Designer' },
  { id: 5, name: 'QA' },
];

interface Props {
  projectId: string;
  onInvited: () => void;
  onCancel: () => void;
}

export default function InviteMemberForm({ projectId, onInvited, onCancel }: Props) {
  const [email, setEmail] = useState('');
  const [projectCompanyId, setProjectCompanyId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [inputRate, setInputRate] = useState('100');
  const [error, setError] = useState('');
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data: companiesData, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['projects', projectId, 'companies'],
    queryFn: () => api.get<{ companies: any[] }>(`/projects/${projectId}/companies`),
  });

  const companies: ProjectCompany[] = (() => {
    if (!companiesData?.result?.companies) return [];
    const flatten = (nodes: any[]): ProjectCompany[] =>
      nodes.flatMap((n) => [{ id: n.id, company: n.company }, ...flatten(n.children || [])]);
    return flatten(companiesData.result.companies);
  })();

  const inviteMutation = useMutation({
    mutationFn: (payload: any) => api.post(`/projects/${projectId}/members`, payload),
    onSuccess: () => {
      addToast('success', '멤버 초대가 완료되었습니다.');
      setEmail('');
      setProjectCompanyId('');
      setRoleId('');
      setInputRate('100');
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'members'] });
      onInvited();
    },
    onError: (err: any) => {
      setError(err?.message || '멤버 초대에 실패했습니다. 이메일과 권한을 확인해주세요.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !projectCompanyId || !roleId || !inputRate) {
      setError('모든 항목을 입력해주세요.');
      return;
    }

    const rate = Number(inputRate);
    if (isNaN(rate) || rate <= 0) {
      setError('적절한 투입률 숫자를 입력해주세요.');
      return;
    }

    inviteMutation.mutate({
      email: email.trim(),
      projectCompanyId: Number(projectCompanyId),
      roleId: Number(roleId),
      inputRate: rate,
    });
  };

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: 4, boxSizing: 'border-box' as const };

  return (
    <div style={{ background: '#f7fafc', padding: 20, borderRadius: 8, marginBottom: 24, border: '1px solid #e2e8f0' }}>
      <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 16 }}>새 멤버 초대</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>초대할 이메일 <span style={{ color: '#e53e3e' }}>*</span></label>
            <input 
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} 
              required placeholder="member@example.com" disabled={inviteMutation.isPending}
              style={inputStyle} 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>소속 컨소시엄사 <span style={{ color: '#e53e3e' }}>*</span></label>
            <select 
              value={projectCompanyId} onChange={(e) => setProjectCompanyId(e.target.value)} 
              required disabled={isLoadingCompanies || inviteMutation.isPending}
              style={{ ...inputStyle, background: '#fff' }}
            >
              <option value="" disabled>회사를 선택하세요</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.company.name}</option>
              ))}
            </select>
            {companies.length === 0 && !isLoadingCompanies && (
              <div style={{ fontSize: 11, color: '#e53e3e', marginTop: 4 }}>
                먼저 컨소시엄 탭에서 회사를 등록하세요.
              </div>
            )}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>역할군 <span style={{ color: '#e53e3e' }}>*</span></label>
            <select 
              value={roleId} onChange={(e) => setRoleId(e.target.value)} 
              required disabled={inviteMutation.isPending}
              style={{ ...inputStyle, background: '#fff' }}
            >
              <option value="" disabled>역할을 선택하세요</option>
              {FALLBACK_ROLES.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>초기 투입률 (%) <span style={{ color: '#e53e3e' }}>*</span></label>
            <input 
              type="number" value={inputRate} onChange={(e) => setInputRate(e.target.value)} 
              required min="1" disabled={inviteMutation.isPending}
              style={inputStyle} 
            />
          </div>
        </div>

        {error && <div style={{ color: '#e53e3e', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start' }}>
          <button 
            type="submit" disabled={inviteMutation.isPending || companies.length === 0}
            style={{ 
              padding: '8px 24px', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: 4, 
              cursor: (inviteMutation.isPending || companies.length === 0) ? 'not-allowed' : 'pointer', fontWeight: 600,
              opacity: (inviteMutation.isPending || companies.length === 0) ? 0.7 : 1
            }}
          >
            {inviteMutation.isPending ? '초대 중...' : '초대 발송'}
          </button>
          <button 
            type="button" onClick={onCancel} disabled={inviteMutation.isPending}
            style={{ padding: '8px 16px', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
