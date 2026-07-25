export function StatCard({ title, value, change, changeType, icon: Icon }: any) {
  return (
    <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>{title}</h3>
        <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
          <Icon size={16} />
        </div>
      </div>
      <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
        <span style={{ color: changeType === 'up' ? 'var(--danger)' : 'var(--success)' }}>
          {change}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>vs last week</span>
      </div>
    </div>
  );
}
