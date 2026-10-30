import React, { useState } from 'react';
import { Database, Download, Trash2, CheckCircle2, AlertCircle, RefreshCw, Menu } from 'lucide-react';
import { api } from '../services/api';
import { NavPage } from './Sidebar';

interface NavbarProps {
  currentPage: NavPage;
  onRefreshData?: () => void;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onRefreshData,
  onToggleMobileMenu
}) => {
  const [loadingSample, setLoadingSample] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getPageBreadcrumb = (page: NavPage) => {
    switch (page) {
      case 'landing': return { root: 'Overview', title: 'System Overview' };
      case 'analysis': return { root: 'Analysis', title: 'Analyze Review' };
      case 'bulk': return { root: 'Analysis', title: 'Bulk Upload' };
      case 'dataset': return { root: 'Analysis', title: 'Dataset Management' };
      case 'dashboard': return { root: 'Insights', title: 'Analytics Dashboard' };
      case 'comparison': return { root: 'Insights', title: 'Hotel Comparison' };
      case 'explorer': return { root: 'Insights', title: 'Review Explorer' };
      case 'methodology': return { root: 'Overview', title: 'Methodology' };
      case 'evaluation': return { root: 'Insights', title: 'Model Evaluation' };
    }
  };

  const breadcrumb = getPageBreadcrumb(currentPage);

  const handleLoadSample = async () => {
    try {
      setLoadingSample(true);
      setStatusMsg(null);
      const res = await api.loadSampleDataset();
      setStatusMsg({ type: 'success', text: `Loaded ${res.loaded_count} sample reviews.` });
      if (onRefreshData) onRefreshData();
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to load sample data.' });
      setTimeout(() => setStatusMsg(null), 5000);
    } finally {
      setLoadingSample(false);
    }
  };

  const handleClearDb = async () => {
    if (!window.confirm('Are you sure you want to clear all reviews from the database?')) return;
    try {
      await api.clearDatabase();
      setStatusMsg({ type: 'success', text: 'Database cleared.' });
      if (onRefreshData) onRefreshData();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to clear database.' });
    }
  };

  const handleExportCSV = () => {
    window.open('/api/analysis/bulk/export', '_blank');
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Left: Mobile Toggle + Breadcrumb */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 cursor-pointer"
            title="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">
            {breadcrumb.root}
          </span>
          <span className="text-slate-300">/</span>
          <h2 className="font-semibold text-slate-800 tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-none text-xs md:text-sm">
            {breadcrumb.title}
          </h2>
        </div>
      </div>

      {/* Right: Actions and Status */}
      <div className="flex items-center gap-2">
        {/* Status Message */}
        {statusMsg && (
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Minimal Engine Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-xs text-slate-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>DeBERTa-v3 AI</span>
        </div>

        {/* Action Buttons */}
        <button
          onClick={handleLoadSample}
          disabled={loadingSample}
          className="btn-secondary h-8 px-2.5 text-xs"
          title="Load sample hotel reviews"
        >
          {loadingSample ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
          ) : (
            <Database className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span className="hidden sm:inline">{loadingSample ? 'Loading...' : 'Sample Data'}</span>
        </button>

        <button
          onClick={handleExportCSV}
          className="btn-secondary h-8 px-2.5 text-xs"
          title="Export reviews as CSV"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Export CSV</span>
        </button>

        <button
          onClick={handleClearDb}
          className="btn-secondary h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200"
          title="Clear all stored reviews"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>
    </header>
  );
};
