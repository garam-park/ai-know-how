import { useEffect, useState } from 'react';
import { useParams, Link, Outlet } from 'react-router-dom';
import { api } from '../services/api';

interface ProjectDetail {
  id: number;
  name: string;
  code?: string;
  description?: string;
  startDate: string;
  endDate: string;
  budget?: number;
}

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    api.get<{ project: ProjectDetail }>(`/projects/${projectId}`)
      .then((res) => setProject(res.result.project))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div>로딩 중...</div>;
  if (!project) return <div>프로젝트를 찾을 수 없습니다.</div>;

  const tabs = [
    { label: '대시보드', path: `/projects/${projectId}` },
    { label: 'WBS', path: `/projects/${projectId}/wbs` },
    { label: '컨소시엄', path: `/projects/${projectId}/companies` },
    { label: '멤버', path: `/projects/${projectId}/members` },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>{project.name}</h1>
        {project.code && <span style={{ color: '#718096', fontSize: 14 }}>{project.code}</span>}
      </div>
      <nav style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #e2e8f0' }}>
        {tabs.map((tab) => (
          <Link key={tab.path} to={tab.path}
            style={{ padding: '8px 16px', textDecoration: 'none', color: '#4a5568', borderBottom: '2px solid transparent', marginBottom: -2 }}>
            {tab.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
