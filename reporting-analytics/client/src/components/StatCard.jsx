import React from 'react';

const StatCard = ({ title, value, percentage, icon, isLoading = false, error = null }) => {
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-xs font-medium mb-2 uppercase">{title}</p>
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-[var(--tm-bg-surface)] border border-[var(--tm-border)] rounded-lg p-6 flex justify-between items-start">
        <div>
          <p className="text-[var(--tm-text-secondary)] text-xs font-medium mb-2 uppercase">{title}</p>
          <div className="animate-pulse flex gap-2">
            <div className="h-8 w-20 bg-[var(--tm-border)] rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const isPositive = percentage >= 0;
  const displayValue = value !== null && value !== undefined ? value : '--';

  return (
    <div className="bg-[var(--tm-bg-surface)] border border-[var(--tm-border)] rounded-lg p-6 flex justify-between items-start">
      <div className="flex-1">
        <p className="text-[var(--tm-text-secondary)] text-xs font-medium mb-4 uppercase">{title}</p>
        <h3 className="text-4xl font-bold text-white mb-3">{displayValue}</h3>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '↑' : '↓'}{Math.abs(percentage).toFixed(1)}%
          </span>
          <span className="text-xs text-[var(--tm-text-secondary)]">vs. previous period</span>
        </div>
      </div>
      {icon && (
        <div className="text-[var(--tm-border)] text-5xl ml-4 opacity-30">
          {icon}
        </div>
      )}
    </div>
  );
};

export default StatCard;
