import React, { useState } from 'react';
import { api } from '../services/api';
import { StoredReview, HospitalityAspect } from '../types';
import { AspectBadge } from '../components/AspectBadge';
import {
  FileText,
  Send,
  RotateCcw,
  Sparkles,
  Users,
  UtensilsCrossed,
  CircleDollarSign,
  Wifi,
  MapPin,
  CheckCircle2,
  Layers,
  AlertCircle
} from 'lucide-react';

const SAMPLE_PROMPTS = [
  {
    label: 'Contrastive Review (Clean room, slow service)',
    hotel: 'The Grand Meridian Hotel',
    text: 'The hotel rooms were very clean, the staff was friendly and the breakfast was excellent. However, the location was far from the city centre and the room service was very slow.'
  },
  {
    label: 'Cleanliness & Rude Staff',
    hotel: 'Urban Central Suites',
    text: 'Impeccable room cleanliness, spotless bathroom tiles, and fresh sheets. However, the front desk receptionist was extremely rude and unhelpful during our late check-in.'
  },
  {
    label: 'Great Location & Poor Value',
    hotel: 'Azure Bay Resort & Spa',
    text: 'Unbeatable location right on the waterfront, close to restaurants and transit. But the rooms are ridiculously overpriced, Wi-Fi barely worked, and hidden parking fees ruined the value.'
  },
  {
    label: 'Neutral / Average Experience',
    hotel: 'The Grand Regency',
    text: 'The room cleanliness was okay, nothing special but not dirty either. The breakfast was standard hotel fare with ordinary bread and coffee.'
  }
];

const ALL_ASPECTS: HospitalityAspect[] = [
  'CLEANLINESS',
  'STAFF',
  'FOOD',
  'VALUE',
  'AMENITIES',
  'LOCATION'
];

export const ReviewAnalysis: React.FC = () => {
  const [reviewText, setReviewText] = useState('');
  const [hotelName, setHotelName] = useState('The Grand Meridian Hotel');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<StoredReview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!reviewText.trim()) {
      setErrorMessage('Please enter review text before submitting.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setErrorMessage(null);
      const res = await api.analyzeSingle({
        review_text: reviewText.trim(),
        hotel_name: hotelName.trim() || 'Unspecified Hotel'
      });
      setAnalysisResult(res.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Review analysis encountered an error.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const handleClear = () => {
    setReviewText('');
    setAnalysisResult(null);
    setErrorMessage(null);
  };

  const applySamplePrompt = (sample: typeof SAMPLE_PROMPTS[0]) => {
    setReviewText(sample.text);
    setHotelName(sample.hotel);
    setErrorMessage(null);
  };

  const getAspectIcon = (asp: HospitalityAspect) => {
    switch (asp) {
      case 'CLEANLINESS': return <Sparkles className="w-4 h-4 text-blue-600" />;
      case 'STAFF': return <Users className="w-4 h-4 text-indigo-600" />;
      case 'FOOD': return <UtensilsCrossed className="w-4 h-4 text-amber-600" />;
      case 'VALUE': return <CircleDollarSign className="w-4 h-4 text-emerald-600" />;
      case 'AMENITIES': return <Wifi className="w-4 h-4 text-cyan-600" />;
      case 'LOCATION': return <MapPin className="w-4 h-4 text-rose-600" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Review Input Panel */}
      <div className="panel-enterprise">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h1 className="text-sm font-bold text-slate-800">Analyze Hotel Review</h1>
          </div>
          <span className="text-xs text-slate-400">DeBERTa-v3 Zero-Shot Model</span>
        </div>

        {/* Quick Sample Selector */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200">
          <span className="text-xs font-semibold text-slate-600 block mb-2">
            Try a Sample Review:
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PROMPTS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applySamplePrompt(sample)}
                className="text-xs px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 transition-colors cursor-pointer text-left shadow-2xs"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Review Input Box */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hotel Name
            </label>
            <input
              type="text"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              placeholder="e.g. The Grand Meridian Hotel"
              className="w-full sm:w-80 px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer Review
            </label>
            <textarea
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type or paste a hotel customer review here... (Press Ctrl+Enter to analyze)"
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white leading-relaxed"
            />
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              {reviewText.length} characters &bull; {reviewText.trim().split(/\s+/).filter(Boolean).length} words
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleClear}
                disabled={isAnalyzing}
                className="btn-secondary"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Clear</span>
              </button>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !reviewText.trim()}
                className="btn-primary"
              >
                {isAnalyzing ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Review...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Analyze Review</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-5">
          {/* Overall Summary Card */}
          <div className="panel-enterprise p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 font-medium block">
                Overall Sentiment ({analysisResult.hotel_name})
              </span>
              <div className="flex items-center gap-3 mt-1">
                <AspectBadge sentiment={analysisResult.analysis.overall_sentiment} />
                <span className="text-xs text-slate-600">
                  {analysisResult.analysis.mentioned_aspect_count} of 6 aspects detected
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Processing time: <strong className="text-slate-700">{analysisResult.analysis.processing_latency_ms || 28} ms</strong>
            </div>
          </div>

          {/* Clause Segmentation Breakdown */}
          {analysisResult.analysis.clauses && analysisResult.analysis.clauses.length > 0 && (
            <div className="panel-enterprise">
              <div className="panel-header">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Extracted Sentence Clauses ({analysisResult.analysis.total_clauses})
                  </h2>
                </div>
                <span className="text-xs text-slate-400">spaCy Sentence Segmentation</span>
              </div>

              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {analysisResult.analysis.clauses.map((clause: any) => (
                  <div
                    key={clause.clause_id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 space-y-1"
                  >
                    <span className="text-[11px] font-semibold text-blue-700">
                      Clause #{clause.clause_id}
                    </span>
                    <p className="italic text-slate-800">"{clause.clause_text}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6 Predefined Aspect Cards */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Six Hospitality Dimensions Breakdown
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {ALL_ASPECTS.map((asp) => {
                const info = analysisResult.analysis.aspects[asp];
                const isMentioned = info && info.mentioned;

                return (
                  <div
                    key={asp}
                    className={`panel-enterprise p-4 space-y-2.5 transition-colors ${
                      isMentioned ? 'border-slate-300' : 'opacity-70 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getAspectIcon(asp)}
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {asp.charAt(0) + asp.slice(1).toLowerCase()}
                        </span>
                      </div>
                      <AspectBadge
                        sentiment={info?.sentiment || 'Not Mentioned'}
                        confidence={info?.confidence}
                        showConfidence={isMentioned}
                      />
                    </div>

                    {isMentioned ? (
                      <div className="space-y-2 text-xs pt-1 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400 font-medium text-[11px] block">Supporting Evidence:</span>
                          <p className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-800 italic mt-0.5">
                            "{info.supporting_evidence}"
                          </p>
                        </div>
                        <p className="text-slate-500 text-[11px] leading-relaxed">
                          {info.explanation}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 pt-1 border-t border-slate-100">
                        This aspect was not mentioned in the customer review.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
