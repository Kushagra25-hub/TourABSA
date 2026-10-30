const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', '..', 'data', 'database.json');
const DATA_DIR = path.dirname(DB_FILE);

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache synced with persistent disk file
let dbState = {
  reviews: [],
  hotels: {},
  evaluations: [],
  dataset_metadata: {
    dataset_name: "TripAdvisor Research Corpus",
    source: "TripAdvisor Verified Hospitality Reviews",
    total_raw_records: 0,
    valid_records: 0,
    duplicates_filtered: 0,
    invalid_records_filtered: 0,
    processed_count: 0,
    last_updated: null
  }
};

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      dbState = JSON.parse(data);
      if (!Array.isArray(dbState.reviews)) dbState.reviews = [];
      if (!dbState.hotels) dbState.hotels = {};
      if (!Array.isArray(dbState.evaluations)) dbState.evaluations = [];
      if (!dbState.dataset_metadata) {
        dbState.dataset_metadata = {
          dataset_name: "TripAdvisor Research Corpus",
          source: "TripAdvisor Verified Hospitality Reviews",
          total_raw_records: dbState.reviews.length,
          valid_records: dbState.reviews.length,
          duplicates_filtered: 0,
          invalid_records_filtered: 0,
          processed_count: dbState.reviews.length,
          last_updated: new Date().toISOString()
        };
      }
    } else {
      saveDatabase();
    }
  } catch (err) {
    console.error('[DB] Error loading database:', err);
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB] Error writing database to disk:', err);
  }
}

// Initial load
loadDatabase();

const ASPECTS = ['CLEANLINESS', 'STAFF', 'FOOD', 'VALUE', 'AMENITIES', 'LOCATION'];

