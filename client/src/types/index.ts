export type HospitalityAspect =
  | 'CLEANLINESS'
  | 'STAFF'
  | 'FOOD'
  | 'VALUE'
  | 'AMENITIES'
  | 'LOCATION';

export type SentimentType = 'Positive' | 'Negative' | 'Neutral' | 'Not Mentioned';

export interface ClauseItem {
  clause_id: number;
  clause_text: string;
  sentence_index: number;
  sentence_text: string;
  word_count: number;
}

export interface AspectAnalysisResult {
  mentioned: boolean;
  aspect: HospitalityAspect;
  sentiment: SentimentType;
  confidence: number;
  supporting_evidence: string;
  primary_clause: string | null;
  clause_count: number;
  explanation: string;
  nli_distribution?: Record<string, number>;
}

export interface ReviewAnalysisData {
  original_review: string;
  engine_info: {
    name: string;
    framework: string;
    model_status: string;
    checkpoint?: string;
    device?: string;
    label_mapping?: Record<string, string>;
  };
  total_clauses: number;
  clauses: ClauseItem[];
  aspects: Record<HospitalityAspect, AspectAnalysisResult>;
  mentioned_aspect_count: number;
  overall_sentiment: 'Positive' | 'Negative' | 'Neutral';
  processing_latency_ms?: number;
  hotel_name?: string;
}

export interface StoredReview {
  review_id: string;
  hotel_name: string;
  review_text: string;
  date: string;
  rating?: number;
  city?: string;
  source?: string;
  aspects?: Array<{ aspect: HospitalityAspect; sentiment: SentimentType; confidence?: number }>;
  analysis: ReviewAnalysisData;
  created_at: string;
  is_sample?: boolean;
}

export interface AspectSummaryCardData {
  aspect: HospitalityAspect;
  total_mentioned: number;
  positive: number;
  negative: number;
  neutral: number;
  positive_percentage: number;
  negative_percentage: number;
  neutral_percentage: number;
}

export interface AnalyticsResponse {
  kpi: {
    total_reviews: number;
    positive_count: number;
    negative_count: number;
    neutral_count: number;
    hotels_analyzed: number;
  };
  aspect_cards: Record<HospitalityAspect, AspectSummaryCardData>;
  charts: {
    overall_donut: Array<{ name: string; value: number; color: string }>;
    grouped_aspect_bars: Array<{
      aspect: string;
      positive: number;
      negative: number;
      neutral: number;
      total: number;
    }>;
    pos_vs_neg_bars: Array<{
      aspect: string;
      positiveRatio: number;
      negativeRatio: number;
    }>;
    hotel_breakdown: Array<{
      name: string;
      positive: number;
      negative: number;
      neutral: number;
      total: number;
    }>;
    timeline_trends: Array<{
      date: string;
      positive: number;
      negative: number;
      neutral: number;
      total: number;
    }>;
  };
}

export interface HotelComparisonData {
  hotels: Array<{
    hotel_name: string;
    total_reviews: number;
    strongest_aspect: string;
    weakest_aspect: string;
    aspects: Record<HospitalityAspect, {
      aspect: string;
      mentioned_count: number;
      positive: number;
      negative: number;
      neutral: number;
      positive_pct: number;
      negative_pct: number;
    }>;
  }>;
  aspect_comparison: Array<Record<string, any>>;
}

export interface EvaluationMetrics {
  accuracy: number;
  macro_f1: number;
  per_class: Record<string, {
    precision: number;
    recall: number;
    f1_score: number;
    support: number;
  }>;
  confusion_matrix: Record<string, Record<string, number>>;
  total_samples: number;
}

export interface EvaluationResult {
  status: 'pending' | 'success' | 'error';
  evaluated: boolean;
  message?: string;
  overall?: EvaluationMetrics;
  aspect_breakdown?: Record<HospitalityAspect, any>;
  sample_count?: number;
  benchmark_dataset?: string;
  timestamp?: string;
}
