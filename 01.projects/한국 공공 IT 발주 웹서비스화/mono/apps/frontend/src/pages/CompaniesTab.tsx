import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import EmptyState from '../components/EmptyState';
import { useToast } from '../contexts/ToastContext';
import AddConsortiumForm from '../components/AddConsortiumForm';

interface CompanyNode {
  id: number;
  role: string;
  company: { id: number; name: string; bizNo?: string };
  children: CompanyNode[];
}

function CompanyTree({ node, depth = 0, onDelete }: { node: CompanyNode; depth?: number; onDelete: (companyId: number) => void }) {
  const roleLabel: Record<string, string> = { PRIME: '주관사', PARTNER: '참여사', SUB: '하청', OWNER: '발주처' };
  const roleColor: Record<string, string> = { PRIME: '#2b6cb0', PARTNER: '#38a169', SUB: '#d69e2e', OWNER: '#e53e3e' };

  return (
    <div style={{ marginLeft: depth * 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, marginBottom: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <span style={{ background: roleColor[node.role] || '#718096', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
          {roleLabel[node.role] || node.role}
        </span>
        <span style={{ fontWeight: 600 }}>{node.company.name}</span>
        {node.company.bizNo && <span style={{ color: '#718096', fontSize: 13 }}>({node.company.bizNo})</span>}
        
        {node.role !== 'PRIME' && (
          <button 
            onClick={() => onDelete(node.id)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: 13, padding: '4px 8px', borderRadius: 4 }}
            aria-label="삭제"
          >
            삭제
          </button>
        )}
      </div>
      {node.children.map((child) => (
        <CompanyTree key={child.id} node={child} depth={depth + 1} onDelete={onDelete} />
      ))}
    </div>
  );
}

export default function CompaniesTab() {
  const { projectId } = useParams();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['projects', projectId, 'companies'],
    queryFn: () => api.get<{ companies: CompanyNode[] }>(`/projects/${projectId}/companies`),
    enabled: !!projectId,
  });

  const companies = data?.result.companies ?? [];

  const deleteMutation = useMutation({
    mutationFn: (projectCompanyId: number) => api.delete(`/projects/${projectId}/companies/${projectCompanyId}`),
    onSuccess: () => {
      addToast('success', '컨소시엄사가 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'companies'] });
    },
    onError: (err: any) => {
      addToast('error', err?.message || '삭제에 실패했습니다.');
    },
  });

  const handleDelete = (projectCompanyId: number) => {
    if (!window.confirm('해당 컨소시엄사를 삭제하시겠습니까? 하위 회사와 소속 멤버도 함께 제거됩니다.')) return;
    deleteMutation.mutate(projectCompanyId);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, margin: 0 }}>컨소시엄 구조</h2>
      </div>

      <AddConsortiumForm 
        projectId={projectId!} 
        existingNodes={companies} 
        onAdded={() => {}} 
      />
      
      {isLoading ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#718096' }}>로딩 중...</div>
      ) : companies.length === 0 ? (
        <EmptyState
          icon="🏢"
          title="등록된 참여사가 없습니다"
          description="프로젝트에 참여할 회사를 추가하세요. 참여사를 추가해야 멤버를 초대할 수 있습니다."
        />
      ) : (
        companies.map((c) => <CompanyTree key={c.id} node={c} onDelete={handleDelete} />)
      )}
    </div>
  );
}
