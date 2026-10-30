import React from 'react';
import {
  Compass,
  FileText,
  UploadCloud,
  Database,
  BarChart3,
  Building2,
  TableProperties,
  BookOpen,
  Award,
  Sparkles,
  X
} from 'lucide-react';

export type NavPage =
  | 'landing'
  | 'analysis'
  | 'bulk'
  | 'dataset'
  | 'dashboard'
  | 'comparison'
  | 'explorer'
  | 'methodology'
  | 'evaluation';

interface SidebarProps {
  currentPage: NavPage;
  onSelectPage: (page: NavPage) => void;
  systemStatus?: {
    connected: boolean;
    engine?: string;
  };
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  systemStatus,
  mobileOpen = false,
  onCloseMobile
}) => {
  const navSections = [
    {
      group: 'OVERVIEW',
      items: [
        { id: 'landing' as NavPage, label: 'Overview', icon: <Compass className="w-4 h-4" /> },
        { id: 'methodology' as NavPage, label: 'Methodology', icon: <BookOpen className="w-4 h-4" /> },
      ]
    },
    {
      group: 'ANALYSIS',
      items: [
        { id: 'analysis' as NavPage, label: 'Analyze Review', icon: <FileText className="w-4 h-4" /> },
        { id: 'bulk' as NavPage, label: 'Bulk Upload', icon: <UploadCloud className="w-4 h-4" /> },
        { id: 'dataset' as NavPage, label: 'Dataset Management', icon: <Database className="w-4 h-4" /> },
      ]
    },
    {
      group: 'INSIGHTS',
      items: [
        { id: 'dashboard' as NavPage, label: 'Analytics Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'comparison' as NavPage, label: 'Hotel Comparison', icon: <Building2 className="w-4 h-4" /> },
        { id: 'explorer' as NavPage, label: 'Review Explorer', icon: <TableProperties className="w-4 h-4" /> },
        { id: 'evaluation' as NavPage, label: 'Model Evaluation', icon: <Award className="w-4 h-4" /> },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 md:static md:translate-x-0 w-60 bg-[#0F172A] text-slate-300 flex flex-col justify-between border-r border-slate-800 shrink-0 select-none transition-transform duration-150 ease-in-out ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Simple Clean Brand Header */}
          <div className="px-4 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight">TourABSA</h1>
                <p className="text-[11px] text-slate-400">Hotel Aspect Sentiment</p>
              </div>
            </div>

            {/* Mobile close button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                title="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Simple Clean Navigation */}
          <nav className="p-3 space-y-5 flex-1 overflow-y-auto">
            {navSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  {section.group}
                </p>
                {section.items.map(item => {
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectPage(item.id);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors text-left cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                      }`}
                    >
                      <span className={isActive ? 'text-white' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Minimal Status Footer */}
          <div className="p-3.5 border-t border-slate-800 bg-[#0B1120]">
            <div className="flex items-center justify-between text-xs px-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-300 font-medium text-[11px]">DeBERTa-v3 NLI</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-medium">Ready</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
