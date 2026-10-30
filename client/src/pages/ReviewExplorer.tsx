import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StoredReview, HospitalityAspect } from '../types';
import { AspectBadge } from '../components/AspectBadge';
import {
  Search,
  Filter,
  Eye,
  Trash2,
  X,
  Layers,
  Sparkles,
  Building2,
  Calendar,
  AlertCircle,
  FileText,
  CheckCircle2,
  HelpCircle,
  Hash,
  Database
} from 'lucide-react';

const ALL_ASPECTS: HospitalityAspect[] = [
  'CLEANLINESS',
  'STAFF',
  'FOOD',
  'VALUE',
  'AMENITIES',
  'LOCATION'
];

export const ReviewExplorer: React.FC = () => {
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const [hotels, setHotels] = useState<Array<{ name: string; review_count: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [selectedHotel, setSelectedHotel] = useState('all');
  const [selectedAspect, setSelectedAspect] = useState('all');
  const [selectedSentiment, setSelectedSentiment] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  // Modal Detail View
  const [activeReviewModal, setActiveReviewModal] = useState<StoredReview | null>(null);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const [revRes, hotRes] = await Promise.all([
        api.getReviews({
          hotel: selectedHotel,
          aspect: selectedAspect,
          sentiment: selectedSentiment,
          search: searchText,
          sortBy: sortBy
        }),
        api.getHotels()
      ]);
      setReviews(revRes.data);
      setHotels(hotRes.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load reviews.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [selectedHotel, selectedAspect, selectedSentiment, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReviews();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete review ${id}?`)) return;
    try {
      await api.deleteReview(id);
      setReviews(reviews.filter((r) => r.review_id !== id));
      if (activeReviewModal?.review_id === id) {
        setActiveReviewModal(null);
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header and Filter Controls */}
      <div className="panel-enterprise p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-mono font-semibold uppercase tracking-wider mb-2">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              CORPUS AUDIT &bull; CLAUSE-LEVEL ASPECT REPOSITORY
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Hospitality Review Audit Ledger
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
              Query, filter, and inspect clause-level zero-shot predictions across all indexed tourist reviews. Click any record row to inspect full syntactic clause trees, extracted evidence spans, and probability margins.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-3 py-1.5 rounded bg-slate-900 text-white font-bold tracking-wider">
              MATCHING ENTRIES: {reviews.length}
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 pt-4 border-t border-slate-200">
          {/* Search Box */}
          <div className="md:col-span-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search hotel name, clause, or text tokens..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 bg-white"
              />
            </form>
          </div>

          {/* Hotel Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedHotel}
              onChange={(e) => setSelectedHotel(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded bg-white text-slate-700 font-mono focus:ring-1 focus:ring-slate-900"
            >
              <option value="all">Property: All ({hotels.length})</option>
              {hotels.map((h) => (
                <option key={h.name} value={h.name}>
                  {h.name} (N={h.review_count})
                </option>
              ))}
            </select>
          </div>

          {/* Aspect Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedAspect}
              onChange={(e) => setSelectedAspect(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded bg-white text-slate-700 font-mono focus:ring-1 focus:ring-slate-900"
            >
              <option value="all">Aspect: All 6</option>
              {ALL_ASPECTS.map((asp) => (
                <option key={asp} value={asp}>
                  {asp}
                </option>
              ))}
            </select>
          </div>

          {/* Sentiment Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedSentiment}
              onChange={(e) => setSelectedSentiment(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded bg-white text-slate-700 font-mono focus:ring-1 focus:ring-slate-900"
            >
              <option value="all">Polarity: All</option>
              <option value="Positive">Positive</option>
              <option value="Negative">Negative</option>
              <option value="Neutral">Neutral</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-2 py-2 text-xs border border-slate-300 rounded bg-white text-slate-700 font-mono focus:ring-1 focus:ring-slate-900"
            >
              <option value="date-desc">Newest</option>
              <option value="date-asc">Oldest</option>
            </select>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded text-xs text-rose-800 font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>[QUERY_ERROR] {errorMessage}</span>
        </div>
      )}

      {/* Reviews Table */}
      <div className="panel-enterprise">
        <div className="panel-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-xs tracking-wider uppercase">
              Indexed Customer Review Ledger
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            TOTAL ROWS: {reviews.length} &bull; SHOWING ALL
          </span>
        </div>

        {reviews.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-mono">
            {isLoading ? '[FETCHING_CORPUS_RECORDS...]' : '[NO_REVIEWS_FOUND_MATCHING_PREDICATE]'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-mono font-bold text-[11px] text-slate-600 w-24">ID</th>
                  <th className="px-4 py-3 font-mono font-bold text-[11px] text-slate-600 w-44">Property</th>
                  <th className="px-4 py-3 font-mono font-bold text-[11px] text-slate-600">Review Premise</th>
                  <th className="px-4 py-3 font-mono font-bold text-[11px] text-slate-600 w-28">Polarity</th>
                  <th className="px-4 py-3 font-mono font-bold text-[11px] text-slate-600">Extracted Aspects</th>
                  <th className="px-4 py-3 font-mono font-bold text-[11px] text-slate-600 w-28">Timestamp</th>
                  <th className="px-4 py-3 font-mono font-bold text-[11px] text-slate-600 text-right w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reviews.map((r) => {
                  const aspects = r.analysis?.aspects || {};
                  const mentionedAspects = Object.values(aspects).filter((a) => a.mentioned);

                  return (
                    <tr
                      key={r.review_id}
                      onClick={() => setActiveReviewModal(r)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span>{r.review_id}</span>
                          {r.is_sample && (
                            <span className="text-[9px] px-1 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded font-mono font-bold">
                              DEMO
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {r.hotel_name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-sm truncate font-sans">
                        "{r.review_text}"
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <AspectBadge sentiment={r.analysis?.overall_sentiment || 'Neutral'} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {mentionedAspects.length === 0 ? (
                            <span className="text-[10px] font-mono text-slate-400">NONE_DETECTED</span>
                          ) : (
                            mentionedAspects.map((a) => (
                              <span
                                key={a.aspect}
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${
                                  a.sentiment === 'Positive'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : a.sentiment === 'Negative'
                                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                                    : 'bg-amber-50 text-amber-800 border-amber-300'
                                }`}
                              >
                                {a.aspect.slice(0, 4)}: {a.sentiment[0]}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {r.date}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveReviewModal(r);
                            }}
                            className="p-1 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded border border-slate-200"
                            title="Inspect Review Diagnostics"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(r.review_id, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded border border-slate-200"
                            title="Purge Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Inspection Modal / Diagnostic Console */}
      {activeReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-slate-300">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700 font-bold">
                  RECORD_ID: {activeReviewModal.review_id}
                </span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-sm font-bold text-white">
                  {activeReviewModal.hotel_name}
                </span>
                {activeReviewModal.is_sample && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-600 font-mono font-bold">
                    BENCHMARK DEMO RECORD
                  </span>
                )}
              </div>
              <button
                onClick={() => setActiveReviewModal(null)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Full Text Premise */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                    Full Customer Text Premise (Premise P)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {activeReviewModal.review_text.length} chars &bull; {activeReviewModal.review_text.split(/\s+/).length} words
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 font-sans leading-relaxed">
                  "{activeReviewModal.review_text}"
                </div>
              </div>

              {/* Syntactic Clauses Tree */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                    spaCy Clause Segmentation Tree ({activeReviewModal.analysis?.total_clauses || 0} Clauses)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Discourse Boundaries &amp; Contrast Detection
                  </span>
                </div>
                <div className="space-y-1.5">
                  {(activeReviewModal.analysis?.clauses || []).map((c) => (
                    <div
                      key={c.clause_id}
                      className="p-2.5 bg-white rounded border border-slate-300 text-xs text-slate-800 flex items-start gap-2.5 font-mono"
                    >
                      <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-blue-700 text-[10px] font-bold rounded shrink-0">
                        CLAUSE #{c.clause_id}
                      </span>
                      <span className="font-sans text-xs flex-1">
                        "{c.clause_text}"
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6 Predefined Aspects Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                    Six Hospitality Dimensions (DeBERTa NLI Predictions)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Threshold &theta; &ge; 0.50 &bull; Margin &Delta; &ge; 0.08
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ALL_ASPECTS.map((asp) => {
                    const info = activeReviewModal.analysis?.aspects?.[asp];
                    const isMentioned = info && info.mentioned;

                    return (
                      <div
                        key={asp}
                        className={`p-3.5 rounded border text-xs space-y-2 ${
                          isMentioned
                            ? 'bg-white border-slate-300 shadow-2xs'
                            : 'bg-slate-50/70 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 font-mono tracking-wider">{asp}</span>
                          <AspectBadge
                            sentiment={info?.sentiment || 'Not Mentioned'}
                            confidence={info?.confidence}
                            showConfidence={isMentioned}
                          />
                        </div>

                        {isMentioned ? (
                          <div className="space-y-1.5 pt-1 border-t border-slate-100">
                            <div>
                              <span className="text-[10px] font-mono text-slate-500 uppercase block">
                                Grounded Text Evidence:
                              </span>
                              <p className="text-[11px] font-sans text-slate-800 bg-slate-50 p-2 rounded border border-slate-200 mt-0.5 italic">
                                "{info.supporting_evidence}"
                              </p>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-tight">
                              {info.explanation}
                            </p>
                          </div>
                        ) : (
                          <div className="text-[10px] font-mono text-slate-400 pt-1">
                            No aspect lexical priors or entailment above threshold detected.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">
                INGESTED: {activeReviewModal.date} &bull; PIPELINE: SPACY_V3 + DEBERTA_V3
              </span>
              <button
                onClick={() => setActiveReviewModal(null)}
                className="btn-secondary text-xs h-7 px-3"
              >
                Close Console
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
