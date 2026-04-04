import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import EmptyState from '../components/EmptyState';
import { useToast } from '../contexts/ToastContext';

interface WbsNode {
  id: number;
  type: 'CATEGORY' | 'TASK';
  depth: number;
  order: number;
  code?: string;
  title: string;
  progress: number;
  weight: number;
  children: WbsNode[];
}

interface AddNodeFormProps {
  parentId: number | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

function AddNodeInlineForm({ parentId, onSave, onCancel }: AddNodeFormProps) {
  const [type, setType] = useState<'CATEGORY' | 'TASK'>('CATEGORY');
  const [title, setTitle] = useState('');
  const [weight, setWeight] = useState('1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ parentId, type, title: title.trim(), weight: Number(weight) });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, padding: '8px', background: '#e2e8f0', marginLeft: parentId ? 32 : 0, borderRadius: 4, alignItems: 'center' }}>
      <select value={type} onChange={(e) => setType(e.target.value as any)} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e0' }}>
        <option value="CATEGORY">카테고리</option>
        <option value="TASK">태스크</option>
      </select>
      <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" required style={{ flex: 1, padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e0' }} />
      <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} min="1" required style={{ width: 60, padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e0' }} title="가중치" />
      <button type="submit" style={{ padding: '4px 12px', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>저장</button>
      <button type="button" onClick={onCancel} style={{ padding: '4px 12px', background: '#a0aec0', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>취소</button>
    </form>
  );
}

function WbsTreeItem({ 
  node, 
  onAddChild, 
  onUpdate, 
  onUpdateProgress, 
  onDelete 
}: { 
  node: WbsNode; 
  onAddChild: (parentId: number) => void; 
  onUpdate: (id: number, data: any) => void; 
  onUpdateProgress: (id: number, progress: number) => void;
  onDelete: (id: number, hasChildren: boolean) => void;
}) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const [editWeight, setEditWeight] = useState(String(node.weight || 1));
  const [editingProgress, setEditingProgress] = useState(false);
  const [editProgressVal, setEditProgressVal] = useState(String(node.progress || 0));

  const isCategory = node.type === 'CATEGORY';
  const indent = node.depth * 24;

  const handleSaveEdit = () => {
    if (editTitle.trim() !== node.title || Number(editWeight) !== node.weight) {
      onUpdate(node.id, { title: editTitle.trim(), weight: Number(editWeight) });
    }
    setEditing(false);
  };

  const handleSaveProgress = () => {
    const val = Number(editProgressVal);
    if (!isNaN(val) && val >= 0 && val <= 100 && val !== node.progress) {
      onUpdateProgress(node.id, val);
    } else {
      setEditProgressVal(String(node.progress));
    }
    setEditingProgress(false);
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', paddingLeft: indent + 8, borderBottom: '1px solid #edf2f7', background: isCategory ? '#f7fafc' : '#fff' }}>
        {isCategory && (
          <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 4, fontSize: 12, visibility: node.children.length > 0 ? 'visible' : 'hidden' }}>
            {open ? '▼' : '▶'}
          </button>
        )}
        {!isCategory && <span style={{ width: 16, display: 'inline-block' }}></span>}
        
        {editing ? (
          <div style={{ flex: 1, display: 'flex', gap: 4, alignItems: 'center' }}>
            <input autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onBlur={handleSaveEdit} onKeyDown={e => e.key === 'Enter' && handleSaveEdit()} style={{ flex: 1, padding: '2px 4px' }} />
            <input type="number" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} onBlur={handleSaveEdit} onKeyDown={e => e.key === 'Enter' && handleSaveEdit()} style={{ width: 50, padding: '2px 4px' }} title="가중치" />
          </div>
        ) : (
          <span style={{ flex: 1, fontWeight: isCategory ? 600 : 400, cursor: 'pointer' }} onDoubleClick={() => setEditing(true)} title="더블클릭하여 수정">
            {node.code && <span style={{ color: '#718096', marginRight: 8 }}>[{node.code}]</span>}
            {node.title} <span style={{ fontSize: 11, color: '#a0aec0' }}>(w:{node.weight})</span>
          </span>
        )}
        
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {isCategory && (
            <button onClick={() => onAddChild(node.id)} style={{ padding: '2px 6px', fontSize: 12, background: '#e2e8f0', border: 'none', borderRadius: 4, cursor: 'pointer' }}>+</button>
          )}
          <button onClick={() => onDelete(node.id, node.children.length > 0)} style={{ padding: '2px 6px', fontSize: 12, background: 'none', color: '#e53e3e', border: 'none', cursor: 'pointer' }}>x</button>
        </div>

        <div style={{ width: 140, display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 12 }}>
          <div style={{ flex: 1, height: 8, background: '#edf2f7', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${node.progress}%`, height: '100%', background: node.progress === 100 ? '#38a169' : '#2b6cb0', borderRadius: 4 }} />
          </div>
          {editingProgress ? (
            <input 
              autoFocus type="number" min="0" max="100" value={editProgressVal} 
              onChange={(e) => setEditProgressVal(e.target.value)} 
              onBlur={handleSaveProgress} onKeyDown={e => e.key === 'Enter' && handleSaveProgress()}
              style={{ width: 40, fontSize: 12, padding: '2px 4px' }} 
            />
          ) : (
            <span style={{ fontSize: 12, minWidth: 36, textAlign: 'right', cursor: !isCategory ? 'pointer' : 'default' }} 
              onClick={() => !isCategory && setEditingProgress(true)} 
              title={!isCategory ? "클릭하여 진척률 입력" : ""}>
              {node.progress}%
            </span>
          )}
        </div>
      </div>
      {open && node.children.map((child) => (
        <WbsTreeItem key={child.id} node={child} onAddChild={onAddChild} onUpdate={onUpdate} onUpdateProgress={onUpdateProgress} onDelete={onDelete} />
      ))}
    </>
  );
}

export default function WbsTab() {
  const { projectId } = useParams();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [addingTo, setAddingTo] = useState<number | null | 'ROOT'>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['projects', projectId, 'wbs-nodes'],
    queryFn: () => api.get<{ nodes: WbsNode[] }>(`/projects/${projectId}/wbs-nodes`),
    enabled: !!projectId,
  });

  const nodes = data?.result.nodes ?? [];

  const updateCache = () => queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'wbs-nodes'] });

  const addMutation = useMutation({
    mutationFn: (payload: any) => api.post(`/projects/${projectId}/wbs-nodes`, payload),
    onSuccess: () => { addToast('success', 'WBS 노드가 추가되었습니다.'); updateCache(); setAddingTo(null); },
    onError: (err: any) => addToast('error', err?.message || '추가에 실패했습니다.')
  });

  const progressMutation = useMutation({
    mutationFn: ({ id, progress }: { id: number, progress: number }) =>
      api.patch(`/projects/${projectId}/wbs-nodes/${id}/progress`, { progress }),
    onSuccess: () => { updateCache(); },
    onError: (err: any) => addToast('error', err?.message || '진척률 수정에 실패했습니다.')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number, payload: any }) => api.patch(`/projects/${projectId}/wbs-nodes/${id}`, payload),
    onSuccess: () => { updateCache(); },
    onError: (err: any) => addToast('error', err?.message || '수정에 실패했습니다.')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/projects/${projectId}/wbs-nodes/${id}`),
    onSuccess: () => { addToast('success', '삭제되었습니다.'); updateCache(); },
    onError: (err: any) => addToast('error', err?.message || '삭제에 실패했습니다.')
  });

  if (isLoading) return <div style={{ padding: 24 }}>로딩 중...</div>;

  return (
    <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', padding: '10px 8px', background: '#edf2f7', fontWeight: 600, fontSize: 14, alignItems: 'center' }}>
        <span style={{ flex: 1 }}>WBS 작업분류체계</span>
        <button onClick={() => setAddingTo('ROOT')} style={{ padding: '4px 12px', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
          + 루트 카테고리 추가
        </button>
        <span style={{ width: 140, textAlign: 'center', marginLeft: 16 }}>진척률 (%)</span>
      </div>
      
      {addingTo === 'ROOT' && (
        <AddNodeInlineForm parentId={null} onSave={addMutation.mutate} onCancel={() => setAddingTo(null)} />
      )}

      {nodes.length === 0 && addingTo !== 'ROOT' ? (
        <EmptyState
          icon="📊"
          title="WBS가 비어 있습니다"
          description="작업분류체계(WBS)를 구성하세요. 카테고리를 먼저 만들고 그 아래 세부 작업을 추가합니다."
          action={
            <button 
              onClick={() => setAddingTo('ROOT')}
              style={{ padding: '8px 16px', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
            >
              루트 카테고리 추가
            </button>
          }
        />
      ) : (
        <div style={{ paddingBottom: 16 }}>
          {nodes.map((node) => (
            <div key={node.id}>
              <WbsTreeItem 
                node={node} 
                onAddChild={setAddingTo}
                onUpdate={(id, data) => updateMutation.mutate({ id, payload: data })}
                onUpdateProgress={(id, progress) => progressMutation.mutate({ id, progress })}
                onDelete={(id, hasChildren) => {
                  if (window.confirm(hasChildren ? '하위 항목도 모두 삭제됩니다. 계속하시겠습니까?' : '이 항목을 삭제하시겠습니까?')) {
                    deleteMutation.mutate(id);
                  }
                }}
              />
              {addingTo === node.id && (
                <AddNodeInlineForm parentId={node.id} onSave={addMutation.mutate} onCancel={() => setAddingTo(null)} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
