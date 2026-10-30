import React, { useState } from 'react';
import { api } from '../services/api';
import { StoredReview } from '../types';
import { AspectBadge } from '../components/AspectBadge';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Play,
  Download,
  RotateCcw,
  Check,
  Layers,
  Sparkles,
  Terminal,
  Table,
  Cpu,
  Clock
} from 'lucide-react';

export const BulkAnalysis: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadData, setUploadData] = useState<{
    filename: string;
    total_rows: number;
    headers: string[];
    suggested_mapping: {
      hotel_col: string;
      text_col: string;
      id_col?: string;
      date_col?: string;
    };
    preview: Array<Record<string, string>>;
    raw_rows: Array<Record<string, string>>;
  } | null>(null);

  const [columnMapping, setColumnMapping] = useState({
    hotel_col: '',
    text_col: '',
    id_col: '',
    date_col: ''
  });

  const [processedRecords, setProcessedRecords] = useState<StoredReview[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile) return;
    if (!selectedFile.name.endsWith('.csv')) {
      setStatusMessage({ type: 'error', text: 'Invalid file format: Only RFC 4180 compliant .csv files are supported.' });
      return;
    }

    try {
      setIsUploading(true);
      setStatusMessage(null);
      setFile(selectedFile);
      const res = await api.uploadCSV(selectedFile);
      setUploadData(res);
      setColumnMapping({
        hotel_col: res.suggested_mapping.hotel_col || res.headers[0] || '',
        text_col: res.suggested_mapping.text_col || res.headers[1] || res.headers[0] || '',
        id_col: res.suggested_mapping.id_col || '',
        date_col: res.suggested_mapping.date_col || ''
      });
      setStatusMessage({
        type: 'success',
        text: `Parsed ${res.total_rows} rows from ${res.filename}. Auto-mapping completed.`
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'CSV upload failed.' });
      setUploadData(null);
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleProcess = async () => {
    if (!uploadData || !uploadData.raw_rows) return;
    if (!columnMapping.text_col) {
      setStatusMessage({ type: 'error', text: 'Mapping constraint violation: Review Text column is required.' });
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMessage(null);
      const res = await api.processBulk({
        rows: uploadData.raw_rows,
        mapping: columnMapping
      });
      setProcessedRecords(res.records);
      setStatusMessage({
        type: 'success',
        text: `Batch complete: Processed ${res.processed_count} reviews in ${res.total_latency_ms} ms (avg: ${res.avg_latency_ms} ms/item).`
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Batch inference pipeline failed.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSampleCSV = () => {
    window.open('/api/analysis/bulk/export', '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Workbench Header */}
      <div className="panel-enterprise">
        <div className="panel-header bg-[#0D1424] text-white">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
              Bulk Dataset Ingestion &amp; Batch DeBERTa Inference
            </span>
          </div>
          <button
            onClick={handleDownloadSampleCSV}
            className="btn-secondary h-7 px-2.5 text-[11px] font-mono bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800"
          >
            <Download className="w-3 h-3 text-slate-400" />
            <span>Download Results CSV</span>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            Ingest customer review datasets in standard CSV format. The pipeline handles automatic column detection, 
            per-row syntactic clause segmentation, candidate aspect screening, and multi-hypothesis DeBERTa NLI inference.
          </p>

          {statusMessage && (
            <div
              className={`p-2.5 rounded border text-xs font-mono flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Ingestion Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-slate-300 hover:border-slate-500 rounded p-6 text-center transition-colors bg-slate-50/60"
          >
            <div className="max-w-md mx-auto space-y-2">
              <UploadCloud className="w-7 h-7 text-slate-400 mx-auto" />
              <div>
                <p className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wide">
                  Select or Drop CSV Dataset
                </p>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  UTF-8 encoded RFC-4180 CSV with hotel and text headers
                </p>
              </div>
              <div className="pt-1">
                <label className="btn-primary text-xs h-7 px-3 font-mono cursor-pointer">
                  <span>Browse Local File</span>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Column Schema Mapping & Table Preview */}
      {uploadData && (
        <div className="panel-enterprise">
          <div className="panel-header">
            <div>
              <span className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
                Schema Mapping &amp; Column Binding
              </span>
              <p className="text-[10px] font-mono text-slate-500">
                SOURCE: <strong className="text-slate-800">{uploadData.filename}</strong> • TOTAL ROWS: <strong className="text-blue-700">{uploadData.total_rows}</strong>
              </p>
            </div>
            <button
              onClick={handleProcess}
              disabled={isProcessing || !columnMapping.text_col}
              className="btn-accent h-7 px-3 text-xs font-mono shadow-xs"
            >
              {isProcessing ? (
                <>
                  <RotateCcw className="w-3 h-3 animate-spin" />
                  <span>Executing Batch Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  <span>Execute Batch Inference</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                  Hotel Name Column *
                </label>
                <select
                  value={columnMapping.hotel_col}
                  onChange={(e) => setColumnMapping({ ...columnMapping, hotel_col: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono"
                >
                  {uploadData.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                  Review Text Column *
                </label>
                <select
                  value={columnMapping.text_col}
                  onChange={(e) => setColumnMapping({ ...columnMapping, text_col: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono"
                >
                  {uploadData.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                  Review ID (Optional)
                </label>
                <select
                  value={columnMapping.id_col}
                  onChange={(e) => setColumnMapping({ ...columnMapping, id_col: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono"
                >
                  <option value="">-- Auto-Generated ID --</option>
                  {uploadData.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                  Date Column (Optional)
                </label>
                <select
                  value={columnMapping.date_col}
                  onChange={(e) => setColumnMapping({ ...columnMapping, date_col: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono"
                >
                  <option value="">-- Current Timestamp --</option>
                  {uploadData.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* First 5 Preview Rows */}
            <div className="border border-slate-200 rounded overflow-hidden">
              <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 text-[10px] font-mono uppercase text-slate-500 font-bold">
                Raw Header &amp; Data Inspection (Sample Preview)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-100/70 border-b border-slate-200 text-[10px] text-slate-700">
                    <tr>
                      {uploadData.headers.map((h) => (
                        <th key={h} className="px-3 py-2 font-bold whitespace-nowrap">
                          {h}
                          {columnMapping.text_col === h && (
                            <span className="ml-1 text-[9px] text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">[TEXT]</span>
                          )}
                          {columnMapping.hotel_col === h && (
                            <span className="ml-1 text-[9px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">[HOTEL]</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {uploadData.preview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        {uploadData.headers.map((h) => (
                          <td key={h} className="px-3 py-2 text-slate-700 max-w-xs truncate">
                            {row[h] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Inferred Records Table */}
      {processedRecords.length > 0 && (
        <div className="panel-enterprise">
          <div className="panel-header">
            <span className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
              Batch Inference Outputs ({processedRecords.length} Items Persisted)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              PERSISTED IN DB
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-600 uppercase">
                <tr>
                  <th className="px-3 py-2 font-semibold">Review ID</th>
                  <th className="px-3 py-2 font-semibold font-sans">Hotel Property</th>
                  <th className="px-3 py-2 font-semibold">Overall</th>
                  <th className="px-3 py-2 font-semibold">Cleanliness</th>
                  <th className="px-3 py-2 font-semibold">Staff</th>
                  <th className="px-3 py-2 font-semibold">Food</th>
                  <th className="px-3 py-2 font-semibold">Value</th>
                  <th className="px-3 py-2 font-semibold">Amenities</th>
                  <th className="px-3 py-2 font-semibold">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {processedRecords.map((r) => {
                  const asp = r.analysis?.aspects || {};
                  return (
                    <tr key={r.review_id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2 font-bold text-slate-700">{r.review_id}</td>
                      <td className="px-3 py-2 font-sans font-medium text-slate-900 whitespace-nowrap">{r.hotel_name}</td>
                      <td className="px-3 py-2">
                        <AspectBadge sentiment={r.analysis?.overall_sentiment || 'Neutral'} />
                      </td>
                      <td className="px-3 py-2">
                        <AspectBadge sentiment={asp.CLEANLINESS?.sentiment || 'Not Mentioned'} />
                      </td>
                      <td className="px-3 py-2">
                        <AspectBadge sentiment={asp.STAFF?.sentiment || 'Not Mentioned'} />
                      </td>
                      <td className="px-3 py-2">
                        <AspectBadge sentiment={asp.FOOD?.sentiment || 'Not Mentioned'} />
                      </td>
                      <td className="px-3 py-2">
                        <AspectBadge sentiment={asp.VALUE?.sentiment || 'Not Mentioned'} />
                      </td>
                      <td className="px-3 py-2">
                        <AspectBadge sentiment={asp.AMENITIES?.sentiment || 'Not Mentioned'} />
                      </td>
                      <td className="px-3 py-2">
                        <AspectBadge sentiment={asp.LOCATION?.sentiment || 'Not Mentioned'} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
