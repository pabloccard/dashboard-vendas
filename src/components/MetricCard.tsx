'use client';

type MetricCardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: 'green' | 'red' | 'yellow' | 'primary' | 'blue';
  subtitle?: string;
  featured?: boolean;
};

export default function MetricCard({ label, value, icon, accent, subtitle, featured }: MetricCardProps) {
  return (
    <div className={`metric-card accent-${accent} ${featured ? 'metric-card-featured' : ''}`}>
      <div className="metric-card-header">
        <span className="metric-card-label">{label}</span>
        <div className={`metric-card-icon ${accent}`}>
          {icon}
        </div>
      </div>
      <div className={`metric-card-value ${accent}`}>{value}</div>
      {subtitle && <div className="metric-card-subtitle">{subtitle}</div>}
    </div>
  );
}
