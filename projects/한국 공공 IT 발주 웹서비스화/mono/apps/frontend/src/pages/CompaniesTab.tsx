import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import EmptyState from '../components/EmptyState';
import { useToast } from '../contexts/ToastContext';

interface CompanyNode {
  id: number;
  role: string;
  company: { id: number; name: string; bizNo?: string };
  children: CompanyNode[];
}

function CompanyTree({ node, depth = 0 }: { node: CompanyNode; depth?: number }) {
  const roleLabel: Record<string, string> = { PRIME: '주관사', PARTNER: '참여사', SUB: '하청', OWNER: '발주처' };
  const roleColor: Record<string, string> = { PRIME: '#2b6cb0', PARTNER: '#38a169', SUB: '#d69e2e', OWNER: '#e53e3e' };

  return (
    <div style={{ marginLeft: depth * 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, marginBottom: 8 }}>
        <span style={{ background: roleColor[node.role] || '#718096', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
          {roleLabel[node.role] || node.role}
        </span>
        <span style={{ fontWeight: 600 }}>{node.company.name}</span>
        {node.company.bizNo && <span style={{ color: '#718096', fontSize: 13 }}>({node.company.bizNo})</span>}
      </div>
      {node.children.map((child) => (
        <CompanyTree key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function CompaniesTab() {
  const { projectId } = useParams();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['projects', projectId, 'companies'],
    queryFn: () => api.get<{ companies: CompanyNode[] }>(`/projects/${projectId}/companies`),
    enabled: !!projectId,
  });

  const companies = data?.result.companies ?? [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, margin: 0 }}>컨소시엄 구조</h2>
      </div>
      
      {isLoading ? (
        <div>로딩 중...</div>
      ) : companies.length === 0 ? (
        <EmptyState
          icon="🏢"
          title="등록된 참여사가 없습니다"
          description="프로젝트에 참여할 회사를 추가하세요. 참여사를 추가해야 멤버를 초대할 수 있습니다."
          action={
            <button 
              onClick={() => addToast('info', '컨소시엄사 추가 기능은 준비중입니다.')}
              style={{ padding: '8px 16px', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
            >
              참여사 추가
            </button>
          }
        />
      ) : (
        companies.map((c) => <CompanyTree key={c.id} node={c} />)
      )}
    </div>
  );
}
