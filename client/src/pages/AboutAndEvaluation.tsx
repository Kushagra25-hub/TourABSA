import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { EvaluationResult, HospitalityAspect } from '../types';
import {
  Award,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
  Cpu,
  Info,
  UploadCloud,
  FileCheck2,
  Database,
  Layers,
  Sparkles,
  BarChart2,
  Activity,
  Check
} from 'lucide-react';

const ALL_ASPECTS: HospitalityAspect[] = [
  'CLEANLINESS',
  'STAFF',
  'FOOD',
  'VALUE',
  'AMENITIES',
  'LOCATION'
];

export const AboutAndEvaluation: React.FC = () => {
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [isRunningEval, setIsRunningEval] = useState(false);
  const [evalStatusMessage, setEvalStatusMessage] = useState<string | null>(null);

  // Custom Gold-Standard Upload State
  const [selectedGoldFile, setSelectedGoldFile] = useState<File | null>(null);
  const [isUploadingGold, setIsUploadingGold] = useState(false);
  const [customGoldRecords, setCustomGoldRecords] = useState<any[] | null>(null);
  const [activeBenchmarkName, setActiveBenchmarkName] = useState<string>(
    'Initial 55-Record Academic Benchmark (data/benchmark_gold_standard.csv)'
  );

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await api.getEvaluationStatus();
        if (res.benchmark_info) {
          setActiveBenchmarkName(res.benchmark_info.name);
        }
        if (!res.evaluated) {
          setEvalStatusMessage(res.message);
        }
      } catch (err: any) {
        setEvalStatusMessage('Evaluation pending – manually annotated ground truth dataset required.');
      }
    }
    checkStatus();
  }, []);

  const handleRunEvaluation = async (useCustom: boolean = false) => {
    try {
      setIsRunningEval(true);
      setEvalStatusMessage(null);
      const recordsToUse = useCustom && customGoldRecords ? customGoldRecords : null;
      const res = await api.runEvaluation(recordsToUse || undefined);
      setEvalResult(res.data);
      if (res.data.benchmark_dataset) {
        setActiveBenchmarkName(res.data.benchmark_dataset);
      }
      if (res.data.status === 'pending') {
        setEvalStatusMessage(res.data.message || 'Evaluation pending – annotated ground truth required.');
      }
    } catch (err: any) {
      setEvalStatusMessage(err.message || 'Evaluation execution failed.');
    } finally {
      setIsRunningEval(false);
    }
  };

  const handleCustomGoldUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingGold(true);
      setSelectedGoldFile(file);
      const res = await api.uploadGoldStandard(file);
      setCustomGoldRecords(res.records);
      setActiveBenchmarkName(`Custom Ground Truth: ${res.filename} (${res.total_annotations} pairs)`);
      setEvalStatusMessage(`Uploaded ${res.total_annotations} custom annotations. Ready for inference evaluation.`);
    } catch (err: any) {
      alert(`Failed to upload gold standard CSV: ${err.message}`);
      setSelectedGoldFile(null);
      setCustomGoldRecords(null);
    } finally {
      setIsUploadingGold(false);
    }
  };

  const resetToDefaultBenchmark = () => {
    setSelectedGoldFile(null);
    setCustomGoldRecords(null);
    setActiveBenchmarkName('Initial 55-Record Academic Benchmark (data/benchmark_gold_standard.csv)');
    setEvalResult(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header & Protocol Attribution */}
      <div className="panel-enterprise p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-mono font-semibold uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5 text-blue-600" />
              B.TECH MAJOR PROJECT &bull; EMPIRICAL EVALUATION SUITE
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              DeBERTa-v3 Model Validation &amp; Gold-Standard Evaluation
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Strict multi-class evaluation of zero-shot NLI predictions against human-annotated hospitality ground truth. Computes empirical Precision, Recall, Macro-F1, Accuracy, and Confusion Matrices without synthetic scores.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRunEvaluation(!!customGoldRecords)}
              disabled={isRunningEval}
              className="btn-primary text-xs h-8 px-4 flex items-center gap-2"
            >
              {isRunningEval ? (
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>{isRunningEval ? 'Computing Inference Metrics...' : 'Execute Full Benchmark'}</span>
            </button>
          </div>
        </div>

        {/* Academic Integrity Verification Strip */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded flex items-start gap-3 text-xs text-slate-600 font-sans">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-slate-800 font-mono text-[11px] uppercase">[ACADEMIC INTEGRITY DIRECTIVE]: </span>
            <span className="text-slate-600 text-xs">
              All statistical indicators rendered below are derived exclusively from actual prediction tuples mapped against human gold-standard pairs. No synthetic multipliers, arbitrary confidence floors, or mock accuracy values are injected.
            </span>
          </div>
        </div>
      </div>

      {/* Dataset Selection & Benchmark Switcher */}
      <div className="panel-enterprise">
        <div className="panel-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-xs tracking-wider uppercase">
              Evaluation Ground-Truth Source Configuration
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 truncate max-w-md">
            ACTIVE TARGET: {activeBenchmarkName}
          </span>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Default Benchmark Card */}
          <div
            className={`p-4 rounded border text-xs space-y-2 cursor-pointer transition-colors ${
              !customGoldRecords
                ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
            onClick={resetToDefaultBenchmark}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-2 font-mono text-xs">
                <FileCheck2 className="w-4 h-4 text-blue-600" />
                BENCHMARK_GOLD_STANDARD.CSV
              </span>
              {!customGoldRecords && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-900 text-white rounded">
                  ACTIVE BENCHMARK
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs leading-relaxed font-sans">
              Balanced human ground truth covering all 6 hospitality aspects across positive, negative, and neutral polarities.
              Path: <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">data/benchmark_gold_standard.csv</code>.
            </p>
            <div className="text-[11px] font-mono text-slate-700 pt-1">
              Sample Volume: <strong>55 aspect-sentiment ground truth pairs</strong>
            </div>
          </div>

          {/* Custom Annotated Dataset Upload Card */}
          <div
            className={`p-4 rounded border text-xs space-y-2 transition-colors ${
              customGoldRecords
                ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-2 font-mono text-xs">
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                CUSTOM_GROUND_TRUTH_INGESTION
              </span>
              {customGoldRecords && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-700 text-white rounded">
                  CUSTOM ACTIVE (N={customGoldRecords.length})
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs leading-relaxed font-sans">
              Inject external annotated dataset for verification. Required schema: <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">review_id, aspect, gold_sentiment</code>.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <label className="btn-secondary text-xs h-7 px-3 cursor-pointer flex items-center gap-1.5 font-mono">
                <UploadCloud className="w-3.5 h-3.5 text-slate-600" />
                <span>{isUploadingGold ? 'Reading CSV...' : 'Select Ground Truth CSV'}</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCustomGoldUpload}
                  className="hidden"
                />
              </label>

              {customGoldRecords && (
                <button
                  onClick={resetToDefaultBenchmark}
                  className="text-xs text-rose-600 hover:underline font-mono"
                >
                  [Restore 55-Record Default]
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status banner when pending */}
      {evalStatusMessage && (!evalResult || !evalResult.evaluated) && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded text-xs text-amber-950 flex items-start gap-3 font-mono">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider block">[BENCHMARK_STATUS: PENDING_EXECUTION]</span>
            <p className="text-amber-900 font-sans">{evalStatusMessage}</p>
            <p className="text-[11px] text-amber-800 pt-1">
              Click <strong>"Execute Full Benchmark"</strong> at the top right to execute DeBERTa-v3 inference against the {activeBenchmarkName}.
            </p>
          </div>
        </div>
      )}

      {/* Real Computed Evaluation Results */}
      {evalResult && evalResult.evaluated && evalResult.overall && (
        <div className="space-y-6">
          {/* Top KPI Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="panel-enterprise p-4 text-center">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                Overall Accuracy (&Acirc;)
              </span>
              <span className="text-3xl font-extrabold text-blue-700 font-mono tabular-nums mt-1 block">
                {(evalResult.overall.accuracy * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                N = {evalResult.overall.total_samples} Evaluated Pairs
              </span>
            </div>

            <div className="panel-enterprise p-4 text-center">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                Macro-F1 (&fnof;<sub>macro</sub>)
              </span>
              <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums mt-1 block">
                {evalResult.overall.macro_f1.toFixed(3)}
              </span>
              <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                Unweighted Class Average
              </span>
            </div>

            <div className="panel-enterprise p-4 text-center">
              <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-wider block">
                Positive F1 (&fnof;<sub>pos</sub>)
              </span>
              <span className="text-3xl font-extrabold text-emerald-700 font-mono tabular-nums mt-1 block">
                {evalResult.overall.per_class.Positive?.f1_score.toFixed(3) || '0.000'}
              </span>
              <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                Support: {evalResult.overall.per_class.Positive?.support || 0} pairs
              </span>
            </div>

            <div className="panel-enterprise p-4 text-center">
              <span className="text-[10px] font-mono font-bold text-rose-700 uppercase tracking-wider block">
                Negative F1 (&fnof;<sub>neg</sub>)
              </span>
              <span className="text-3xl font-extrabold text-rose-700 font-mono tabular-nums mt-1 block">
                {evalResult.overall.per_class.Negative?.f1_score.toFixed(3) || '0.000'}
              </span>
              <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                Support: {evalResult.overall.per_class.Negative?.support || 0} pairs
              </span>
            </div>
          </div>

          {/* Confusion Matrix and Per-Class Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Confusion Matrix */}
            <div className="panel-enterprise">
              <div className="panel-header flex items-center justify-between">
                <span className="font-bold text-xs tracking-wider uppercase">
                  Empirical Confusion Matrix C[i, j]
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Rows: Ground Truth &bull; Cols: Predicted
                </span>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-xs text-center border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 border border-slate-200">
                      <th className="p-2 border border-slate-200 text-left font-mono font-bold text-[10px] uppercase">Actual \ Pred</th>
                      <th className="p-2 border border-slate-200 font-mono font-bold text-emerald-700">Positive</th>
                      <th className="p-2 border border-slate-200 font-mono font-bold text-rose-700">Negative</th>
                      <th className="p-2 border border-slate-200 font-mono font-bold text-slate-700">Neutral</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Positive', 'Negative', 'Neutral'].map((actual) => (
                      <tr key={actual}>
                        <td className="p-2 border border-slate-200 font-mono font-bold text-left bg-slate-50 text-slate-800 text-[11px]">
                          {actual}
                        </td>
                        {['Positive', 'Negative', 'Neutral'].map((pred) => {
                          const count = evalResult.overall?.confusion_matrix?.[actual]?.[pred] || 0;
                          const isDiagonal = actual === pred;
                          return (
                            <td
                              key={pred}
                              className={`p-2 border border-slate-200 font-mono text-xs tabular-nums ${
                                isDiagonal && count > 0
                                  ? 'bg-blue-50 font-bold text-blue-900 ring-1 ring-inset ring-blue-300'
                                  : count > 0
                                  ? 'bg-rose-50/60 text-rose-800 font-semibold'
                                  : 'text-slate-400'
                              }`}
                            >
                              {count}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Per-Class Metrics */}
            <div className="panel-enterprise">
              <div className="panel-header flex items-center justify-between">
                <span className="font-bold text-xs tracking-wider uppercase">
                  Class Polarity Resolution Metrics
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Precision, Recall, F1 Breakdown
                </span>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-700 border border-slate-200">
                    <tr>
                      <th className="py-2 px-3 font-mono font-bold text-[10px] uppercase">Polarity Class</th>
                      <th className="py-2 px-3 font-mono font-bold text-[10px] uppercase">Precision (P)</th>
                      <th className="py-2 px-3 font-mono font-bold text-[10px] uppercase">Recall (R)</th>
                      <th className="py-2 px-3 font-mono font-bold text-[10px] uppercase">F1-Score (&fnof;<sub>1</sub>)</th>
                      <th className="py-2 px-3 font-mono font-bold text-[10px] uppercase">Support</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono border-x border-b border-slate-200">
                    {['Positive', 'Negative', 'Neutral'].map((cls) => {
                      const cData = evalResult.overall?.per_class?.[cls];
                      return (
                        <tr key={cls} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 font-bold text-slate-900">{cls}</td>
                          <td className="py-2 px-3 text-slate-700 tabular-nums">{cData?.precision.toFixed(3) || '—'}</td>
                          <td className="py-2 px-3 text-slate-700 tabular-nums">{cData?.recall.toFixed(3) || '—'}</td>
                          <td className="py-2 px-3 font-bold text-blue-700 tabular-nums">{cData?.f1_score.toFixed(3) || '—'}</td>
                          <td className="py-2 px-3 text-slate-500 tabular-nums">{cData?.support ?? 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Per-Aspect Performance Breakdown */}
          {evalResult.aspect_breakdown && (
            <div className="panel-enterprise">
              <div className="panel-header flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-xs tracking-wider uppercase">
                    Per-Aspect Statistical Breakdown (6 Hospitality Dimensions)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  ZERO-SHOT NLI EVALUATION &bull; UNWEIGHTED METRICS
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 font-mono font-bold text-[10px] uppercase text-slate-600">Hospitality Aspect</th>
                      <th className="py-2.5 px-4 font-mono font-bold text-[10px] uppercase text-slate-600">Accuracy (&Acirc;)</th>
                      <th className="py-2.5 px-4 font-mono font-bold text-[10px] uppercase text-slate-600">Macro-F1 (&fnof;<sub>m</sub>)</th>
                      <th className="py-2.5 px-4 font-mono font-bold text-[10px] uppercase text-slate-600">Pos F1</th>
                      <th className="py-2.5 px-4 font-mono font-bold text-[10px] uppercase text-slate-600">Neg F1</th>
                      <th className="py-2.5 px-4 font-mono font-bold text-[10px] uppercase text-slate-600">Support (N)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {ALL_ASPECTS.map((asp) => {
                      const data = evalResult.aspect_breakdown?.[asp];
                      if (!data) return null;
                      return (
                        <tr key={asp} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-4 font-bold text-slate-900 flex items-center gap-2 font-mono">
                            <span className="w-2 h-2 rounded-xs bg-slate-800" />
                            {asp}
                          </td>
                          <td className="py-2.5 px-4 text-slate-800 font-bold tabular-nums">
                            {(data.accuracy * 100).toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-4 text-slate-900 font-bold tabular-nums">{data.macro_f1.toFixed(3)}</td>
                          <td className="py-2.5 px-4 text-emerald-700 tabular-nums">
                            {data.per_class.Positive?.f1_score.toFixed(3) || '—'}
                          </td>
                          <td className="py-2.5 px-4 text-rose-700 tabular-nums">
                            {data.per_class.Negative?.f1_score.toFixed(3) || '—'}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 tabular-nums">{data.total_samples}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Academic Objectives, Scope, and Technical Limitations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Objectives & Scope */}
        <div className="panel-enterprise p-6 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Academic Project Objectives &amp; Scope
            </h2>
          </div>
          <ul className="space-y-2 text-slate-600 leading-relaxed list-disc list-inside font-sans">
            <li>
              <strong>Zero-Shot Annotation Reduction:</strong> Eliminates the traditional supervised bottleneck requiring thousands of manually token-annotated reviews.
            </li>
            <li>
              <strong>Multi-Aspect Disentanglement:</strong> Separates conflated evaluations across Cleanliness, Staff, Food, Value, Amenities, and Location into independent hypotheses.
            </li>
            <li>
              <strong>Linguistic Explainability:</strong> Couples every probabilistic inference to an extracted supporting clause and discourse marker.
            </li>
            <li>
              <strong>Empirical Transparency:</strong> Exposes unvarnished accuracy, confusion matrix cells, and class-level macro-F1 for academic defense.
            </li>
          </ul>
        </div>

        {/* Limitations & Future Work */}
        <div className="panel-enterprise p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Empirical Limitations &amp; Future Scope
            </h2>
          </div>
          <ul className="space-y-2 text-slate-600 leading-relaxed list-disc list-inside font-sans">
            <li>
              <strong>Pragmatics &amp; Sarcasm:</strong> Ironic commendations ("The room was clean if you like dust") require higher-order contextual reasoning beyond standard NLI entailment.
            </li>
            <li>
              <strong>Domain Sub-Aspect Specialization:</strong> Food could be further subdivided (e.g., breakfast buffet vs dinner banquet) with nested hypothesis templates.
            </li>
            <li>
              <strong>Multilingual Adaptation:</strong> Current pipeline utilizes English DeBERTa-v3-small. Extending to XLM-RoBERTa is the recommended next academic milestone.
            </li>
            <li>
              <strong>Validation Fidelity:</strong> Benchmarks strictly reflect ground-truth evaluations without synthetic score inflation.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
