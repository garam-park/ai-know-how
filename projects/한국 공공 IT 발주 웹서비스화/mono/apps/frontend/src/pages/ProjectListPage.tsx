import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

interface ProjectSummary {
  id: number;
  name: string;
  code?: string;
  startDate: string;
  endDate: string;
  daysLeft: number;
  myRole: string;
  myCompany: string;
}

export default function ProjectListPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ projects: ProjectSummary[]; totalCount: number }>('/projects')
      .then((res) => setProjects(res.result.projects))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>로딩 중...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24 }}>프로젝트 목록</h1>
        <Link to="/projects/new" style={{ padding: '8px 16px', background: '#2b6cb0', color: '#fff', textDecoration: 'none', borderRadius: 4 }}>
          새 프로젝트
        </Link>
      </div>
      {projects.length === 0 ? (
        <p style={{ color: '#718096' }}>참여 중인 프로젝트가 없습니다.</p>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 18 }}>{p.name}</h3>
                  <span style={{ color: p.daysLeft < 0 ? '#e53e3e' : '#718096', fontSize: 14 }}>
                    {p.daysLeft >= 0 ? `D-${p.daysLeft}` : `D+${Math.abs(p.daysLeft)}`}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 14, color: '#4a5568' }}>
                  {p.code && <span>코드: {p.code}</span>}
                  <span>역할: {p.myRole}</span>
                  <span>소속: {p.myCompany}</span>
                  <span>{new Date(p.startDate).toLocaleDateString()} ~ {new Date(p.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
