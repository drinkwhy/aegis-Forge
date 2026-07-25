export function SeverityBadge({ severity }: { severity: string }) {
  const s = severity.toLowerCase();
  let className = 'badge-info';
  if (s === 'critical') className = 'badge-critical';
  else if (s === 'high') className = 'badge-high';
  else if (s === 'medium') className = 'badge-medium';
  else if (s === 'low') className = 'badge-low';

  return (
    <span className={`badge ${className}`}>
      {severity}
    </span>
  );
}
