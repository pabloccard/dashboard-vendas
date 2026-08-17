'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface MainChartProps {
  data: any[];
}

export default function MainChart({ data }: MainChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state" style={{ height: '260px' }}>
        <p className="empty-state-text">Sem dados para exibir no gráfico</p>
      </div>
    );
  }

  // Format date for X axis (e.g. "17/08")
  const formattedData = data.map(item => {
    const d = new Date(item.date);
    const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return {
      ...item,
      displayDate: dateStr
    };
  });

  return (
    <div style={{ height: '260px', width: '100%', marginTop: '16px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--lime)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--lime)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--green)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--green)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="displayDate" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-3)', fontSize: 11 }}
            dy={10}
            minTickGap={20}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-3)', fontSize: 11 }}
            tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--bg-3)', 
              borderColor: 'var(--border)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              fontSize: '12px'
            }}
            itemStyle={{ color: 'var(--text-1)' }}
            formatter={(value: any) => [formatCurrency(Number(value) || 0), '']}
            labelStyle={{ color: 'var(--text-2)', marginBottom: '4px' }}
          />
          <Area 
            type="monotone" 
            dataKey="net_revenue" 
            name="Faturamento"
            stroke="var(--lime)" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorNet)" 
            activeDot={{ r: 6, fill: 'var(--lime)', stroke: 'var(--bg-1)', strokeWidth: 2 }}
          />
          <Area 
            type="monotone" 
            dataKey="profit" 
            name="Lucro"
            stroke="var(--green)" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorProfit)" 
            activeDot={{ r: 6, fill: 'var(--green)', stroke: 'var(--bg-1)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
