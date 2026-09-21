import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const WeeklyChart = ({ data, loading, error }) => {
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

  if (error) {
    return (
      <div className="bg-[var(--tm-bg-surface)] border border-[var(--tm-border)] rounded-lg p-6 h-80 flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const chartData = (Array.isArray(data) && data.length > 0) ? data : [
    { day: 'Mon', completed: 0 },
    { day: 'Tue', completed: 0 },
    { day: 'Wed', completed: 0 },
    { day: 'Thu', completed: 0 },
    { day: 'Fri', completed: 0 },
    { day: 'Sat', completed: 0 },
    { day: 'Sun', completed: 0 }
  ];

  return (
    <div className="bg-[var(--tm-bg-surface)] border border-[var(--tm-border)] rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tasks Completed per Day</h3>
        <button className="text-[var(--tm-text-secondary)] hover:text-white transition">⋮</button>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false}/>
          <XAxis dataKey="day" stroke="#64748b" tick={{fill:'#64748b', fontSize:12}}/>
          <YAxis stroke="#64748b" tick={{fill:'#64748b', fontSize:12}}/>
          <Tooltip contentStyle={{backgroundColor:'#1e293b', border:'none', borderRadius:'8px', color:'#fff'}}/>
          <Area type="monotone" dataKey="completed" stroke="#3b82f6" strokeWidth={2}
            fill="url(#colorCompleted)" dot={false}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklyChart;
