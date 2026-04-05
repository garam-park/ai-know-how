import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';

interface DashboardData {
  project: { name: string; daysLeft: number };
  progress: { overall: number; byCompany: { company: { name: string }; progress: number }[] };
  members: { total: number; byCompany: { company: { name: string }; count: number }[] };
  wbs: { total: number; completed: number; inProgress: number; notStarted: number };
}

export default function DashboardTab() {
  const { projectId } = useParams();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (!projectId) return;
    api.get<DashboardData>(`/projects/${projectId}/dashboard`)
      .then((res) => setData(res.result))
      .catch(() => {});
  }, [projectId]);

  if (!data) return <div>로딩 중...</div>;

  const card = { background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div style={card}>
        <h3 style={{ margin: '0 0 12px' }}>전체 진척률</h3>
        <div style={{ fontSize: 36, fontWeight: 700, color: '#2b6cb0' }}>{data.progress.overall}%</div>
        <div style={{ marginTop: 8, fontSize: 14, color: '#718096' }}>
          {data.project.daysLeft >= 0 ? `D-${data.project.daysLeft}` : `D+${Math.abs(data.project.daysLeft)}`}
        </div>
      </div>
      <div style={card}>
        <h3 style={{ margin: '0 0 12px' }}>WBS 현황</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14 }}>
          <span>전체: {data.wbs.total}건</span>
          <span style={{ color: '#38a169' }}>완료: {data.wbs.completed}건</span>
          <span style={{ color: '#d69e2e' }}>진행: {data.wbs.inProgress}건</span>
          <span style={{ color: '#a0aec0' }}>미착수: {data.wbs.notStarted}건</span>
        </div>
      </div>
      <div style={card}>
        <h3 style={{ margin: '0 0 12px' }}>회사별 진척률</h3>
        {data.progress.byCompany.map((c) => (
          <div key={c.company.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #edf2f7' }}>
            <span>{c.company.name}</span>
            <span style={{ fontWeight: 600 }}>{c.progress}%</span>
          </div>
        ))}
      </div>
      <div style={card}>
        <h3 style={{ margin: '0 0 12px' }}>멤버 ({data.members.total}명)</h3>
        {data.members.byCompany.map((c) => (
          <div key={c.company.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #edf2f7' }}>
            <span>{c.company.name}</span>
            <span>{c.count}명</span>
          </div>
        ))}
      </div>
    </div>
  );
}
