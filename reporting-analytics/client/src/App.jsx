import React, { useState, useEffect } from 'react';
import { analyticsApi, reportsApi, syncApi } from './services/analyticsApi';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatCard from './components/StatCard';
import WeeklyChart from './components/WeeklyChart';
import StatusChart from './components/StatusChart';
import ReportsTable from './components/ReportsTable';
import GenerateReportModal from './components/GenerateReportModal';

function App() {
  const [period, setPeriod] = useState('week');
  const [summaryData, setSummaryData] = useState(null);
  const [summaryError, setSummaryError] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [weeklyError, setWeeklyError] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [reports, setReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const fetchReports = async () => {
    try {
      const response = await reportsApi.fetchReports();
      const data = response.data?.data || response.data || [];
      setReports(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log('reports fetch error:', e.message);
      setReports([]);
    }
  };

  const loadAllData = async (selectedPeriod = period) => {
    try {
      await syncApi.syncTasks();
    } catch(e) {}
    
    await new Promise(r => setTimeout(r, 500));
    
    const [summary, weekly, status, reports] = await Promise.all([
      analyticsApi.fetchSummary(selectedPeriod),
      analyticsApi.fetchWeeklyData(),
      analyticsApi.fetchStatusBreakdown(),
      reportsApi.fetchReports()
    ]);
    
    setSummaryData(summary?.data?.data || summary?.data);
    setWeeklyData(weekly?.data?.data || weekly?.data || []);
    setStatusData(status?.data?.data || status?.data);
    setReports(reports?.data?.data || reports?.data || []);
  };

  // Startup sequence: sync first, then load data
  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true);
      try {
        // Step 1: Force sync fresh data
        console.log('🔄 Syncing tasks from external service...');
        await syncApi.syncTasks();
        console.log('✅ Sync complete');
        
        // Step 1.5: Wait 2 seconds for DB to index data
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 2: Load all analytics in parallel
        await loadAllData('week');
      } catch (error) {
        console.error('Error during app initialization:', error);
        setSummaryError('Failed to initialize analytics');
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Auto-refresh reports every 30 seconds to check processing status
  useEffect(() => {
    const interval = setInterval(() => {
      fetchReports();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Reload data when period changes
  useEffect(() => {
    if (!loading && period !== 'custom') {
      const reloadData = async () => {
        setLoading(true);
        await loadAllData(period);
        setLoading(false);
      };
      reloadData();
    }
  }, [period]);

  const handlePeriodChange = (newPeriod) => {
    if (newPeriod === 'custom') {
      setPeriod('custom');
      setShowCustomPicker(true);
    } else {
      setPeriod(newPeriod);
      setShowCustomPicker(false);
      loadAllData(newPeriod);
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      await reportsApi.deleteReport(reportId);
      await fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const handleGenerateSuccess = () => {
    fetchReports();
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      fetchReports();
      return;
    }
    const filtered = reports.filter(report => 
      report.title?.toLowerCase().includes(query.toLowerCase()) ||
      report.authorName?.toLowerCase().includes(query.toLowerCase()) ||
      report.status?.toLowerCase().includes(query.toLowerCase())
    );
    setReports(filtered);
  };

  return (
    <div className="min-h-screen bg-[var(--tm-bg-app)] text-white flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-0 lg:ml-60 flex flex-col">
        {/* Header */}
        <Header onSearch={handleSearch} onGenerateReport={() => setShowGenerate(true)} />

        {/* Main scrollable content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb & Time Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
              <div className="text-sm text-slate-400">
                Home <span className="mx-2">/</span> <span className="text-[var(--tm-accent)] font-medium">Analytics</span>
              </div>
              <div className="flex flex-col gap-3 flex-wrap">
                <div className="flex gap-2 flex-wrap">
                  {['week', 'month', 'custom'].map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePeriodChange(p)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                        period === p
                          ? 'bg-[var(--tm-accent)] text-white'
                          : 'bg-[var(--tm-bg-surface)] text-gray-300 hover:bg-[var(--tm-accent)] hover:text-white'
                      }`}
                    >
                      {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : '📅 Custom'}
                    </button>
                  ))}
                </div>
                
                {/* Custom Date Picker */}
                {showCustomPicker && (
                  <div className="flex items-center gap-3 p-3 bg-[var(--tm-bg-surface)] rounded-lg border border-[var(--tm-border)]">
                    <label className="text-gray-400 text-sm">From:</label>
                    <input type="date" value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="bg-[#111621] border border-[var(--tm-border)] rounded px-3 py-1.5 text-white text-sm"/>
                    <label className="text-gray-400 text-sm">To:</label>
                    <input type="date" value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="bg-[#111621] border border-[var(--tm-border)] rounded px-3 py-1.5 text-white text-sm"/>
                    <button onClick={() => {
                      if(customFrom && customTo) {
                        loadAllData('custom');
                        setShowCustomPicker(false);
                      }
                    }} className="px-4 py-1.5 bg-[var(--tm-accent)] hover:bg-[var(--tm-accent-hover)] text-white rounded text-sm">Apply</button>
                    <button onClick={() => {
                      setShowCustomPicker(false);
                      setPeriod('week');
                      loadAllData('week');
                    }} className="px-3 py-1.5 text-gray-400 text-sm">Cancel</button>
                  </div>
                )}
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="Total Tasks"
                value={summaryData?.totalTasks}
                percentage={summaryData?.totalChange || 0}
                icon="📋"
                isLoading={loading}
                error={summaryError}
              />
              <StatCard
                title="Completed Tasks"
                value={summaryData?.completedTasks}
                percentage={summaryData?.completedChange || 0}
                icon="✓"
                isLoading={loading}
                error={summaryError}
              />
              <StatCard
                title="Productivity %"
                value={summaryData?.productivity ? `${Math.round(summaryData.productivity)}%` : '--'}
                percentage={summaryData?.productivityChange || 0}
                icon="⚡"
                isLoading={loading}
                error={summaryError}
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <WeeklyChart data={weeklyData} loading={loading} error={weeklyError} />
              </div>
              <div className="lg:col-span-1">
                <StatusChart data={statusData} loading={loading} />
              </div>
            </div>

            {/* Reports Table */}
            <ReportsTable 
              reports={reports}
              onDelete={handleDeleteReport}
              onRefresh={fetchReports}
            />
          </div>
        </div>
      </div>

      {/* Generate Report Modal */}
      <GenerateReportModal
        isOpen={showGenerate}
        onClose={() => setShowGenerate(false)}
        onSuccess={handleGenerateSuccess}
      />
    </div>
  );
}

export default App;
