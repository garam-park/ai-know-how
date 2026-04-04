import { useState, JSX } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CompanyCreateModal({ open, onClose, onCreated }: Props): JSX.Element | null {
  const [form, setForm] = useState({ name: '', bizNo: '', address: '', tel: '' });
  const [error, setError] = useState('');
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: { name: string; bizNo?: string; address?: string; tel?: string }) => 
      api.post('/companies', data),
    onSuccess: () => {
      addToast('success', '회사 등록이 완료되었습니다.');
      setForm({ name: '', bizNo: '', address: '', tel: '' });
      queryClient.invalidateQueries({ queryKey: ['companies'] }); // 캐시 무효화로 목록 갱신
      onCreated();
      onClose();
    },
    onError: (err: any) => {
      if (err?.code === 409000) {
        setError('이미 등록된 사업자번호입니다.');
      } else {
        setError(err?.message || '회사 등록에 실패했습니다.');
      }
    }
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!form.name.trim()) {
      setError('회사명을 입력해주세요.');
      return;
    }

    mutation.mutate({
      name: form.name.trim(),
      bizNo: form.bizNo.trim() || undefined,
      address: form.address.trim() || undefined,
      tel: form.tel.trim() || undefined,
    });
  };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 8, padding: 24, width: 480, maxWidth: '90vw', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>회사 등록</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {error && <div style={{ color: '#e53e3e', fontSize: 14, background: '#fff5f5', padding: 8, borderRadius: 4 }}>{error}</div>}
          
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: 14 }}>
            <span style={{ marginBottom: 4 }}>회사명 <span style={{ color: '#e53e3e' }}>*</span></span>
            <input required value={form.name} onChange={set('name')} disabled={mutation.isPending}
              style={{ padding: 8, border: '1px solid #cbd5e0', borderRadius: 4 }} placeholder="예: (주)이노팜" />
          </label>
          
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: 14 }}>
            <span style={{ marginBottom: 4 }}>사업자번호</span>
            <input value={form.bizNo} onChange={set('bizNo')} disabled={mutation.isPending}
              style={{ padding: 8, border: '1px solid #cbd5e0', borderRadius: 4 }} placeholder="예: 123-45-67890" />
          </label>
          
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: 14 }}>
            <span style={{ marginBottom: 4 }}>주소</span>
            <input value={form.address} onChange={set('address')} disabled={mutation.isPending}
              style={{ padding: 8, border: '1px solid #cbd5e0', borderRadius: 4 }} placeholder="예: 서울특별시 강남구" />
          </label>
          
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: 14 }}>
            <span style={{ marginBottom: 4 }}>전화번호</span>
            <input value={form.tel} onChange={set('tel')} disabled={mutation.isPending}
              style={{ padding: 8, border: '1px solid #cbd5e0', borderRadius: 4 }} placeholder="예: 02-1234-5678" />
          </label>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button type="button" onClick={onClose} disabled={mutation.isPending}
              style={{ padding: '8px 16px', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              취소
            </button>
            <button type="submit" disabled={mutation.isPending}
              style={{ padding: '8px 16px', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: 4, cursor: mutation.isPending ? 'not-allowed' : 'pointer' }}>
              {mutation.isPending ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
