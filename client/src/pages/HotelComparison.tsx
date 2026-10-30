import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { HotelComparisonData, HospitalityAspect } from '../types';
import {
  Building2,
  Scale,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const ALL_ASPECTS: HospitalityAspect[] = [
  'CLEANLINESS',
  'STAFF',
  'FOOD',
  'VALUE',
  'AMENITIES',
  'LOCATION'
];

export const HotelComparison: React.FC = () => {
  const [availableHotels, setAvailableHotels] = useState<Array<{ name: string; review_count: number }>>([]);
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<HotelComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadHotels() {
      try {
        const res = await api.getHotels();
        setAvailableHotels(res.data);
        if (res.data.length >= 2) {
          // Default select the first two hotels
          setSelectedHotels([res.data[0].name, res.data[1].name]);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load hotels list.');
      }
    }
    loadHotels();
  }, []);

  useEffect(() => {
    if (selectedHotels.length >= 2) {
      handleCompare();
    } else {
      setComparisonData(null);
    }
  }, [selectedHotels]);

  const toggleHotelSelection = (name: string) => {
    if (selectedHotels.includes(name)) {
      if (selectedHotels.length <= 2) {
        alert('Please maintain at least two selected properties to perform an aspect comparison.');
        return;
      }
      setSelectedHotels(selectedHotels.filter((h) => h !== name));
    } else {
      setSelectedHotels([...selectedHotels, name]);
    }
  };

  const handleCompare = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await api.compareHotels(selectedHotels);
      setComparisonData(res.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Comparison failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const HOTEL_PALETTE = ['#2563EB', '#0D9488', '#D97706', '#7C3AED', '#DC2626'];

  // Format chart data: one entry per aspect, with keys for each hotel's positive percentage
  const chartData = ALL_ASPECTS.map((asp) => {
    const entry: Record<string, any> = {
      aspect: asp.charAt(0) + asp.slice(1).toLowerCase()
    };
    if (comparisonData) {
      for (const h of comparisonData.hotels) {
        entry[h.hotel_name] = h.aspects[asp]?.positive_pct || 0;
      }
    }
    return entry;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Header Card */}
      <div className="panel-enterprise p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-mono font-semibold uppercase tracking-wider mb-2">
              <Scale className="w-3.5 h-3.5 text-blue-600" />
              BENCHMARK MODULE &bull; MULTI-ENTITY ASPECT MATRIX
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Hospitality Entity Aspect-Level Benchmark Comparison
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Comparative multi-entity evaluation across the 6 canonical hospitality dimensions. Evaluates aspect-specific satisfaction distributions, cross-property polarity deltas, and relative operational deficiencies.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-50 border border-slate-300 text-slate-700">
              ACTIVE SELECTION: <strong className="text-blue-700">{selectedHotels.length}</strong> / {availableHotels.length}
            </span>
          </div>
        </div>

        {/* Hotel Selector Pills */}
        <div className="mt-5 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Select Properties to Benchmark (Minimum 2 Required):
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Click pill to toggle inclusion in benchmark
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableHotels.map((h, idx) => {
              const isSelected = selectedHotels.includes(h.name);
              return (
                <button
                  key={h.name}
                  type="button"
                  onClick={() => toggleHotelSelection(h.name)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-1 ring-slate-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                  }`}
                >
                  <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span className="font-semibold">{h.name}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                    isSelected ? 'bg-slate-800 text-blue-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    N={h.review_count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded text-xs text-rose-800 flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>[ERROR] {errorMessage}</span>
        </div>
      )}

      {selectedHotels.length < 2 && (
        <div className="panel-enterprise p-12 text-center text-slate-500 text-xs">
          Select at least two properties from the selector above to initialize the comparative benchmark matrix.
        </div>
      )}

      {comparisonData && comparisonData.hotels.length >= 2 && (
        <>
          {/* Hotel Strengths & Weaknesses Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {comparisonData.hotels.map((h, idx) => {
              const accentColor = HOTEL_PALETTE[idx % HOTEL_PALETTE.length];
              return (
                <div
                  key={h.hotel_name}
                  className="panel-enterprise flex flex-col justify-between"
                >
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: accentColor }}
                      />
                      <h2 className="text-xs font-bold text-slate-900 truncate" title={h.hotel_name}>
                        {h.hotel_name}
                      </h2>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      ID: #{idx + 1}
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-slate-500 text-[11px]">Corpus Volume:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {h.total_reviews} reviews
                      </span>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded">
                        <div className="flex items-center justify-between text-[11px] text-emerald-800 font-semibold mb-1">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                            DOMINANT ASSET:
                          </span>
                          <span className="font-mono text-[10px] text-emerald-700 font-bold">
                            {h.aspects[h.strongest_aspect as HospitalityAspect]?.positive_pct || 0}% POS
                          </span>
                        </div>
                        <span className="text-slate-900 font-bold font-mono text-xs block">
                          {h.strongest_aspect}
                        </span>
                      </div>

                      <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded">
                        <div className="flex items-center justify-between text-[11px] text-rose-800 font-semibold mb-1">
                          <span className="flex items-center gap-1">
                            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                            CRITICAL DEFICIT:
                          </span>
                          <span className="font-mono text-[10px] text-rose-700 font-bold">
                            {h.aspects[h.weakest_aspect as HospitalityAspect]?.negative_pct || 0}% NEG
                          </span>
                        </div>
                        <span className="text-slate-900 font-bold font-mono text-xs block">
                          {h.weakest_aspect}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grouped Bar Chart of Positive Sentiment % per Aspect */}
          <div className="panel-enterprise">
            <div className="panel-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-xs tracking-wider uppercase">
                  Aspect Polarity Benchmark (% Positive Satisfaction)
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                NORMALIZED DOMAIN SCORES [0.0 - 100.0%]
              </span>
            </div>

            <div className="p-6">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="aspect"
                      tick={{ fontSize: 11, fill: '#334155', fontFamily: 'JetBrains Mono, monospace' }}
                      axisLine={{ stroke: '#CBD5E1' }}
                    />
                    <YAxis
                      unit="%"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}
                      axisLine={{ stroke: '#CBD5E1' }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload) return null;
                        return (
                          <div className="bg-slate-900 text-slate-200 border border-slate-700 p-2.5 rounded shadow-lg text-xs font-mono">
                            <div className="font-bold text-white border-b border-slate-700 pb-1 mb-1.5 uppercase">
                              {label}
                            </div>
                            {payload.map((p: any) => (
                              <div key={p.name} className="flex items-center justify-between gap-4 py-0.5">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: p.color }} />
                                  <span className="text-slate-300">{p.name}:</span>
                                </span>
                                <span className="font-bold text-white">{p.value}%</span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Legend
                      iconSize={9}
                      wrapperStyle={{
                        fontSize: '11px',
                        fontFamily: 'JetBrains Mono, monospace',
                        paddingTop: '16px'
                      }}
                    />
                    {comparisonData.hotels.map((h, idx) => (
                      <Bar
                        key={h.hotel_name}
                        dataKey={h.hotel_name}
                        fill={HOTEL_PALETTE[idx % HOTEL_PALETTE.length]}
                        radius={[2, 2, 0, 0]}
                        maxBarSize={36}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Head-to-Head Aspect Comparison Table */}
          <div className="panel-enterprise">
            <div className="panel-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-xs tracking-wider uppercase">
                  Granular Aspect Matrix &amp; Comparative Differential
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                EVALUATION N = {comparisonData.hotels.reduce((acc, h) => acc + h.total_reviews, 0)} TOTAL REVIEWS
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-mono font-bold uppercase tracking-wider text-[11px] text-slate-600 border-r border-slate-200">
                      Hospitality Aspect
                    </th>
                    {comparisonData.hotels.map((h, idx) => (
                      <th key={h.hotel_name} className="px-4 py-3 font-bold text-slate-900 border-r border-slate-200 last:border-r-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-xs"
                            style={{ backgroundColor: HOTEL_PALETTE[idx % HOTEL_PALETTE.length] }}
                          />
                          <span>{h.hotel_name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {ALL_ASPECTS.map((asp) => {
                    // Find max positive pct for this aspect across selected hotels
                    const positiveRates = comparisonData.hotels.map((h) => ({
                      hotel: h.hotel_name,
                      pos: h.aspects[asp]?.positive_pct || 0,
                      total: h.aspects[asp]?.mentioned_count || 0
                    }));
                    const maxPos = Math.max(...positiveRates.filter((r) => r.total > 0).map((r) => r.pos), 0);

                    return (
                      <tr key={asp} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-semibold text-slate-900 bg-slate-50/40 border-r border-slate-200">
                          <div className="font-mono text-xs font-bold text-slate-900">
                            {asp}
                          </div>
                        </td>
                        {comparisonData.hotels.map((h) => {
                          const aspectStat = h.aspects[asp];
                          const total = aspectStat?.mentioned_count || 0;
                          if (total === 0) {
                            return (
                              <td key={h.hotel_name} className="px-4 py-3 text-slate-400 italic font-mono text-[11px] border-r border-slate-200 last:border-r-0">
                                [UNOBSERVED IN CORPUS]
                              </td>
                            );
                          }
                          const isLead = aspectStat.positive_pct === maxPos && total > 0;
                          return (
                            <td key={h.hotel_name} className="px-4 py-3 space-y-1.5 border-r border-slate-200 last:border-r-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 font-mono text-xs">
                                  <span className="font-bold text-emerald-700">
                                    {aspectStat.positive_pct}% POS
                                  </span>
                                  <span className="text-slate-300">/</span>
                                  <span className="font-bold text-rose-700">
                                    {aspectStat.negative_pct}% NEG
                                  </span>
                                </div>
                                {isLead && comparisonData.hotels.length > 1 && (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded">
                                    LEAD
                                  </span>
                                )}
                              </div>

                              {/* Precision Mini Progress Bar */}
                              <div className="w-full h-1.5 bg-slate-100 rounded-xs overflow-hidden flex">
                                <div
                                  className="h-full bg-emerald-500"
                                  style={{ width: `${aspectStat.positive_pct}%` }}
                                />
                                <div
                                  className="h-full bg-amber-400"
                                  style={{ width: `${100 - aspectStat.positive_pct - aspectStat.negative_pct}%` }}
                                />
                                <div
                                  className="h-full bg-rose-500"
                                  style={{ width: `${aspectStat.negative_pct}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                <span>Support: {total} clauses</span>
                                <span>Neu: {100 - aspectStat.positive_pct - aspectStat.negative_pct}%</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
