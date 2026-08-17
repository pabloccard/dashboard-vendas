'use client';

interface MiniChartProps {
  data: any[];
  dataKey: string;
  color: string;
}

export default function MiniChart({ data, dataKey, color }: MiniChartProps) {
  // PayGlow style: 16 bars
  const numBars = 16;
  const pastDays = Array.from({ length: numBars }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (numBars - 1 - i));
    return d.toISOString().split('T')[0];
  });

  const chartData = pastDays.map(date => {
    // Find matching date in the data
    const existing = data.find(d => {
      // Assuming d.date is 'YYYY-MM-DD' or similar
      const t = new Date(d.date);
      return t.toISOString().split('T')[0] === date;
    });
    return {
      date,
      amount: existing ? Number(existing[dataKey]) : 0
    };
  });

  const maxAmount = Math.max(...chartData.map(d => d.amount), 1);

  return (
    <div className="mini-chart-container" style={{ marginTop: '32px', display: 'flex', alignItems: 'flex-end', height: '48px', gap: '4px', zIndex: 10, position: 'relative' }}>
      {chartData.map((d, i) => {
        const heightPercent = Math.max((d.amount / maxAmount) * 100, 4);
        return (
          <div
            key={i}
            className="mini-chart-bar group"
            style={{
              flex: 1,
              backgroundColor: color,
              opacity: 0.8,
              borderTopLeftRadius: '2px',
              borderTopRightRadius: '2px',
              height: `${heightPercent}%`,
              transition: 'background-color 200ms',
              position: 'relative'
            }}
          >
            {/* Hover Tooltip (Simulating PayGlow's custom tooltip) */}
            <div className="mini-chart-tooltip">
              <p style={{ fontWeight: 600, color: color }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.amount)}
              </p>
              <p style={{ color: 'var(--text-3)', fontSize: '10px' }}>
                {new Date(d.date).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: 'short' })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
