import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';

interface Member {
  id: number;
  inputRate: number;
  user: { id: number; email: string; name: string };
  projectCompany: { company: { id: number; name: string } };
  role: { id: number; name: string };
}

export default function MembersTab() {
  const { projectId } = useParams();
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!projectId) return;
    api.get<{ members: Member[] }>(`/projects/${projectId}/members`)
      .then((res) => setMembers(res.result.members))
      .catch(() => {});
  }, [projectId]);

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
              <td style={{ padding: '10px 12px', textAlign: 'right', color: m.inputRate > 100 ? '#e53e3e' : 'inherit' }}>
                {m.inputRate}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {members.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: '#718096' }}>멤버가 없습니다.</div>
      )}
    </div>
  );
}
