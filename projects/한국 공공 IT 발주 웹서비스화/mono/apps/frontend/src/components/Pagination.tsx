import { JSX } from 'react';

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: Props): JSX.Element | null {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  const handlePageChange = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    onPageChange(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 24, padding: '16px 0' }}>
      <button 
        disabled={page <= 1} 
        onClick={() => handlePageChange(page - 1)}
        style={{ 
          padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 4, 
          cursor: page <= 1 ? 'not-allowed' : 'pointer', background: page <= 1 ? '#f7fafc' : '#fff', color: page <= 1 ? '#a0aec0' : '#4a5568',
          fontWeight: 500, transition: 'all 0.2s'
        }}>
        이전
      </button>

      {pages[0] > 1 && (
        <>
          <button onClick={() => handlePageChange(1)} style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer', background: '#fff', color: '#4a5568' }}>1</button>
          {pages[0] > 2 && <span style={{ padding: '6px 4px', color: '#a0aec0' }}>...</span>}
        </>
      )}

      {pages.map((p) => (
        <button 
          key={p} 
          onClick={() => handlePageChange(p)}
          style={{ 
            padding: '6px 12px', border: '1px solid', borderRadius: 4, cursor: 'pointer',
            background: p === page ? '#2b6cb0' : '#fff', 
            color: p === page ? '#fff' : '#4a5568',
            borderColor: p === page ? '#2b6cb0' : '#e2e8f0',
            fontWeight: p === page ? 600 : 400,
            transition: 'all 0.2s'
          }}>
          {p}
        </button>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span style={{ padding: '6px 4px', color: '#a0aec0' }}>...</span>}
          <button onClick={() => handlePageChange(totalPages)} style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer', background: '#fff', color: '#4a5568' }}>{totalPages}</button>
        </>
      )}

      <button 
        disabled={page >= totalPages} 
        onClick={() => handlePageChange(page + 1)}
        style={{ 
          padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 4, 
          cursor: page >= totalPages ? 'not-allowed' : 'pointer', background: page >= totalPages ? '#f7fafc' : '#fff', color: page >= totalPages ? '#a0aec0' : '#4a5568',
          fontWeight: 500, transition: 'all 0.2s'
        }}>
        다음
      </button>
    </div>
  );
}
