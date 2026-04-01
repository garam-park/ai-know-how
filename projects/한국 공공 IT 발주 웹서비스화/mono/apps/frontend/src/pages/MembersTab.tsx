import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import EmptyState from '../components/EmptyState';
import { useToast } from '../contexts/ToastContext';

interface Member {
  id: number;
  inputRate: number;
  user: { id: number; email: string; name: string };
  projectCompany: { company: { id: number; name: string } };
  role: { id: number; name: string };
}

export default function MembersTab() {
  const { projectId } = useParams();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['projects', projectId, 'members'],
    queryFn: () => api.get<{ members: Member[] }>(`/projects/${projectId}/members`),
    enabled: !!projectId,
  });

  const members = data?.result.members ?? [];

  if (isLoading) return <div>로딩 중...</div>;

  if (members.length === 0) {
    return (
      <EmptyState
        icon="👥"
        title="프로젝트 멤버가 없습니다"
        description="이메일로 팀원을 초대하세요. 먼저 컨소시엄 탭에서 소속 회사를 등록해야 합니다."
        action={
          <button 
            onClick={() => addToast('info', '멤버 초대 기능은 준비중입니다.')}
            style={{ padding: '8px 16px', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            멤버 초대
          </button>
        }
      />
    );
  }

  return (
    <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#edf2f7' }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>이름</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>이메일</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>소속</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>역할</th>
            <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>투입률</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} style={{ borderBottom: '1px solid #edf2f7' }}>
              <td style={{ padding: '10px 12px' }}>{m.user.name}</td>
              <td style={{ padding: '10px 12px', color: '#718096' }}>{m.user.email}</td>
              <td style={{ padding: '10px 12px' }}>{m.projectCompany?.company?.name}</td>
              <td style={{ padding: '10px 12px' }}>{m.role?.name}</td>
              <td style={{ 
                padding: '10px 12px', 
                textAlign: 'right', 
                color: m.inputRate > 100 ? '#e53e3e' : 'inherit',
                background: m.inputRate > 100 ? '#fff5f5' : 'transparent',
                fontWeight: m.inputRate > 100 ? 600 : 400
              }}>
                {m.inputRate > 100 && <span title="다른 프로젝트 포함 총 투입률 과다">⚠️ </span>}
                {m.inputRate}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
