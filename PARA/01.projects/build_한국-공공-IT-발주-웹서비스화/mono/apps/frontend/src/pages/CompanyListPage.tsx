import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import CompanyCreateModal from '../components/CompanyCreateModal';
import { useToast } from '../contexts/ToastContext';
import { useDebounce } from '../hooks/useDebounce';

interface Company {
  id: number;
  name: string;
  bizNo?: string;
  address?: string;
  tel?: string;
}

export default function CompanyListPage() {
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebounce(keyword, 300);
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const LIMIT = 20;

  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['companies', debouncedKeyword, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedKeyword) params.set('keyword', debouncedKeyword);
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      return api.get<{ companies: Company[]; total: number }>(`/companies?${params}`);
    },
  });

  // 검색어가 바뀌면 1페이지로 자동 리셋
  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword]);

  const companies = data?.result.companies ?? [];
  const total = data?.result.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>회사 목록</h1>
        <button 
          onClick={() => setShowCreate(true)}
          style={{ padding: '8px 16px', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
        >
          + 회사 등록
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input 
          value={keyword} 
          onChange={(e) => setKeyword(e.target.value)} 
          placeholder="회사명 검색..."
          style={{ flex: 1, padding: 8, border: '1px solid #cbd5e0', borderRadius: 4 }} 
        />
      </div>
      
      {isLoading ? (
        <div>로딩 중...</div>
      ) : companies.length === 0 ? (
        <EmptyState
          icon="🏢"
          title="등록된 회사가 없습니다"
          description="프로젝트에 참여할 회사를 먼저 등록하세요."
          action={
            <button 
              onClick={() => setShowCreate(true)}
              style={{ padding: '8px 16px', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
            >
              회사 등록
            </button>
          }
        />
      ) : (
        <>
          <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#edf2f7' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>회사명</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>사업자번호</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>주소</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>전화</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '10px 12px', color: '#718096' }}>{c.bizNo || '-'}</td>
                    <td style={{ padding: '10px 12px', color: '#718096' }}>{c.address || '-'}</td>
                    <td style={{ padding: '10px 12px', color: '#718096' }}>{c.tel || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <CompanyCreateModal 
        open={showCreate} 
        onClose={() => setShowCreate(false)} 
        onCreated={() => setShowCreate(false)} 
      />
    </div>
  );
}
