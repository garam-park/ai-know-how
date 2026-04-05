import { ReactNode, JSX } from 'react';

interface Props {
  icon?: string;          // 이모지 or 아이콘 문자
  title: string;
  description: string;
  action?: ReactNode;     // CTA 버튼
}

export default function EmptyState({ icon = '📋', title, description, action }: Props): JSX.Element {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center', color: '#718096', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.8 }}>{icon}</div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: '#2d3748', marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 15, marginBottom: 24, maxWidth: 400, lineHeight: 1.5 }}>{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