const db = {
  // Add or update a review
  saveReview(reviewData) {
    const id = reviewData.review_id || `REV-${Date.now()}`;
    const hotelName = reviewData.hotel_name || 'Unspecified Hotel';
    
    const record = {
      ...reviewData,
      review_id: id,
      hotel_name: hotelName,
      created_at: reviewData.created_at || new Date().toISOString(),
      date: reviewData.date || new Date().toISOString().split('T')[0],
      is_sample: Boolean(reviewData.is_sample)
    };

    const existingIdx = dbState.reviews.findIndex(r => r.review_id === id);
    if (existingIdx >= 0) {
      dbState.reviews[existingIdx] = record;
    } else {
      dbState.reviews.unshift(record);
    }

    // Update hotel registry
    dbState.hotels[hotelName] = (dbState.hotels[hotelName] || 0) + (existingIdx >= 0 ? 0 : 1);
    saveDatabase();
    return record;
  },

  saveBatchReviews(records) {
    const saved = [];
    for (const r of records) {
      const res = this.saveReview(r);
      saved.push(res);
    }
    return saved;
  },

  getAllReviews(filters = {}) {
    let result = [...dbState.reviews];

    if (filters.hotel && filters.hotel !== 'all') {
      result = result.filter(r => r.hotel_name.toLowerCase() === filters.hotel.toLowerCase());
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(r => 
        (r.review_text && r.review_text.toLowerCase().includes(q)) ||
        (r.hotel_name && r.hotel_name.toLowerCase().includes(q))
      );
    }

    if (filters.aspect && filters.aspect !== 'all') {
      const asp = filters.aspect.toUpperCase();
      result = result.filter(r => {
        const aInfo = r.analysis?.aspects?.[asp];
        return aInfo && aInfo.mentioned;
      });
    }

    if (filters.sentiment && filters.sentiment !== 'all') {
      const targetSent = filters.sentiment.toLowerCase();
      if (filters.aspect && filters.aspect !== 'all') {
        const asp = filters.aspect.toUpperCase();
        result = result.filter(r => {
          const aInfo = r.analysis?.aspects?.[asp];
          return aInfo && aInfo.mentioned && aInfo.sentiment.toLowerCase() === targetSent;
        });
      } else {
        result = result.filter(r => r.analysis?.overall_sentiment?.toLowerCase() === targetSent);
      }
    }

    if (filters.sortBy === 'date-asc') {
      result.sort((a, b) => new Date(a.date || a.created_at) - new Date(b.date || b.created_at));
    } else {
      // default: latest first
      result.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
    }

    return result;
  },

  getReviewById(id) {
    return dbState.reviews.find(r => r.review_id === id);
  },

  deleteReview(id) {
    const idx = dbState.reviews.findIndex(r => r.review_id === id);
    if (idx >= 0) {
      const removed = dbState.reviews.splice(idx, 1)[0];
      saveDatabase();
      return removed;
    }
    return null;
  },

  clearDatabase() {
    dbState.reviews = [];
    dbState.hotels = {};
    saveDatabase();
    return { success: true, message: 'All reviews cleared from database.' };
  },

  getHotels() {
    const hotelCounts = {};
    for (const r of dbState.reviews) {
      hotelCounts[r.hotel_name] = (hotelCounts[r.hotel_name] || 0) + 1;
    }
    return Object.entries(hotelCounts).map(([name, count]) => ({
      name,
      review_count: count
    }));
  },

  getAnalytics(filters = {}) {
    const reviews = this.getAllReviews(filters);
    const totalReviews = reviews.length;

    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    const aspectStats = {};
    for (const asp of ASPECTS) {
      aspectStats[asp] = {
        aspect: asp,
        total_mentioned: 0,
        positive: 0,
        negative: 0,
        neutral: 0,
        positive_percentage: 0,
        negative_percentage: 0,
        neutral_percentage: 0
      };
    }

    const hotelBreakdown = {};
    const timelineData = {};

    for (const r of reviews) {
      const overall = r.analysis?.overall_sentiment || 'Neutral';
      if (overall === 'Positive') positiveCount++;
      else if (overall === 'Negative') negativeCount++;
      else neutralCount++;

      // Hotel breakdown
      const hName = r.hotel_name;
      if (!hotelBreakdown[hName]) {
        hotelBreakdown[hName] = { name: hName, positive: 0, negative: 0, neutral: 0, total: 0 };
      }
      hotelBreakdown[hName].total++;
      if (overall === 'Positive') hotelBreakdown[hName].positive++;
      else if (overall === 'Negative') hotelBreakdown[hName].negative++;
      else hotelBreakdown[hName].neutral++;

      // Timeline trend
      const dateKey = r.date || (r.created_at ? r.created_at.split('T')[0] : 'Unknown');
      if (!timelineData[dateKey]) {
        timelineData[dateKey] = { date: dateKey, positive: 0, negative: 0, neutral: 0, total: 0 };
      }
      timelineData[dateKey].total++;
      if (overall === 'Positive') timelineData[dateKey].positive++;
      else if (overall === 'Negative') timelineData[dateKey].negative++;
      else timelineData[dateKey].neutral++;

      // Aspect stats
      const aspectsObj = r.analysis?.aspects || {};
      for (const asp of ASPECTS) {
        const item = aspectsObj[asp];
        if (item && item.mentioned) {
          aspectStats[asp].total_mentioned++;
          const sent = item.sentiment;
          if (sent === 'Positive') aspectStats[asp].positive++;
          else if (sent === 'Negative') aspectStats[asp].negative++;
          else if (sent === 'Neutral') aspectStats[asp].neutral++;
        }
      }
    }

    // Compute percentages
    for (const asp of ASPECTS) {
      const st = aspectStats[asp];
      if (st.total_mentioned > 0) {
        st.positive_percentage = Math.round((st.positive / st.total_mentioned) * 100);
        st.negative_percentage = Math.round((st.negative / st.total_mentioned) * 100);
        st.neutral_percentage = Math.round((st.neutral / st.total_mentioned) * 100);
      }
    }

    // Donut chart distribution
    const donutData = [
      { name: 'Positive', value: positiveCount, color: '#16A34A' },
      { name: 'Negative', value: negativeCount, color: '#DC2626' },
      { name: 'Neutral', value: neutralCount, color: '#64748B' }
    ];

    // Grouped bar chart data for 6 aspects
    const groupedBarData = ASPECTS.map(asp => ({
      aspect: asp.charAt(0) + asp.slice(1).toLowerCase(),
      positive: aspectStats[asp].positive,
      negative: aspectStats[asp].negative,
      neutral: aspectStats[asp].neutral,
      total: aspectStats[asp].total_mentioned
    }));

    // Pos vs Neg ratio bar data
    const posVsNegData = ASPECTS.map(asp => ({
      aspect: asp.charAt(0) + asp.slice(1).toLowerCase(),
      positiveRatio: aspectStats[asp].positive_percentage,
      negativeRatio: aspectStats[asp].negative_percentage
    }));

    // Timeline sorted by date
    const sortedTimeline = Object.values(timelineData).sort((a, b) => new Date(a.date) - new Date(b.date));

    const distinctHotels = Object.keys(hotelBreakdown).length;

    return {
      kpi: {
        total_reviews: totalReviews,
        positive_count: positiveCount,
        negative_count: negativeCount,
        neutral_count: neutralCount,
        hotels_analyzed: distinctHotels
      },
      aspect_cards: aspectStats,
      charts: {
        overall_donut: donutData,
        grouped_aspect_bars: groupedBarData,
        pos_vs_neg_bars: posVsNegData,
        hotel_breakdown: Object.values(hotelBreakdown),
        timeline_trends: sortedTimeline
      }
    };
  },

  getHotelComparison(selectedHotels) {
    if (!Array.isArray(selectedHotels) || selectedHotels.length === 0) {
      return { hotels: [], aspect_comparison: [] };
    }

    const hotelMetrics = [];

    for (const hName of selectedHotels) {
      const hotelReviews = dbState.reviews.filter(r => r.hotel_name.toLowerCase() === hName.toLowerCase());
      
      const aspectData = {};
      for (const asp of ASPECTS) {
        aspectData[asp] = {
          aspect: asp,
          mentioned_count: 0,
          positive: 0,
          negative: 0,
          neutral: 0,
          positive_pct: 0,
          negative_pct: 0
        };
      }

      for (const r of hotelReviews) {
        const aspects = r.analysis?.aspects || {};
        for (const asp of ASPECTS) {
          if (aspects[asp] && aspects[asp].mentioned) {
            aspectData[asp].mentioned_count++;
            if (aspects[asp].sentiment === 'Positive') aspectData[asp].positive++;
            else if (aspects[asp].sentiment === 'Negative') aspectData[asp].negative++;
            else aspectData[asp].neutral++;
          }
        }
      }

      // Calculate percentages & determine strongest/weakest
      let strongest = { aspect: 'None', pct: -1 };
      let weakest = { aspect: 'None', pct: 101 };

      for (const asp of ASPECTS) {
        const item = aspectData[asp];
        if (item.mentioned_count > 0) {
          item.positive_pct = Math.round((item.positive / item.mentioned_count) * 100);
          item.negative_pct = Math.round((item.negative / item.mentioned_count) * 100);

          if (item.positive_pct > strongest.pct) {
            strongest = { aspect: asp, pct: item.positive_pct };
          }
          if (item.negative_pct > (weakest.pct === 101 ? -1 : weakest.pct)) {
            weakest = { aspect: asp, pct: item.negative_pct };
          }
        }
      }

      hotelMetrics.push({
        hotel_name: hName,
        total_reviews: hotelReviews.length,
        strongest_aspect: strongest.aspect !== 'None' ? `${strongest.aspect} (${strongest.pct}% Pos)` : 'Insufficient Data',
        weakest_aspect: weakest.aspect !== 'None' && weakest.pct > 0 ? `${weakest.aspect} (${weakest.pct}% Neg)` : 'None',
        aspects: aspectData
      });
    }

    // Consolidated comparison table row by row for each aspect
    const aspectComparisonRows = ASPECTS.map(asp => {
      const row = { aspect: asp };
      for (const h of hotelMetrics) {
        row[h.hotel_name] = {
          positive_pct: h.aspects[asp].positive_pct,
          negative_pct: h.aspects[asp].negative_pct,
          neutral_pct: 100 - (h.aspects[asp].positive_pct + h.aspects[asp].negative_pct),
          total_reviews: h.aspects[asp].mentioned_count
        };
      }
      return row;
    });

    return {
      hotels: hotelMetrics,
      aspect_comparison: aspectComparisonRows
    };
  },

  getDatasetStats() {
    const reviews = dbState.reviews || [];
    const meta = dbState.dataset_metadata || {};
    
    // Calculate live processing statuses
    const processedCount = reviews.filter(r => r.analysis && r.analysis.aspects).length;
    const pendingCount = reviews.length - processedCount;

    // Distinct sources
    const sources = {};
    for (const r of reviews) {
      const src = r.source || (r.is_sample ? 'Demo Dataset' : 'User Upload');
      sources[src] = (sources[src] || 0) + 1;
    }

    return {
      dataset_name: meta.dataset_name || 'TripAdvisor Research Corpus',
      source: meta.source || 'TripAdvisor Verified Hospitality Reviews',
      total_records: reviews.length,
      processed_records: processedCount,
      pending_records: pendingCount,
      duplicates_filtered: meta.duplicates_filtered || 0,
      invalid_records_filtered: meta.invalid_records_filtered || 0,
      valid_records: reviews.length,
      sources_breakdown: sources,
      last_updated: meta.last_updated || new Date().toISOString()
    };
  },

  updateDatasetMetadata(newMeta) {
    dbState.dataset_metadata = {
      ...(dbState.dataset_metadata || {}),
      ...newMeta,
      last_updated: new Date().toISOString()
    };
    saveDatabase();
    return dbState.dataset_metadata;
  },

  auditAndCleanRows(rawRows, mapping = {}) {
    const hotelCol = mapping.hotel_col;
    const textCol = mapping.text_col;
    const idCol = mapping.id_col;
    const dateCol = mapping.date_col;
    const sourceCol = mapping.source_col;

    const seenTextHashes = new Set();
    const validRows = [];
    const duplicates = [];
    const invalidRows = [];

    // Pre-populate with existing review text in database to avoid re-ingesting duplicates
    for (const r of (dbState.reviews || [])) {
      if (r.review_text) {
        const hash = r.review_text.toLowerCase().replace(/[^\w\s]/g, '').trim();
        seenTextHashes.add(hash);
      }
    }

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const reviewText = (textCol ? row[textCol] : (row.Review_Text || row.review_text || row.text || ''))?.trim();
      const hotelName = (hotelCol ? row[hotelCol] : (row.Hotel_Name || row.hotel_name || row.hotel || ''))?.trim() || 'Unspecified Hotel';
      const reviewId = (idCol && row[idCol]) ? row[idCol] : (row.Review_ID || row.review_id || `TA-${Date.now()}-${i + 1}`);
      const date = (dateCol && row[dateCol]) ? row[dateCol] : (row.Date || row.date || new Date().toISOString().split('T')[0]);
      const source = (sourceCol && row[sourceCol]) ? row[sourceCol] : (row.Source || row.source || 'TripAdvisor Reviews');

      // Invalid record check
      if (!reviewText || reviewText.length < 5) {
        invalidRows.push({
          row_index: i + 1,
          reason: 'Review text is empty or too short (< 5 characters)',
          data: row
        });
        continue;
      }

      // Duplicate check via normalized textual hash
      const textHash = reviewText.toLowerCase().replace(/[^\w\s]/g, '').trim();
      if (seenTextHashes.has(textHash)) {
        duplicates.push({
          row_index: i + 1,
          review_id: reviewId,
          hotel_name: hotelName,
          snippet: reviewText.slice(0, 70) + '...'
        });
        continue;
      }

      seenTextHashes.add(textHash);
      validRows.push({
        review_id: reviewId,
        hotel_name: hotelName,
        review_text: reviewText,
        date: date,
        source: source,
        rating: row.Rating || row.rating ? Number(row.Rating || row.rating) : 4
      });
    }

    return {
      total_input_rows: rawRows.length,
      valid_rows: validRows,
      valid_count: validRows.length,
      duplicates: duplicates,
      duplicate_count: duplicates.length,
      invalid_rows: invalidRows,
      invalid_count: invalidRows.length
    };
  }
};

module.exports = db;
