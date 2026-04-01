import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';

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
  const [nodes, setNodes] = useState<WbsNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    api.get<{ nodes: WbsNode[] }>(`/projects/${projectId}/wbs-nodes`)
      .then((res) => setNodes(res.result.nodes))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div>로딩 중...</div>;

  return (
    <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', padding: '10px 8px', background: '#edf2f7', fontWeight: 600, fontSize: 14 }}>
        <span style={{ flex: 1 }}>WBS</span>
        <span style={{ width: 120, textAlign: 'center' }}>진척률</span>
      </div>
      {nodes.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#718096' }}>WBS 항목이 없습니다.</div>
      ) : (
        nodes.map((node) => <WbsTreeItem key={node.id} node={node} />)
      )}
    </div>
  );
}
