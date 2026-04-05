import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import EmptyState from '../components/EmptyState';
import { useToast } from '../contexts/ToastContext';
import InviteMemberForm from '../components/InviteMemberForm';

interface Member {
  id: number;
  inputRate: number;
  user: { id: number; email: string; name: string };
  projectCompany: { company: { id: number; name: string } };
  role: { id: number; name: string };
}

const FALLBACK_ROLES = [
  { id: 1, name: 'PM' },
  { id: 2, name: 'PL' },
  { id: 3, name: 'Developer' },
  { id: 4, name: 'Designer' },
  { id: 5, name: 'QA' },
];

export default function MembersTab() {
  const { projectId } = useParams();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['projects', projectId, 'members'],
    queryFn: () => api.get<{ members: Member[] }>(`/projects/${projectId}/members`),
    enabled: !!projectId,
  });

  const members = data?.result.members ?? [];

  const updateMutation = useMutation({
    mutationFn: ({ memberId, payload }: { memberId: number, payload: any }) => 
      api.patch(`/projects/${projectId}/members/${memberId}`, payload),
    onSuccess: (res: any) => {
      addToast('success', '멤버 정보가 수정되었습니다.');
      // 투입률 경고 로직 (백엔드 지원 전제)
      if (res?.result?.totalInputRate > 100) {
        addToast('warning', `해당 멤버의 다른 프로젝트 포함 전체 투입률이 ${res.result.totalInputRate}%입니다.`);
      }
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'members'] });
    },
    onError: (err: any) => {
      addToast('error', err?.message || '멤버 정보 수정에 실패했습니다.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (memberId: number) => api.delete(`/projects/${projectId}/members/${memberId}`),
    onSuccess: () => {
      addToast('success', '멤버가 프로젝트에서 제외되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'members'] });
    },
    onError: (err: any) => {
      addToast('error', err?.message || '멤버 제외에 실패했습니다.');
    }
  });

  const handleUpdateRole = (memberId: number, newRoleId: string) => {
    updateMutation.mutate({ memberId, payload: { roleId: Number(newRoleId) } });
  };

  const handleUpdateInputRate = (memberId: number, currentRate: number, e: React.FocusEvent<HTMLInputElement>) => {
    const newRate = Number(e.target.value);
    if (!isNaN(newRate) && newRate > 0 && newRate !== currentRate) {
      updateMutation.mutate({ memberId, payload: { inputRate: newRate } });
    } else {
      e.target.value = String(currentRate); // 원복
    }
  };

  const handleRemoveMember = (memberId: number) => {
    if (!window.confirm('해당 멤버를 프로젝트에서 제외하시겠습니까?')) return;
    deleteMutation.mutate(memberId);
  };

  if (isLoading) return <div>로딩 중...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, margin: 0 }}>프로젝트 멤버</h2>
        {!showInvite && (
          <button 
            onClick={() => setShowInvite(true)}
            style={{ padding: '8px 16px', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
          >
            + 멤버 초대
          </button>
        )}
      </div>

      {showInvite && (
        <InviteMemberForm 
          projectId={projectId!} 
          onInvited={() => setShowInvite(false)} 
          onCancel={() => setShowInvite(false)}
        />
      )}

      {members.length === 0 ? (
        <EmptyState
          icon="👥"
          title="프로젝트 멤버가 없습니다"
          description="이메일로 팀원을 초대하세요. 먼저 컨소시엄 탭에서 소속 회사를 등록해야 합니다."
          action={
            <button 
              onClick={() => setShowInvite(true)}
              style={{ padding: '8px 16px', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
            >
              멤버 초대 시작
            </button>
          }
        />
      ) : (
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#edf2f7' }}>
                <th style={{ padding: '12px', fontWeight: 600 }}>이름</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>이메일</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>소속 컨소시엄사</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>역할군</th>
                <th style={{ padding: '12px', fontWeight: 600, textAlign: 'right' }}>초기 투입률(%)</th>
                <th style={{ padding: '12px', width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                  <td style={{ padding: '12px' }}>{m.user?.name || '-'}</td>
                  <td style={{ padding: '12px', color: '#718096' }}>{m.user?.email || '-'}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: 4, fontSize: 13 }}>
                      {m.projectCompany?.company?.name || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <select 
                      defaultValue={m.role?.id} 
                      onChange={(e) => handleUpdateRole(m.id, e.target.value)}
                      disabled={updateMutation.isPending}
                      style={{ padding: '4px 8px', border: '1px solid #cbd5e0', borderRadius: 4, fontSize: 13, background: '#fff' }}
                    >
                      <option value="" disabled>선택</option>
                      {FALLBACK_ROLES.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', background: m.inputRate > 100 ? '#fff5f5' : 'transparent', color: m.inputRate > 100 ? '#e53e3e' : 'inherit', fontWeight: m.inputRate > 100 ? 600 : 400 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      {m.inputRate > 100 && <span title="다른 프로젝트 포함 총 투입률 과다 현황">⚠️</span>}
                      <input 
                        type="number" 
                        defaultValue={m.inputRate} 
                        onBlur={(e) => handleUpdateInputRate(m.id, m.inputRate, e)}
                        disabled={updateMutation.isPending}
                        min="1"
                        style={{ width: 60, padding: '4px 8px', border: '1px solid #cbd5e0', borderRadius: 4, textAlign: 'right', fontSize: 13 }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleRemoveMember(m.id)}
                      disabled={deleteMutation.isPending}
                      style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: deleteMutation.isPending ? 'not-allowed' : 'pointer', fontSize: 13, padding: '4px 8px' }}
                      title="프로젝트에서 제거"
                    >
                      {deleteMutation.isPending ? '...' : '제거'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
