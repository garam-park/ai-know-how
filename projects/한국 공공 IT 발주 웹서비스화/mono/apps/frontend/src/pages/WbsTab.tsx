import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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

function WbsTreeItem({ node }: { node: WbsNode }) {
  const [open, setOpen] = useState(true);
  const isCategory = node.type === 'CATEGORY';
  const indent = node.depth * 24;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', paddingLeft: indent + 8, borderBottom: '1px solid #edf2f7', background: isCategory ? '#f7fafc' : '#fff' }}>
        {isCategory && node.children.length > 0 && (
          <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 4, fontSize: 12 }}>
            {open ? '▼' : '▶'}
          </button>
        )}
        <span style={{ flex: 1, fontWeight: isCategory ? 600 : 400 }}>
          {node.code && <span style={{ color: '#718096', marginRight: 8 }}>[{node.code}]</span>}
          {node.title}
        </span>
        <div style={{ width: 120, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 8, background: '#edf2f7', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${node.progress}%`, height: '100%', background: node.progress === 100 ? '#38a169' : '#2b6cb0', borderRadius: 4 }} />
          </div>
          <span style={{ fontSize: 12, minWidth: 36, textAlign: 'right' }}>{node.progress}%</span>
        </div>
      </div>
      {open && node.children.map((child) => <WbsTreeItem key={child.id} node={child} />)}
    </>
  );
}

export default function WbsTab() {
  const { projectId } = useParams();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['projects', projectId, 'wbs-nodes'],
    queryFn: () => api.get<{ nodes: WbsNode[] }>(`/projects/${projectId}/wbs-nodes`),
    enabled: !!projectId,
  });

  const nodes = data?.result.nodes ?? [];

  if (isLoading) return <div>로딩 중...</div>;

  return (
    <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', padding: '10px 8px', background: '#edf2f7', fontWeight: 600, fontSize: 14 }}>
        <span style={{ flex: 1 }}>WBS</span>
        <span style={{ width: 120, textAlign: 'center' }}>진척률</span>
      </div>
      {nodes.length === 0 ? (
        <EmptyState
          icon="📊"
          title="WBS가 비어 있습니다"
          description="작업분류체계(WBS)를 구성하세요. 카테고리를 먼저 만들고 그 아래 세부 작업을 추가합니다."
          action={
            <button 
              onClick={() => addToast('info', 'WBS 추가 기능은 준비중입니다.')}
              style={{ padding: '8px 16px', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
            >
              루트 카테고리 추가
            </button>
          }
        />
      ) : (
        nodes.map((node) => <WbsTreeItem key={node.id} node={node} />)
      )}
    </div>
  );
}
