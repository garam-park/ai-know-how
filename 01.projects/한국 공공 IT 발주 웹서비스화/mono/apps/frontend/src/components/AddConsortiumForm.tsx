import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface Company {
  id: number;
  name: string;
}

interface CompanyNode {
  id: number;
  role: string;
  company: { id: number; name: string; bizNo?: string };
  children: CompanyNode[];
}

interface Props {
  projectId: string;
  existingNodes: CompanyNode[];
  onAdded: () => void;
}

export default function AddConsortiumForm({ projectId, existingNodes, onAdded }: Props) {
  const [companyId, setCompanyId] = useState('');
  const [role, setRole] = useState<'PARTNER' | 'SUB'>('PARTNER');
  const [parentId, setParentId] = useState('');
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // 모든 회사 목록 로드
  const { data, isLoading } = useQuery({
    queryKey: ['companies', 'all'],
    queryFn: () => api.get<{ companies: Company[] }>('/companies?limit=1000'),
  });

  const allCompanies = data?.result.companies ?? [];

  // 트리를 1차원 배열로 펼치기 (중복 검사 및 상위사 선택용)
  const flattenNodes = (nodes: CompanyNode[]): CompanyNode[] => {
    return nodes.reduce<CompanyNode[]>((acc, node) => [...acc, node, ...flattenNodes(node.children)], []);
  };

  const flatExisting = flattenNodes(existingNodes);
  const existingCompanyIds = new Set(flatExisting.map((n) => n.company.id));

  // 사용 가능한(아직 프로젝트에 참여하지 않은) 회사만 필터링
  const availableCompanies = allCompanies.filter((c) => !existingCompanyIds.has(c.id));

  const addMutation = useMutation({
    mutationFn: (payload: any) => api.post(`/projects/${projectId}/companies`, payload),
    onSuccess: () => {
      addToast('success', '컨소시엄사가 추가되었습니다.');
      setCompanyId('');
      setRole('PARTNER');
      setParentId('');
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'companies'] });
      onAdded();
    },
    onError: (err: any) => {
      addToast('error', err?.message || '추가에 실패했습니다.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    addMutation.mutate({
      companyId: Number(companyId),
      role,
      parentId: parentId ? Number(parentId) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#f7fafc', padding: 16, borderRadius: 8, marginBottom: 24, border: '1px solid #e2e8f0' }}>
      <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 16 }}>새 참여사 추가</h3>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>회사명 <span style={{ color: '#e53e3e' }}>*</span></label>
          <select 
            value={companyId} 
            onChange={(e) => setCompanyId(e.target.value)} 
            required 
            disabled={isLoading || addMutation.isPending}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: 4, background: '#fff' }}
          >
            <option value="" disabled>회사를 선택하세요</option>
            {availableCompanies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ width: 150 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>역할 <span style={{ color: '#e53e3e' }}>*</span></label>
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value as any)} 
            disabled={addMutation.isPending}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: 4, background: '#fff' }}
          >
            <option value="PARTNER">참여사 (PARTNER)</option>
            <option value="SUB">하청사 (SUB)</option>
          </select>
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>상위사 (선택)</label>
          <select 
            value={parentId} 
            onChange={(e) => setParentId(e.target.value)} 
            disabled={addMutation.isPending || flatExisting.length === 0}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: 4, background: '#fff' }}
          >
            <option value="">(최상위 루트)</option>
            {flatExisting.map((node) => (
              <option key={node.id} value={node.company.id}>
                [{node.role}] {node.company.name}
              </option>
            ))}
          </select>
        </div>

        <button 
          type="submit" 
          disabled={!companyId || addMutation.isPending}
          style={{ 
            padding: '8px 24px', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: 4, 
            cursor: (!companyId || addMutation.isPending) ? 'not-allowed' : 'pointer', height: 35, fontWeight: 600,
            opacity: (!companyId || addMutation.isPending) ? 0.7 : 1
          }}
        >
          {addMutation.isPending ? '추가 중...' : '추가'}
        </button>
      </div>
      
      {availableCompanies.length === 0 && !isLoading && (
        <p style={{ margin: '12px 0 0 0', fontSize: 13, color: '#e53e3e' }}>추가할 수 있는 등록된 회사가 없습니다.</p>
      )}
    </form>
  );
}
