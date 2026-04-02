import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { useDebounce } from '../hooks/useDebounce';

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

type FilterStatus = 'ALL' | 'ACTIVE' | 'COMPLETED';

export default function ProjectListPage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebounce(keyword, 300);
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  
  const LIMIT = 20;

  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword, filter]);

  const { data, isLoading } = useQuery({
    queryKey: ['projects', page, debouncedKeyword],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      if (debouncedKeyword) params.set('keyword', debouncedKeyword);
      return api.get<{ projects: ProjectSummary[]; totalCount: number }>(`/projects?${params}`);
    },
  });

  const allProjects = data?.result.projects ?? [];
  
  const projects = allProjects.filter((p) => {
    if (filter === 'ALL') return true;
    const isCompleted = new Date(p.endDate) < new Date();
    return filter === 'COMPLETED' ? isCompleted : !isCompleted;
  });

  const total = data?.result.totalCount ?? 0;
  // Notice: The totalPages will effectively be based on the ALL count from API 
  // because we are doing client-side filtering. In a real scenario we'd pass filter to API.
  const totalPages = Math.ceil(total / LIMIT);

  if (isLoading) return <div>로딩 중...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24 }}>프로젝트 목록</h1>
        <Link to="/projects/new" style={{ padding: '8px 16px', background: '#2b6cb0', color: '#fff', textDecoration: 'none', borderRadius: 4 }}>
          새 프로젝트
        </Link>
      </div>
      
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center' }}>
        <input 
          value={keyword} 
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="사업명으로 검색..."
          style={{ padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: 4, width: 300, fontSize: 14 }} 
        />
        <div style={{ display: 'flex', gap: 4 }}>
          {(['ALL', 'ACTIVE', 'COMPLETED'] as FilterStatus[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '6px 12px', border: '1px solid #cbd5e0', borderRadius: 4, cursor: 'pointer',
                background: filter === f ? '#2b6cb0' : '#fff', color: filter === f ? '#fff' : '#4a5568',
                fontWeight: filter === f ? 600 : 400 }}>
              {{ ALL: '전체', ACTIVE: '진행중', COMPLETED: '완료' }[f]}
            </button>
          ))}
        </div>
      </div>
      {projects.length === 0 ? (
        <EmptyState
          icon="🏗️"
          title="참여 중인 프로젝트가 없습니다"
          description="새 프로젝트를 생성하거나 팀으로부터 초대를 받으세요."
          action={
            <Link to="/projects/new" style={{ padding: '8px 16px', background: '#2b6cb0', color: '#fff', borderRadius: 4, textDecoration: 'none', display: 'inline-block' }}>
              프로젝트 생성
            </Link>
          }
        />
      ) : (
        <>
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
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
