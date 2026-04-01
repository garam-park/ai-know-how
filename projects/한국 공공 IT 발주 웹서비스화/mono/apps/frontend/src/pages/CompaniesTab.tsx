import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';

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
  const [companies, setCompanies] = useState<CompanyNode[]>([]);

  useEffect(() => {
    if (!projectId) return;
    api.get<{ companies: CompanyNode[] }>(`/projects/${projectId}/companies`)
      .then((res) => setCompanies(res.result.companies))
      .catch(() => {});
  }, [projectId]);

  return (
    <div>
      <h2 style={{ fontSize: 20, marginBottom: 16 }}>컨소시엄 구조</h2>
      {companies.length === 0 ? (
        <p style={{ color: '#718096' }}>등록된 컨소시엄사가 없습니다.</p>
      ) : (
        companies.map((c) => <CompanyTree key={c.id} node={c} />)
      )}
    </div>
  );
}
