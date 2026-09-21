import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from 'recharts';

const StatusChart = ({ data, loading }) => {
  const [viewMode, setViewMode] = useState('pie'); // 'pie' or 'bar'

  if (loading) {
    return (
      <div className="bg-[var(--tm-bg-surface)] border border-[var(--tm-border)] rounded-lg p-6 h-80 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-3">
            <div className="w-8 h-8 border-4 border-[var(--tm-border)] border-t-[var(--tm-accent)] rounded-full mx-auto"></div>
          </div>
          <p className="text-[var(--tm-text-secondary)]">Loading chart...</p>
        </div>
      </div>
    );
  }

  // Parse backend object data into array format for Recharts
  let chartData = [];
  let total = 0;

  if (data && data.completed !== undefined) {
    // We have real data from backend
    chartData = [
      { name: 'Done', count: data.completed?.count || 0, percentage: data.completed?.percentage || 0 },
      { name: 'In progress', count: data.inProgress?.count || 0, percentage: data.inProgress?.percentage || 0 },
      { name: 'To do', count: data.pending?.count || 0, percentage: data.pending?.percentage || 0 }
    ];
    total = data.total || 0;
  } else if (Array.isArray(data)) {
    // Array format fallback
    chartData = data;
    total = chartData.reduce((sum, item) => sum + item.count, 0);
  } else {
    // Default fallback
    chartData = [
      { name: 'Done', count: 65, percentage: 65 },
      { name: 'In progress', count: 20, percentage: 20 },
      { name: 'To do', count: 15, percentage: 15 }
    ];
    total = 100;
  }

  // Colors mapping to statuses
  const colors = ['#3b82f6', '#60a5fa', '#1e40af']; // Done, In Progress, To do

  // Custom Tooltip for BarChart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111621] border border-[var(--tm-border)] rounded-lg p-3 shadow-xl">
          <p className="text-white text-sm font-medium mb-1">{payload[0].payload.name}</p>
          <div className="flex gap-4">
            <p className="text-[#3b82f6] text-sm">Count: {payload[0].value}</p>
            <p className="text-[#a8b2c1] text-sm">{payload[0].payload.percentage}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[var(--tm-bg-surface)] border border-[var(--tm-border)] rounded-lg p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Status Breakdown</h3>
        <div className="flex bg-[#111621] rounded-md border border-[var(--tm-border)] p-0.5">
          <button
            onClick={() => setViewMode('pie')}
            className={`px-3 py-1 text-xs font-medium rounded transition ${
              viewMode === 'pie'
                ? 'bg-[var(--tm-accent)] text-white'
                : 'text-[var(--tm-text-secondary)] hover:text-white'
            }`}
          >
            Pie
          </button>
          <button
            onClick={() => setViewMode('bar')}
            className={`px-3 py-1 text-xs font-medium rounded transition ${
              viewMode === 'bar'
                ? 'bg-[var(--tm-accent)] text-white'
                : 'text-[var(--tm-text-secondary)] hover:text-white'
            }`}
          >
            Bar
          </button>
        </div>
      </div>

      <div className="flex flex-col flex-1 items-center justify-center relative min-h-[220px]">
        {viewMode === 'pie' ? (
          <div style={{ position: 'relative', width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  isAnimationActive={true}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111621', borderColor: 'var(--tm-border)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center text overlay */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>{total}</div>
              <div style={{ fontSize: '11px', color: 'var(--tm-text-secondary)', letterSpacing: '1px' }}>TOTAL</div>
            </div>
          </div>
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3441" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#1e293b', opacity: 0.4}} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="space-y-3 mt-6">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: colors[index % colors.length] }}></div>
              <span className="text-sm text-slate-300 font-medium">{item.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-white">{item.count}</span>
              <span className="text-xs font-medium text-[var(--tm-text-secondary)] w-8 text-right">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatusChart;
