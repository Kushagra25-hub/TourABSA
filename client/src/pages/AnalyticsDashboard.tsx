import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AnalyticsResponse, HospitalityAspect } from '../types';
import { KpiCard } from '../components/KpiCard';
import { AspectCard } from '../components/AspectCard';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import {
  FileText,
  Smile,
  Frown,
  Meh,
  Building2,
  Filter,
  RotateCcw,
  RefreshCw,
  Database,
  Calendar,
  BarChart3,
  TrendingUp,
  Activity
} from 'lucide-react';

const ALL_ASPECTS: HospitalityAspect[] = [
  'CLEANLINESS',
  'STAFF',
  'FOOD',
  'VALUE',
  'AMENITIES',
  'LOCATION'
];

export const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [hotels, setHotels] = useState<Array<{ name: string; review_count: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter States
  const [selectedHotel, setSelectedHotel] = useState('all');
  const [selectedAspect, setSelectedAspect] = useState('all');
  const [selectedSentiment, setSelectedSentiment] = useState('all');

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const [analyticsRes, hotelsRes] = await Promise.all([
        api.getAnalytics({
          hotel: selectedHotel,
          aspect: selectedAspect,
          sentiment: selectedSentiment
        }),
        api.getHotels()
      ]);
      setAnalytics(analyticsRes.data);
      setHotels(hotelsRes.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to aggregate analytics data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedHotel, selectedAspect, selectedSentiment]);

  const handleClearFilters = () => {
    setSelectedHotel('all');
    setSelectedAspect('all');
    setSelectedSentiment('all');
  };

  const handleLoadSample = async () => {
    try {
      setIsLoading(true);
      await api.loadSampleDataset();
      await fetchDashboardData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load sample dataset.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3 font-mono">
        <RefreshCw className="w-6 h-6 text-slate-700 animate-spin" />
        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
          Aggregating Inferred Hospitality Intelligence...
        </p>
      </div>
    );
  }

  const kpi = analytics?.kpi || {
    total_reviews: 0,
    positive_count: 0,
    negative_count: 0,
    neutral_count: 0,
    hotels_analyzed: 0
  };

  const aspectCards = analytics?.aspect_cards;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header & Global Multi-Criteria Filter Bar */}
      <div className="panel-enterprise">
        <div className="panel-header bg-[#0D1424] text-white">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
              Executive Decision Support &amp; Aspect Telemetry
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            AGGREGATION ENGINE: LIVE DB PERSISTENCE
          </span>
        </div>

        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] uppercase font-bold text-slate-500">Query Filters:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Hotel Filter */}
            <select
              value={selectedHotel}
              onChange={(e) => setSelectedHotel(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-300 rounded bg-white font-mono text-slate-800"
            >
              <option value="all">All Hotels ({hotels.length})</option>
              {hotels.map((h) => (
                <option key={h.name} value={h.name}>
                  {h.name} ({h.review_count})
                </option>
              ))}
            </select>

            {/* Aspect Filter */}
            <select
              value={selectedAspect}
              onChange={(e) => setSelectedAspect(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-300 rounded bg-white font-mono text-slate-800"
            >
              <option value="all">All 6 Aspects</option>
              {ALL_ASPECTS.map((asp) => (
                <option key={asp} value={asp}>
                  {asp}
                </option>
              ))}
            </select>

            {/* Sentiment Filter */}
            <select
              value={selectedSentiment}
              onChange={(e) => setSelectedSentiment(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-300 rounded bg-white font-mono text-slate-800"
            >
              <option value="all">All Polarities</option>
              <option value="Positive">Positive</option>
              <option value="Negative">Negative</option>
              <option value="Neutral">Neutral</option>
            </select>

            {(selectedHotel !== 'all' || selectedAspect !== 'all' || selectedSentiment !== 'all') && (
              <button
                onClick={handleClearFilters}
                className="btn-secondary text-[11px] h-7 px-2 font-mono text-slate-600"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}

            <button
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="btn-secondary text-[11px] h-7 px-2.5 font-mono"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 text-xs text-rose-800 font-mono">
            {errorMessage}
          </div>
        )}
      </div>

      {/* When Database is empty */}
      {kpi.total_reviews === 0 && (
        <div className="panel-enterprise p-10 text-center space-y-3 font-mono">
          <Database className="w-8 h-8 text-slate-400 mx-auto" />
          <h2 className="text-sm font-bold text-slate-800 uppercase">Database Empty</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No customer review records exist in the persistent store. Ingest reviews via the Workbench, CSV uploader, or load the research sample set.
          </p>
          <button
            onClick={handleLoadSample}
            disabled={isLoading}
            className="btn-primary h-8 text-xs font-mono mx-auto"
          >
            <Database className="w-3 h-3" />
            <span>Load Sample Dataset (24 Reviews)</span>
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      {kpi.total_reviews > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <KpiCard
              title="Reviews Analyzed"
              value={kpi.total_reviews}
              subtitle="Indexed in Database"
              icon={<FileText className="w-4 h-4 text-blue-600" />}
            />
            <KpiCard
              title="Positive Volume"
              value={kpi.positive_count}
              subtitle={`${Math.round((kpi.positive_count / (kpi.total_reviews || 1)) * 100)}% of total corpus`}
              icon={<Smile className="w-4 h-4 text-emerald-600" />}
              trend="Favorable"
              trendColor="text-emerald-700"
            />
            <KpiCard
              title="Negative Volume"
              value={kpi.negative_count}
              subtitle={`${Math.round((kpi.negative_count / (kpi.total_reviews || 1)) * 100)}% of total corpus`}
              icon={<Frown className="w-4 h-4 text-rose-600" />}
              trend="Attention Required"
              trendColor="text-rose-700"
            />
            <KpiCard
              title="Neutral / Indifferent"
              value={kpi.neutral_count}
              subtitle={`${Math.round((kpi.neutral_count / (kpi.total_reviews || 1)) * 100)}% of total corpus`}
              icon={<Meh className="w-4 h-4 text-slate-500" />}
            />
            <KpiCard
              title="Hotels Indexed"
              value={kpi.hotels_analyzed}
              subtitle="Distinct properties"
              icon={<Building2 className="w-4 h-4 text-slate-700" />}
            />
          </div>

          {/* Six Aspect Summary Cards */}
          {aspectCards && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                  Aspect Telemetry (Grounding &amp; Satisfaction Rates)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ALL_ASPECTS.map((asp) => (
                  <AspectCard key={asp} aspect={asp} data={aspectCards[asp]} />
                ))}
              </div>
            </div>
          )}

          {/* Charts Row 1: Overall Donut & Aspect Grouped Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Chart 1: Donut Chart */}
            <div className="lg:col-span-4 panel-enterprise flex flex-col justify-between">
              <div className="panel-header">
                <span className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
                  Polarity Share
                </span>
                <span className="text-[10px] font-mono text-slate-500">AGGREGATE</span>
              </div>

              <div className="p-4">
                <div className="h-56 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.charts.overall_donut || []}
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {(analytics?.charts.overall_donut || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '11px' }} />
                      <Legend verticalAlign="bottom" height={32} iconSize={6} wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-200 grid grid-cols-3 text-center text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Positive</span>
                  <span className="font-bold text-emerald-700">{kpi.positive_count}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Neutral</span>
                  <span className="font-bold text-slate-700">{kpi.neutral_count}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Negative</span>
                  <span className="font-bold text-rose-700">{kpi.negative_count}</span>
                </div>
              </div>
            </div>

            {/* Chart 2: Grouped Bar Chart */}
            <div className="lg:col-span-8 panel-enterprise">
              <div className="panel-header">
                <span className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
                  Aspect Sentiment Volume Distribution
                </span>
                <span className="text-[10px] font-mono text-slate-500">6 DIMENSIONS</span>
              </div>

              <div className="p-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.charts.grouped_aspect_bars || []}>
                      <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="aspect" tick={{ fontSize: 10, fill: '#475569', fontFamily: 'JetBrains Mono' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#475569', fontFamily: 'JetBrains Mono' }} />
                      <Tooltip wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '11px' }} />
                      <Legend iconSize={6} wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '10px' }} />
                      <Bar dataKey="positive" fill="#16A34A" name="Positive" radius={[1, 1, 0, 0]} />
                      <Bar dataKey="neutral" fill="#94A3B8" name="Neutral" radius={[1, 1, 0, 0]} />
                      <Bar dataKey="negative" fill="#DC2626" name="Negative" radius={[1, 1, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Favorability Ratios & Hotel Sentiment Stack */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Chart 3: Favorability Bar */}
            <div className="lg:col-span-6 panel-enterprise">
              <div className="panel-header">
                <span className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
                  Aspect Favorability (% Positive vs % Negative)
                </span>
                <span className="text-[10px] font-mono text-slate-500">RATIO</span>
              </div>

              <div className="p-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics?.charts.pos_vs_neg_bars || []}
                      layout="vertical"
                      margin={{ left: 10 }}
                    >
                      <CartesianGrid strokeDasharray="2 2" horizontal={false} stroke="#E2E8F0" />
                      <XAxis type="number" unit="%" tick={{ fontSize: 10, fill: '#475569', fontFamily: 'JetBrains Mono' }} domain={[0, 100]} />
                      <YAxis type="category" dataKey="aspect" tick={{ fontSize: 10, fill: '#475569', fontFamily: 'JetBrains Mono' }} width={80} />
                      <Tooltip wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '11px' }} />
                      <Legend iconSize={6} wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '10px' }} />
                      <Bar dataKey="positiveRatio" fill="#2563EB" name="Positive %" radius={[0, 1, 1, 0]} />
                      <Bar dataKey="negativeRatio" fill="#E11D48" name="Negative %" radius={[0, 1, 1, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Chart 4: Hotel Sentiment Stack */}
            <div className="lg:col-span-6 panel-enterprise">
              <div className="panel-header">
                <span className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
                  Hotel Property Sentiment Breakdown
                </span>
                <span className="text-[10px] font-mono text-slate-500">CROSS-PROPERTY</span>
              </div>

              <div className="p-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.charts.hotel_breakdown || []}>
                      <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#475569', fontFamily: 'JetBrains Mono' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#475569', fontFamily: 'JetBrains Mono' }} />
                      <Tooltip wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '11px' }} />
                      <Legend iconSize={6} wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '10px' }} />
                      <Bar dataKey="positive" fill="#16A34A" name="Positive" stackId="a" />
                      <Bar dataKey="neutral" fill="#94A3B8" name="Neutral" stackId="a" />
                      <Bar dataKey="negative" fill="#DC2626" name="Negative" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Chart 5: Chronological Trends */}
          {analytics?.charts.timeline_trends && analytics.charts.timeline_trends.length > 1 && (
            <div className="panel-enterprise">
              <div className="panel-header">
                <span className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
                  Chronological Sentiment Trajectory
                </span>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                  <Calendar className="w-3 h-3" />
                  <span>{analytics.charts.timeline_trends.length} TEMPORAL TICKS</span>
                </div>
              </div>

              <div className="p-4">
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.charts.timeline_trends}>
                      <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#475569', fontFamily: 'JetBrains Mono' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#475569', fontFamily: 'JetBrains Mono' }} />
                      <Tooltip wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '11px' }} />
                      <Legend iconSize={6} wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '10px' }} />
                      <Line type="monotone" dataKey="positive" stroke="#16A34A" strokeWidth={1.5} name="Positive" dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="negative" stroke="#DC2626" strokeWidth={1.5} name="Negative" dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="neutral" stroke="#94A3B8" strokeWidth={1.5} name="Neutral" dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
