import React, { useState } from 'react';

const Header = ({onGenerateReport, onSearch}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <div className="bg-[var(--tm-bg-surface)] border-b border-[var(--tm-border)] sticky top-0 z-40">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">Reporting & Analytics</h1>
          </div>

          <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 
          bg-[#111621] border border-[var(--tm-border)] rounded-lg 
          text-slate-400 text-sm w-64 focus-within:border-[var(--tm-accent)] 
          focus-within:ring-1 focus-within:ring-[var(--tm-accent)] transition-all">
            <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Search analytics..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="bg-transparent outline-none text-white 
              placeholder-slate-500 text-sm w-full"
            />
          </div>

            <button onClick={onGenerateReport}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--tm-accent)] hover:bg-[var(--tm-accent-hover)] 
              text-white rounded-lg text-sm font-medium transition-colors">
              <span className="material-symbols-outlined text-lg">add</span> Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
