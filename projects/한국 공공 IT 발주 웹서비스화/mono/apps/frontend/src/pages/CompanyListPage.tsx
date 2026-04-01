import { useEffect, useState } from 'react';
import { api } from '../services/api';

interface Company {
  id: number;
  name: string;
  bizNo?: string;
  address?: string;
  tel?: string;
}

export default function CompanyListPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [keyword, setKeyword] = useState('');

  const fetchCompanies = (kw?: string) => {
    const q = kw ? `?keyword=${encodeURIComponent(kw)}` : '';
    api.get<{ companies: Company[] }>(`/companies${q}`)
      .then((res) => setCompanies(res.result.companies))
      .catch(() => {});
  };

  useEffect(() => { fetchCompanies(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCompanies(keyword);
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>회사 목록</h1>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="회사명 검색..."
          style={{ flex: 1, padding: 8, border: '1px solid #cbd5e0', borderRadius: 4 }} />
        <button type="submit" style={{ padding: '8px 16px', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          검색
        </button>
      </form>
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
        {companies.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#718096' }}>등록된 회사가 없습니다.</div>
        )}
      </div>
    </div>
  );
}
