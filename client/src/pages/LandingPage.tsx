import React from 'react';
import { NavPage } from '../components/Sidebar';
import {
  ArrowRight,
  Sparkles,
  Users,
  UtensilsCrossed,
  CircleDollarSign,
  Wifi,
  MapPin,
  CheckCircle2,
  XCircle,
  UploadCloud,
  BarChart3,
  FileText,
  Layers,
  Split,
  Database
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: NavPage) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Clean Hero Header */}
      <div className="panel-enterprise p-6 sm:p-8">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Aspect Sentiment Analysis</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
            Understand Hotel Customer Feedback at a Glance
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed">
            Deconstruct complex, multi-sentence hotel reviews into granular, aspect-level insights across 6 core service dimensions: <strong>Cleanliness</strong>, <strong>Staff</strong>, <strong>Food</strong>, <strong>Value</strong>, <strong>Amenities</strong>, and <strong>Location</strong> without needing thousands of manually labeled training examples.
          </p>

          {/* Quick-action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('analysis')}
              className="btn-primary"
            >
              <FileText className="w-4 h-4" />
              <span>Analyze a Review</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            <button
              onClick={() => onNavigate('bulk')}
              className="btn-secondary"
            >
              <UploadCloud className="w-4 h-4 text-slate-500" />
              <span>Bulk Upload (CSV)</span>
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="btn-secondary"
            >
              <BarChart3 className="w-4 h-4 text-slate-500" />
              <span>View Analytics</span>
            </button>
          </div>
        </div>

        {/* 4 Feature Badges Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-6 border-t border-slate-100">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Aspect Coverage</span>
            <span className="text-sm font-semibold text-slate-800">6 Core Dimensions</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">AI Architecture</span>
            <span className="text-sm font-semibold text-blue-600">Zero-Shot DeBERTa-v3</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Sentence Parser</span>
            <span className="text-sm font-semibold text-slate-800">spaCy Dependency Trees</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Polarity Resolution</span>
            <span className="text-sm font-semibold text-emerald-600">Pos / Neg / Neutral</span>
          </div>
        </div>
      </div>

      {/* Visual Demonstration: Traditional Sentiment vs Aspect-Based Analysis */}
      <div className="panel-enterprise overflow-hidden">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Why Aspect-Based Sentiment Matters
            </h2>
          </div>
          <span className="text-xs text-slate-400">Real-World Comparison</span>
        </div>

        <div className="p-6 space-y-5">
          {/* Sample Review */}
          <div className="p-3.5 bg-slate-50 rounded-md border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
              Sample Customer Review:
            </span>
            <p className="text-xs sm:text-sm text-slate-800 italic">
              "The rooms were spotless and the breakfast buffet was wonderful. However, the front desk staff was very dismissive and unhelpful."
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Traditional Document-Level */}
            <div className="p-4 rounded-md border border-rose-200 bg-rose-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  Traditional Document Sentiment
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                  Flawed
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Compresses the entire review into a single label, losing critical negative details.
              </p>
              <div className="p-2.5 bg-white rounded border border-rose-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Overall Rating:</span>
                <span className="font-bold text-emerald-700">Positive (68%)</span>
              </div>
              <p className="text-[11px] text-rose-700">
                ✕ Fails to capture the severe front desk service complaint.
              </p>
            </div>

            {/* Our Proposed Aspect Framework */}
            <div className="p-4 rounded-md border border-emerald-200 bg-emerald-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  TourABSA Aspect-Level Analysis
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Full Precision
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Evaluates each service category independently with exact supporting evidence.
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-white rounded border border-emerald-200">
                  <span className="text-[11px] text-slate-500 block">Cleanliness</span>
                  <span className="font-bold text-emerald-700 text-xs">Positive</span>
                </div>
                <div className="p-2 bg-white rounded border border-emerald-200">
                  <span className="text-[11px] text-slate-500 block">Food</span>
                  <span className="font-bold text-emerald-700 text-xs">Positive</span>
                </div>
                <div className="p-2 bg-white rounded border border-rose-200">
                  <span className="text-[11px] text-slate-500 block">Staff</span>
                  <span className="font-bold text-rose-700 text-xs">Negative</span>
                </div>
              </div>
              <p className="text-[11px] text-emerald-700">
                ✓ Hotel managers know exactly which department needs improvement.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* The 6 Predefined Hospitality Aspects Grid */}
      <div className="panel-enterprise">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              The Six Core Hospitality Aspects
            </h2>
          </div>
          <span className="text-xs text-slate-400">Predefined Domain Taxonomy</span>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-md border border-slate-200 hover:border-blue-300 transition-colors bg-white space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span>Cleanliness</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Room sanitation, fresh linens, bathroom hygiene, housekeeping upkeep, and pest control.
            </p>
          </div>

          <div className="p-4 rounded-md border border-slate-200 hover:border-blue-300 transition-colors bg-white space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span>Staff</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Front desk service, friendliness, staff attitude, helpfulness, and concierge support.
            </p>
          </div>

          <div className="p-4 rounded-md border border-slate-200 hover:border-blue-300 transition-colors bg-white space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span>Food</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Breakfast buffet, restaurant quality, culinary freshness, dining options, and room service.
            </p>
          </div>

          <div className="p-4 rounded-md border border-slate-200 hover:border-blue-300 transition-colors bg-white space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <CircleDollarSign className="w-4 h-4" />
              </div>
              <span>Value</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pricing perception, room rates, hidden fees, affordability, and overall value for money.
            </p>
          </div>

          <div className="p-4 rounded-md border border-slate-200 hover:border-blue-300 transition-colors bg-white space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <Wifi className="w-4 h-4" />
              </div>
              <span>Amenities</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Wi-Fi connectivity, swimming pool, gym, elevators, air conditioning, and parking.
            </p>
          </div>

          <div className="p-4 rounded-md border border-slate-200 hover:border-blue-300 transition-colors bg-white space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <span>Location</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Proximity to city center, transit access, walking safety, airport distance, and tourist sights.
            </p>
          </div>
        </div>
      </div>

      {/* 3 Core Architecture Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="panel-enterprise p-5 space-y-2">
          <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Zero-Shot NLI Engine</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Powered by pre-trained <strong>DeBERTa-v3</strong>. Compares customer statements directly against natural language hypotheses without requiring costly labeled training sets.
          </p>
        </div>

        <div className="panel-enterprise p-5 space-y-2">
          <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
            <Split className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Clause Segmentation</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Uses <strong>spaCy</strong> dependency parsing to split compound sentences around discourse markers like <em>but</em>, <em>however</em>, and <em>although</em> to prevent sentiment leakage.
          </p>
        </div>

        <div className="panel-enterprise p-5 space-y-2">
          <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Batch Upload &amp; Export</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Upload CSV files containing hundreds of reviews. Automatically deduplicate rows, map columns, run inferences, and export formatted spreadsheets.
          </p>
        </div>
      </div>
    </div>
  );
};
