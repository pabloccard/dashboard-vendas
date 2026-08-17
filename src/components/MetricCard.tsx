'use client';

import React from 'react';

type MetricCardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: 'green' | 'red' | 'yellow' | 'primary' | 'blue';
  subtitle?: string;
  featured?: boolean;
  badge?: string;
  badgePositive?: boolean;
};

export default function MetricCard({ label, value, icon, accent, subtitle, featured, badge, badgePositive }: MetricCardProps) {
  return (
    <div className={`metric-card accent-${accent} ${featured ? 'metric-card-featured' : ''}`}>
      <div className="metric-card-header">
        <span className="metric-card-label">{label}</span>
        <div className={`metric-card-icon ${accent}`}>{icon}</div>
      </div>

      <div className={`metric-card-value ${accent}`}>{value}</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
        {subtitle && <div className="metric-card-subtitle">{subtitle}</div>}
        {badge && (
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '6px',
            background: badgePositive ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
            color: badgePositive ? 'var(--accent-green)' : 'var(--accent-red)',
          }}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
