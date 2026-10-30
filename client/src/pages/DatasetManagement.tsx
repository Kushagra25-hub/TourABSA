import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StoredReview } from '../types';
import {
  FolderKanban,
  Database,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Filter,
  Check,
  ShieldAlert,
  Clock,
  Sparkles,
  Building2,
  Tag,
  Layers,
  FileText
} from 'lucide-react';

interface DatasetStats {
  dataset_name: string;
  source: string;
  total_records: number;
  processed_records: number;
  pending_records: number;
  duplicates_filtered: number;
  invalid_records_filtered: number;
  valid_records: number;
  sources_breakdown?: Record<string, number>;
  last_updated: string;
}

interface AuditPreview {
  total_raw: number;
  valid: number;
  duplicates_filtered: number;
  invalid_records_filtered: number;
  valid_rows: Array<{
    hotel_name: string;
    review_text: string;
    rating?: number;
    city?: string;
    date?: string;
    source: string;
  }>;
  preview_duplicates: Array<{
    reason: string;
    text_snippet: string;
  }>;
  preview_invalid: Array<{
    reason: string;
    row_snippet: any;
  }>;
}

export const DatasetManagement: React.FC = () => {
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Upload & Audit states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [auditResult, setAuditResult] = useState<AuditPreview | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  // Table filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadData = async () => {
    try {
      setIsLoadingStats(true);
      const [statsRes, reviewsRes] = await Promise.all([
        api.getDatasetStats(),
        api.getReviews({ limit: 100 })
      ]);
      setStats(statsRes.data);
      setReviews(reviewsRes.data);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to load dataset statistics.' });
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLoadTripAdvisor = async () => {
    try {
      setActionLoading('tripadvisor');
      setStatusMsg(null);
      const res = await api.loadTripAdvisorDataset();
      const audit: any = res.audit || (res as any).data?.audit || {};
      setStatusMsg({
        type: 'success',
        text: `TripAdvisor Corpus Ingestion: Processed ${audit.valid || 0} valid reviews (${audit.duplicates_filtered || 0} duplicates skipped, ${audit.invalid_filtered || audit.invalid_records_filtered || 0} invalid skipped).`
      });
      await loadData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to ingest TripAdvisor dataset.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setStatusMsg({ type: 'error', text: 'Please choose a .csv file format.' });
      return;
    }

    try {
      setSelectedFile(file);
      setIsAuditing(true);
      setStatusMsg(null);
      const res = await api.auditUpload(file);
      setAuditResult(res.audit);
      setStatusMsg({
        type: 'info',
        text: `File audited: ${res.audit.valid} valid records ready, ${res.audit.duplicates_filtered} duplicates detected, ${res.audit.invalid_records_filtered} invalid rows.`
      });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Audit of CSV file failed.' });
      setSelectedFile(null);
      setAuditResult(null);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleCommitIngest = async () => {
    if (!auditResult || !auditResult.valid_rows.length) return;
    try {
      setIsCommitting(true);
      const res = await api.ingestCleanedRecords(
        auditResult.valid_rows,
        selectedFile?.name || 'Custom Uploaded CSV'
      );
      setStatusMsg({
        type: 'success',
        text: `Successfully committed ${res.ingested_count} cleaned records into the database with zero duplicates!`
      });
      setSelectedFile(null);
      setAuditResult(null);
      await loadData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Ingestion failed.' });
    } finally {
      setIsCommitting(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const textMatch =
      !searchTerm ||
      r.review_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.hotel_name.toLowerCase().includes(searchTerm.toLowerCase());
    const sourceMatch =
      sourceFilter === 'all' ||
      (sourceFilter === 'tripadvisor' && (r.source?.toLowerCase().includes('tripadvisor') || r.city)) ||
      (sourceFilter === 'demo' && (r.source === 'sample-dataset' || !r.source)) ||
      (sourceFilter === 'custom' && r.source && !r.source.includes('tripadvisor') && r.source !== 'sample-dataset');
    
    const hasAnalysis =
      (r.analysis?.aspects && Object.values(r.analysis.aspects).some((a: any) => a.mentioned)) ||
      (r.aspects && r.aspects.length > 0);

    const statusMatch =
      statusFilter === 'all' ||
      (statusFilter === 'processed' && hasAnalysis) ||
      (statusFilter === 'pending' && !hasAnalysis);

    return textMatch && sourceMatch && statusMatch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Banner / Academic Attribution */}
      <div className="panel-enterprise p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-mono font-semibold uppercase tracking-wider mb-2">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              CORPUS INGESTION &bull; DATASET HYGIENE &amp; DEDUPLICATION
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Hospitality Corpus &amp; Dataset Hygiene Management
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Inspect raw corpus feeds, audit data quality, eliminate duplicate reviews via normalized SHA-256 hashing, validate text bounds, and coordinate DeBERTa-v3 zero-shot batch inference across TripAdvisor records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleLoadTripAdvisor}
              disabled={actionLoading === 'tripadvisor'}
              className="btn-primary text-xs h-8 px-3.5 flex items-center gap-2"
            >
              {actionLoading === 'tripadvisor' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Database className="w-3.5 h-3.5" />
              )}
              <span>{actionLoading === 'tripadvisor' ? 'Ingesting Corpus...' : 'Ingest TripAdvisor Corpus'}</span>
            </button>

            <button
              onClick={() => window.open('/api/dataset/export/cleaned', '_blank')}
              className="btn-secondary text-xs h-8 px-3 flex items-center gap-1.5"
              title="Download clean, deduplicated reviews with metadata"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export Clean CSV</span>
            </button>

            <button
              onClick={() => window.open('/api/dataset/export/predictions', '_blank')}
              className="btn-secondary text-xs h-8 px-3 flex items-center gap-1.5"
              title="Download reviews with multi-aspect DeBERTa predictions"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export Predictions</span>
            </button>

            <button
              onClick={loadData}
              className="btn-secondary text-xs h-8 px-2.5"
              title="Refresh dataset stats"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`mt-4 p-3 rounded border text-xs flex items-center gap-2 font-mono ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : statusMsg.type === 'info'
                ? 'bg-blue-50 text-blue-900 border-blue-300'
                : 'bg-rose-50 text-rose-900 border-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : statusMsg.type === 'info' ? (
              <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="panel-enterprise p-3.5">
          <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Total Ingested</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {isLoadingStats ? '...' : stats?.total_records ?? 0}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">Database Store</div>
        </div>

        <div className="panel-enterprise p-3.5">
          <div className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-wider">Clean / Valid</div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
            {isLoadingStats ? '...' : stats?.valid_records ?? 0}
          </div>
          <div className="text-[10px] font-mono text-emerald-600 mt-0.5">Hygiene Verified</div>
        </div>

        <div className="panel-enterprise p-3.5">
          <div className="text-[10px] font-mono font-bold text-amber-700 uppercase tracking-wider">Duplicates Dropped</div>
          <div className="text-xl font-bold font-mono text-amber-700 mt-1 tabular-nums">
            {isLoadingStats ? '...' : stats?.duplicates_filtered ?? 0}
          </div>
          <div className="text-[10px] font-mono text-amber-600 mt-0.5">Hash Collisions</div>
        </div>

        <div className="panel-enterprise p-3.5">
          <div className="text-[10px] font-mono font-bold text-rose-700 uppercase tracking-wider">Invalid Dropped</div>
          <div className="text-xl font-bold font-mono text-rose-700 mt-1 tabular-nums">
            {isLoadingStats ? '...' : stats?.invalid_records_filtered ?? 0}
          </div>
          <div className="text-[10px] font-mono text-rose-600 mt-0.5">Malformed / Null</div>
        </div>

        <div className="panel-enterprise p-3.5">
          <div className="text-[10px] font-mono font-bold text-blue-700 uppercase tracking-wider">DeBERTa Inferred</div>
          <div className="text-xl font-bold font-mono text-blue-700 mt-1 tabular-nums">
            {isLoadingStats ? '...' : stats?.processed_records ?? 0}
          </div>
          <div className="text-[10px] font-mono text-blue-600 mt-0.5">6-Aspect Evaluated</div>
        </div>

        <div className="panel-enterprise p-3.5">
          <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Corpus Origin</div>
          <div className="text-xs font-bold font-mono text-slate-800 mt-1.5 truncate" title={stats?.source || 'TripAdvisor'}>
            {isLoadingStats ? '...' : 'TripAdvisor 10k'}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">Authentic Data</div>
        </div>
      </div>

      {/* Dataset Ingestion & Hygiene Audit Box */}
      <div className="panel-enterprise">
        <div className="panel-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-xs tracking-wider uppercase">
              Custom Dataset Ingestion &amp; Hygiene Audit Engine
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            SCHEMA: hotel_name, review_text, [rating, city, date]
          </span>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-1 border-2 border-dashed border-slate-300 rounded p-6 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <input
              type="file"
              id="dataset-file-input"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <FileSpreadsheet className="w-8 h-8 text-blue-600 mb-2" />
            <label
              htmlFor="dataset-file-input"
              className="cursor-pointer text-xs font-mono font-bold text-blue-700 hover:text-blue-900 hover:underline"
            >
              [Select CSV File]
            </label>
            <p className="text-[10px] font-mono text-slate-500 mt-1">or drag &amp; drop TripAdvisor CSV</p>
            {selectedFile && (
              <div className="mt-3 text-xs font-mono text-slate-800 bg-white px-2 py-1 rounded border border-slate-300">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
            {isAuditing && (
              <div className="mt-2 text-xs font-mono text-blue-600 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Auditing text hygiene...</span>
              </div>
            )}
          </div>

          <div className="md:col-span-2 space-y-3">
            {auditResult ? (
              <div className="bg-slate-50 border border-slate-300 rounded p-4 space-y-3 font-mono">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-900 uppercase">Data Quality Pre-Commit Audit</span>
                  <span className="text-[11px] text-slate-600">
                    Total Raw Rows: {auditResult.total_raw}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-white border border-emerald-300 rounded">
                    <span className="text-emerald-700 font-bold block text-base tabular-nums">{auditResult.valid}</span>
                    <span className="text-emerald-800 text-[10px] uppercase font-bold">Valid &amp; Clean</span>
                  </div>
                  <div className="p-2.5 bg-white border border-amber-300 rounded">
                    <span className="text-amber-700 font-bold block text-base tabular-nums">{auditResult.duplicates_filtered}</span>
                    <span className="text-amber-800 text-[10px] uppercase font-bold">Duplicates Dropped</span>
                  </div>
                  <div className="p-2.5 bg-white border border-rose-300 rounded">
                    <span className="text-rose-700 font-bold block text-base tabular-nums">{auditResult.invalid_records_filtered}</span>
                    <span className="text-rose-800 text-[10px] uppercase font-bold">Invalid Dropped</span>
                  </div>
                </div>

                {auditResult.preview_duplicates.length > 0 && (
                  <div className="text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded border border-amber-200 font-sans">
                    <span className="font-mono font-bold text-[10px] uppercase block mb-0.5">[DUPLICATE SAMPLE DETECTED]:</span>
                    <span className="italic">"{auditResult.preview_duplicates[0].text_snippet}"</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setAuditResult(null);
                    }}
                    className="btn-secondary text-xs h-7 px-3"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleCommitIngest}
                    disabled={isCommitting || auditResult.valid === 0}
                    className="btn-primary text-xs h-7 px-3 flex items-center gap-1.5"
                  >
                    {isCommitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Commit Clean Records ({auditResult.valid})</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center text-slate-500 text-xs p-5 bg-slate-50/50 rounded border border-slate-200">
                <div className="font-mono font-bold text-slate-900 text-xs mb-1 flex items-center gap-2 uppercase">
                  <ShieldAlert className="w-4 h-4 text-blue-600" />
                  Corpus Integrity &amp; Quality Protocol
                </div>
                <p className="text-xs text-slate-600 font-sans leading-relaxed">
                  In academic evaluation, noisy reviews with duplicate premises, null text bodies, or trivial character lengths (&lt;10 chars) distort ABSA evaluation metrics. Our automated pre-ingestion audit strips duplicates via SHA-256 sentence hashing and enforces schema conformity prior to database persistence.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Database Review Records Table */}
      <div className="panel-enterprise">
        {/* Controls */}
        <div className="panel-header flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-xs tracking-wider uppercase">
              Indexed Corpus Records (N={filteredReviews.length})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search corpus text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-2.5 py-1 text-xs font-mono border border-slate-300 rounded w-48 h-7 bg-white text-slate-800"
              />
            </div>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="text-xs font-mono py-1 px-2 h-7 border border-slate-300 rounded bg-white text-slate-700"
            >
              <option value="all">Source: All</option>
              <option value="tripadvisor">TripAdvisor Corpus</option>
              <option value="demo">Demo Data</option>
              <option value="custom">Custom Uploads</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-mono py-1 px-2 h-7 border border-slate-300 rounded bg-white text-slate-700"
            >
              <option value="all">Status: All</option>
              <option value="processed">DeBERTa Inferred</option>
              <option value="pending">Pending Inference</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono font-bold text-[10px] uppercase">
                <th className="py-2.5 px-4 w-24">ID</th>
                <th className="py-2.5 px-4 w-28">Source</th>
                <th className="py-2.5 px-4 w-44">Property &amp; Locale</th>
                <th className="py-2.5 px-4">Review Premise</th>
                <th className="py-2.5 px-4 w-20">Rating</th>
                <th className="py-2.5 px-4 w-36">Inference Status</th>
                <th className="py-2.5 px-4 w-48">Detected Aspects</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 font-mono text-xs">
                    [NO_REVIEWS_FOUND_MATCHING_PREDICATE]
                  </td>
                </tr>
              ) : (
                filteredReviews.map((rev) => (
                  <tr key={rev.review_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-700 whitespace-nowrap">
                      {rev.review_id}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {rev.source?.toLowerCase().includes('tripadvisor') || rev.city ? (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                          TRIPADVISOR
                        </span>
                      ) : rev.source === 'sample-dataset' || !rev.source ? (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300">
                          DEMO DATA
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-300">
                          {rev.source}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{rev.hotel_name}</div>
                      {rev.city && (
                        <div className="text-[10px] font-mono text-slate-400 font-normal">{rev.city}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-md font-sans">
                      <p className="line-clamp-2 leading-relaxed">"{rev.review_text}"</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {rev.rating ? (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                          ★ {rev.rating}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {((rev.analysis?.aspects && Object.values(rev.analysis.aspects).some((a: any) => a.mentioned)) ||
                        (rev.aspects && rev.aspects.length > 0)) ? (
                        <span className="inline-flex items-center gap-1 text-emerald-800 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          DEBERTA_INFERRED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-800 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-amber-50 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-600" />
                          PENDING_INFERENCE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          const detected = rev.analysis?.aspects
                            ? Object.entries(rev.analysis.aspects)
                                .filter(([_, a]: any) => a.mentioned)
                                .map(([asp, a]: any) => ({ aspect: asp, sentiment: a.sentiment }))
                            : (rev.aspects || []);
                          if (detected.length === 0) {
                            return <span className="text-[10px] font-mono text-slate-400">NONE</span>;
                          }
                          return detected.map((asp: any, idx: number) => (
                            <span
                              key={idx}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                asp.sentiment === 'Positive'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : asp.sentiment === 'Negative'
                                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                            >
                              <span>{asp.aspect.slice(0, 4)}:</span>
                              <span>{asp.sentiment[0]}</span>
                            </span>
                          ));
                        })()}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
