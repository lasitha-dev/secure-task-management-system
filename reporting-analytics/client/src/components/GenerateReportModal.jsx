import React, { useState, useEffect } from 'react';
import { reportsApi } from '../services/analyticsApi';

export const GenerateReportModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    authorName: localStorage.getItem('userName') || 'Alex Rivera',
    period: 'week'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.authorName) {
      setError('Title and Author are required');
      return;
    }

    setIsLoading(true);
    const result = await reportsApi.generateReport(formData);
    
    if (result.success) {
      setFormData({ title: '', authorName: '', period: 'week' });
      onClose();
      onSuccess();
    } else {
      setError(result.error?.message || 'Failed to generate report');
    }
    
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--tm-bg-surface)] border border-[var(--tm-border)] rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold text-white mb-4">Generate New Report</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Report Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Weekly Task Summary"
              className="w-full bg-[#111621] border border-[var(--tm-border)] rounded-lg px-4 py-2 text-white placeholder-[var(--tm-text-secondary)] focus:outline-none focus:border-[var(--tm-accent)] transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Author Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="authorName"
              value={formData.authorName}
              disabled
              className="w-full bg-[#111621] border border-[var(--tm-border)] rounded-lg px-4 py-2 text-white placeholder-[var(--tm-text-secondary)] focus:outline-none focus:border-[var(--tm-accent)] transition opacity-75 cursor-not-allowed"
            />
            <p className="text-xs text-[var(--tm-text-secondary)] mt-1">Auto-filled with your login name</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Period
            </label>
            <select
              name="period"
              value={formData.period}
              onChange={handleChange}
              className="w-full bg-[#111621] border border-[var(--tm-border)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--tm-accent)] transition"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Period</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#111621] text-white py-2 rounded-lg hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-[var(--tm-accent)] text-white py-2 rounded-lg hover:bg-[var(--tm-accent-hover)] transition disabled:opacity-50"
            >
              {isLoading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateReportModal;
