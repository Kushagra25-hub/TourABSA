import {
  ReviewAnalysisData,
  StoredReview,
  AnalyticsResponse,
  HotelComparisonData,
  EvaluationResult
} from '../types';

export const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : import.meta.env.PROD
  ? 'https://tourabsa.onrender.com/api'
  : '/api';

export const api = {
  // Check Backend and NLP Health
  async checkHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Backend health check failed');
    return res.json();
  },

  // Analyze single review
  async analyzeSingle(data: {
    review_text: string;
    hotel_name?: string;
    date?: string;
    rating?: number;
  }): Promise<{ success: boolean; data: StoredReview; message: string }> {
    const res = await fetch(`${API_BASE}/analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Analysis failed' }));
      throw new Error(err.error || err.details || 'Analysis failed');
    }
    return res.json();
  },

  // Get all reviews with filters
  async getReviews(params: {
    hotel?: string;
    aspect?: string;
    sentiment?: string;
    search?: string;
    sortBy?: string;
    limit?: number;
  } = {}): Promise<{ success: boolean; count: number; data: StoredReview[] }> {
    const query = new URLSearchParams();
    if (params.hotel && params.hotel !== 'all') query.append('hotel', params.hotel);
    if (params.aspect && params.aspect !== 'all') query.append('aspect', params.aspect);
    if (params.sentiment && params.sentiment !== 'all') query.append('sentiment', params.sentiment);
    if (params.search) query.append('search', params.search);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.limit) query.append('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/analysis?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch reviews list');
    return res.json();
  },

  // Get review by ID
  async getReviewById(id: string): Promise<{ success: boolean; data: StoredReview }> {
    const res = await fetch(`${API_BASE}/analysis/${id}`);
    if (!res.ok) throw new Error('Review not found');
    return res.json();
  },

  // Delete review
  async deleteReview(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/analysis/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete review');
    return res.json();
  },

  // Upload CSV file
  async uploadCSV(file: File): Promise<{
    success: boolean;
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
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/analysis/bulk/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'CSV Upload failed' }));
      throw new Error(err.error || 'Failed to upload CSV file');
    }
    return res.json();
  },

  // Process bulk rows
  async processBulk(payload: {
    rows: Array<Record<string, string>>;
    mapping: {
      hotel_col: string;
      text_col: string;
      id_col?: string;
      date_col?: string;
    };
  }): Promise<{
    success: boolean;
    processed_count: number;
    avg_latency_ms: number;
    total_latency_ms: number;
    records: StoredReview[];
  }> {
    const res = await fetch(`${API_BASE}/analysis/bulk/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Bulk process failed' }));
      throw new Error(err.error || 'Bulk processing failed');
    }
    return res.json();
  },

  // Get analytics data
  async getAnalytics(params: {
    hotel?: string;
    aspect?: string;
    sentiment?: string;
  } = {}): Promise<{ success: boolean; data: AnalyticsResponse }> {
    const query = new URLSearchParams();
    if (params.hotel && params.hotel !== 'all') query.append('hotel', params.hotel);
    if (params.aspect && params.aspect !== 'all') query.append('aspect', params.aspect);
    if (params.sentiment && params.sentiment !== 'all') query.append('sentiment', params.sentiment);

    const res = await fetch(`${API_BASE}/analytics?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  // Get hotels list
  async getHotels(): Promise<{ success: boolean; count: number; data: Array<{ name: string; review_count: number }> }> {
    const res = await fetch(`${API_BASE}/hotels`);
    if (!res.ok) throw new Error('Failed to fetch hotels list');
    return res.json();
  },

  // Compare multiple hotels
  async compareHotels(hotels: string[]): Promise<{ success: boolean; data: HotelComparisonData }> {
    const res = await fetch(`${API_BASE}/hotels/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotels })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Comparison failed' }));
      throw new Error(err.error || 'Failed to compare hotels');
    }
    return res.json();
  },

  // Load sample dataset
  async loadSampleDataset(): Promise<{ success: boolean; message: string; loaded_count: number }> {
    const res = await fetch(`${API_BASE}/dataset/load-sample`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to load sample dataset' }));
      throw new Error(err.error || 'Failed to load sample data');
    }
    return res.json();
  },

  // Dataset Management: Get dataset statistics & source breakdown
  async getDatasetStats(): Promise<{ success: boolean; data: any }> {
    const res = await fetch(`${API_BASE}/dataset/stats`);
    if (!res.ok) throw new Error('Failed to fetch dataset stats');
    return res.json();
  },

  // Dataset Management: Load pre-configured TripAdvisor benchmark dataset
  async loadTripAdvisorDataset(): Promise<{
    success: boolean;
    message: string;
    audit: { total_raw: number; valid: number; duplicates_filtered: number; invalid_filtered: number };
    records: StoredReview[];
  }> {
    const res = await fetch(`${API_BASE}/dataset/load-tripadvisor`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to load TripAdvisor dataset' }));
      throw new Error(err.error || 'Failed to load TripAdvisor dataset');
    }
    return res.json();
  },

  // Dataset Management: Audit uploaded dataset for duplicates & invalids
  async auditUploadDataset(file: File): Promise<{
    success: boolean;
    filename: string;
    total_rows: number;
    headers: string[];
    suggested_mapping: any;
    audit: {
      valid_count: number;
      duplicate_count: number;
      invalid_count: number;
      duplicates_sample: any[];
      invalid_sample: any[];
    };
    preview_cleaned: any[];
    valid_rows: any[];
  }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/dataset/audit-upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Audit failed' }));
      throw new Error(err.error || 'Failed to audit uploaded dataset');
    }
    return res.json();
  },

  // Dataset Management: Audit uploaded dataset for duplicates & invalids
  async auditUpload(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/dataset/audit-upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Audit failed' }));
      throw new Error(err.error || 'Failed to audit uploaded dataset');
    }
    return res.json();
  },

  // Dataset Management: Ingest cleaned dataset into database
  async ingestCleanedRecords(valid_rows: any[], source?: string): Promise<{
    success: boolean;
    ingested_count: number;
    total_in_db: number;
    audit: any;
  }> {
    const res = await fetch(`${API_BASE}/dataset/ingest-cleaned`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valid_rows, dataset_source: source })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Ingestion failed' }));
      throw new Error(err.error || 'Failed to ingest cleaned dataset');
    }
    return res.json();
  },

  // Dataset Management: Ingest cleaned dataset into database (alias)
  async ingestCleanedDataset(payload: {
    valid_rows: any[];
    dataset_name?: string;
    dataset_source?: string;
  }): Promise<{
    success: boolean;
    processed_count: number;
    total_latency_ms: number;
    records: StoredReview[];
  }> {
    const res = await fetch(`${API_BASE}/dataset/ingest-cleaned`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Ingestion failed' }));
      throw new Error(err.error || 'Failed to ingest cleaned dataset');
    }
    return res.json();
  },

  // Evaluation: Upload custom gold standard annotations CSV
  async uploadGoldStandard(file: File): Promise<{
    success: boolean;
    filename: string;
    total_annotations: number;
    records: any[];
    preview: any[];
  }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/evaluation/upload-gold`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Failed to upload gold-standard annotations');
    }
    return res.json();
  },

  // Clear database
  async clearDatabase(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/dataset/clear`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear database');
    return res.json();
  },

  // Get evaluation status
  async getEvaluationStatus(): Promise<{
    evaluated: boolean;
    status: string;
    message: string;
    benchmark_info?: { name: string; total_annotations: number; source: string };
  }> {
    const res = await fetch(`${API_BASE}/evaluation/status`);
    if (!res.ok) throw new Error('Failed to check evaluation status');
    return res.json();
  },

  // Run evaluation
  async runEvaluation(customRecords?: any[]): Promise<{ success: boolean; data: EvaluationResult }> {
    const res = await fetch(`${API_BASE}/evaluation/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom_gold_records: customRecords })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Evaluation run failed' }));
      throw new Error(err.error || 'Evaluation failed');
    }
    return res.json();
  }
};
