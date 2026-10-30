const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db/database');
const nlpClient = require('../services/nlpClient');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB for up to 10,000+ reviews
});

const SAMPLE_FILE = path.join(__dirname, '..', 'data', 'sample_reviews.json');
const TRIPADVISOR_FILE = path.join(__dirname, '..', 'data', 'tripadvisor_benchmark_dataset.json');

// Helper: parse CSV lines with quote support
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  function parseLine(line) {
    const entries = [];
    let insideQuote = false;
    let entry = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuote && line[i + 1] === '"') {
          entry += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        entries.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    entries.push(entry.trim());
    return entries;
  }

  const rawHeaders = parseLine(lines[0]);
  const headers = rawHeaders.map(h => h.replace(/^["']|["']$/g, '').trim());

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === headers.length) {
      const rowObj = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] ? values[idx].replace(/^["']|["']$/g, '').trim() : '';
      });
      rows.push(rowObj);
    }
  }

  return { headers, rows };
}

// GET /api/dataset/stats - Get comprehensive dataset inventory & quality stats
router.get('/stats', (req, res) => {
  try {
    const stats = db.getDatasetStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dataset statistics.', details: err.message });
  }
});

// POST /api/dataset/load-tripadvisor - Ingest & analyze the authentic TripAdvisor benchmark dataset
router.post('/load-tripadvisor', async (req, res) => {
  try {
    if (!fs.existsSync(TRIPADVISOR_FILE)) {
      return res.status(404).json({ error: 'TripAdvisor benchmark dataset file not found.' });
    }

    const rawData = fs.readFileSync(TRIPADVISOR_FILE, 'utf8');
    const tripadvisorReviews = JSON.parse(rawData);

    // Run audit and deduplication
    const audit = db.auditAndCleanRows(tripadvisorReviews, {
      hotel_col: 'hotel_name',
      text_col: 'review_text',
      id_col: 'review_id',
      date_col: 'date',
      source_col: 'source'
    });

    console.log(`[Dataset] Audited TripAdvisor dataset: ${audit.valid_count} valid, ${audit.duplicate_count} duplicates, ${audit.invalid_count} invalid.`);

    // Analyze valid reviews through NLP batch pipeline
    const batchResult = await nlpClient.analyzeBatch(audit.valid_rows);

    const savedRecords = [];
    for (const item of batchResult.results) {
      const orig = audit.valid_rows.find(s => s.review_id === item.review_id);
      const record = db.saveReview({
        review_id: item.review_id,
        hotel_name: item.hotel_name,
        review_text: item.analysis.original_review,
        date: item.date || orig?.date || new Date().toISOString().split('T')[0],
        rating: orig?.rating || 4,
        source: 'TripAdvisor Verified Review',
        analysis: item.analysis,
        is_sample: false
      });
      savedRecords.push(record);
    }

    // Update metadata
    db.updateDatasetMetadata({
      dataset_name: 'TripAdvisor 10K / Benchmark Corpus',
      source: 'TripAdvisor Verified Hospitality Reviews',
      total_raw_records: tripadvisorReviews.length,
      valid_records: savedRecords.length,
      duplicates_filtered: audit.duplicate_count,
      invalid_records_filtered: audit.invalid_count,
      processed_count: savedRecords.length
    });

    res.json({
      success: true,
      message: `Successfully ingested and analyzed ${savedRecords.length} TripAdvisor reviews.`,
      audit: {
        total_raw: tripadvisorReviews.length,
        valid: savedRecords.length,
        duplicates_filtered: audit.duplicate_count,
        invalid_filtered: audit.invalid_count
      },
      records: savedRecords
    });
  } catch (err) {
    console.error('[TripAdvisor Ingest] Error:', err);
    res.status(500).json({ error: 'Failed to ingest TripAdvisor dataset.', details: err.message });
  }
});

// POST /api/dataset/audit-upload - Audit uploaded CSV dataset (up to 10k+ rows)
router.post('/audit-upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No dataset file was uploaded.' });
    }

    const content = req.file.buffer.toString('utf8');
    const { headers, rows } = parseCSV(content);

    if (headers.length === 0 || rows.length === 0) {
      return res.status(400).json({ error: 'Uploaded file is empty or does not contain valid CSV rows.' });
    }

    // Auto-detect mappings
    const hotelCol = headers.find(h => /hotel/i.test(h)) || headers[0];
    const textCol = headers.find(h => /(review|text|comment|body)/i.test(h)) || headers[1] || headers[0];
    const idCol = headers.find(h => /(id|code|num)/i.test(h)) || null;
    const dateCol = headers.find(h => /(date|time)/i.test(h)) || null;
    const sourceCol = headers.find(h => /(source|platform|site)/i.test(h)) || null;

    const audit = db.auditAndCleanRows(rows, {
      hotel_col: hotelCol,
      text_col: textCol,
      id_col: idCol,
      date_col: dateCol,
      source_col: sourceCol
    });

    res.json({
      success: true,
      filename: req.file.originalname,
      total_rows: rows.length,
      headers: headers,
      suggested_mapping: {
        hotel_col: hotelCol,
        text_col: textCol,
        id_col: idCol,
        date_col: dateCol,
        source_col: sourceCol
      },
      audit: {
        valid_count: audit.valid_count,
        duplicate_count: audit.duplicate_count,
        invalid_count: audit.invalid_count,
        duplicates_sample: audit.duplicates.slice(0, 5),
        invalid_sample: audit.invalid_rows.slice(0, 5)
      },
      preview_cleaned: audit.valid_rows.slice(0, 5),
      valid_rows: audit.valid_rows
    });
  } catch (err) {
    console.error('[Audit Upload] Error:', err);
    res.status(500).json({ error: 'Failed to audit uploaded dataset.', details: err.message });
  }
});

// POST /api/dataset/ingest-cleaned - Process and save audited rows into the database
router.post('/ingest-cleaned', async (req, res) => {
  try {
    const { valid_rows, dataset_source, dataset_name } = req.body;
    if (!Array.isArray(valid_rows) || valid_rows.length === 0) {
      return res.status(400).json({ error: 'No valid rows provided for ingestion.' });
    }

    // Process in batches via Python NLP Service
    const batchResult = await nlpClient.analyzeBatch(valid_rows);

    const savedRecords = [];
    for (const item of batchResult.results) {
      const orig = valid_rows.find(s => s.review_id === item.review_id);
      const record = db.saveReview({
        review_id: item.review_id,
        hotel_name: item.hotel_name,
        review_text: item.analysis.original_review,
        date: item.date || orig?.date || new Date().toISOString().split('T')[0],
        rating: orig?.rating || 4,
        source: dataset_source || orig?.source || 'Uploaded Dataset',
        analysis: item.analysis,
        is_sample: false
      });
      savedRecords.push(record);
    }

    db.updateDatasetMetadata({
      dataset_name: dataset_name || 'Custom Ingested Dataset',
      source: dataset_source || 'Uploaded CSV',
      total_raw_records: valid_rows.length,
      valid_records: savedRecords.length,
      processed_count: savedRecords.length
    });

    res.json({
      success: true,
      processed_count: savedRecords.length,
      total_latency_ms: batchResult.total_latency_ms,
      records: savedRecords
    });
  } catch (err) {
    console.error('[Ingest Cleaned] Error:', err);
    res.status(500).json({ error: 'Failed to process cleaned reviews.', details: err.message });
  }
});

// GET /api/dataset/export/cleaned - Download cleaned and deduplicated dataset as CSV
router.get('/export/cleaned', (req, res) => {
  try {
    const reviews = db.getAllReviews();
    const headers = ['Review_ID', 'Hotel_Name', 'Review_Text', 'Date', 'Rating', 'Source'];
    const lines = [headers.join(',')];

    for (const r of reviews) {
      const row = [
        `"${r.review_id || ''}"`,
        `"${(r.hotel_name || '').replace(/"/g, '""')}"`,
        `"${(r.review_text || '').replace(/"/g, '""')}"`,
        `"${r.date || ''}"`,
        r.rating || 4,
        `"${(r.source || 'TripAdvisor Reviews').replace(/"/g, '""')}"`
      ];
      lines.push(row.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tripadvisor_cleaned_dataset.csv"');
    res.status(200).send(lines.join('\n'));
  } catch (err) {
    res.status(500).json({ error: 'Failed to export cleaned dataset.', details: err.message });
  }
});

// GET /api/dataset/export/predictions - Download complete prediction outputs with aspect breakdown
router.get('/export/predictions', (req, res) => {
  try {
    const reviews = db.getAllReviews();
    const headers = [
      'Review_ID',
      'Hotel_Name',
      'Review_Text',
      'Date',
      'Overall_Sentiment',
      'Cleanliness_Sentiment',
      'Cleanliness_Confidence',
      'Staff_Sentiment',
      'Staff_Confidence',
      'Food_Sentiment',
      'Food_Confidence',
      'Value_Sentiment',
      'Value_Confidence',
      'Amenities_Sentiment',
      'Amenities_Confidence',
      'Location_Sentiment',
      'Location_Confidence',
      'Source'
    ];

    const lines = [headers.join(',')];

    for (const r of reviews) {
      const asp = r.analysis?.aspects || {};
      const row = [
        `"${r.review_id || ''}"`,
        `"${(r.hotel_name || '').replace(/"/g, '""')}"`,
        `"${(r.review_text || '').replace(/"/g, '""')}"`,
        `"${r.date || ''}"`,
        `"${r.analysis?.overall_sentiment || 'Neutral'}"`,
        `"${asp.CLEANLINESS?.sentiment || 'Not Mentioned'}"`,
        asp.CLEANLINESS?.confidence || 0,
        `"${asp.STAFF?.sentiment || 'Not Mentioned'}"`,
        asp.STAFF?.confidence || 0,
        `"${asp.FOOD?.sentiment || 'Not Mentioned'}"`,
        asp.FOOD?.confidence || 0,
        `"${asp.VALUE?.sentiment || 'Not Mentioned'}"`,
        asp.VALUE?.confidence || 0,
        `"${asp.AMENITIES?.sentiment || 'Not Mentioned'}"`,
        asp.AMENITIES?.confidence || 0,
        `"${asp.LOCATION?.sentiment || 'Not Mentioned'}"`,
        asp.LOCATION?.confidence || 0,
        `"${(r.source || 'TripAdvisor Reviews').replace(/"/g, '""')}"`
      ];
      lines.push(row.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tripadvisor_absa_predictions.csv"');
    res.status(200).send(lines.join('\n'));
  } catch (err) {
    res.status(500).json({ error: 'Failed to export prediction outputs.', details: err.message });
  }
});

// POST /api/dataset/load-sample - Load 24 sample hospitality reviews (marked as DEMO DATA)
router.post('/load-sample', async (req, res) => {
  try {
    if (!fs.existsSync(SAMPLE_FILE)) {
      return res.status(404).json({ error: 'Sample dataset file not found.' });
    }

    const rawData = fs.readFileSync(SAMPLE_FILE, 'utf8');
    const sampleReviews = JSON.parse(rawData);

    console.log(`[Dataset] Analyzing ${sampleReviews.length} sample reviews via NLP Service...`);
    const batchResult = await nlpClient.analyzeBatch(sampleReviews);

    const savedRecords = [];
    for (const item of batchResult.results) {
      const orig = sampleReviews.find(s => s.review_id === item.review_id);
      const record = db.saveReview({
        review_id: item.review_id,
        hotel_name: item.hotel_name,
        review_text: item.analysis.original_review,
        date: item.date || orig?.date || new Date().toISOString().split('T')[0],
        rating: orig?.rating || 4,
        source: 'Academic Demonstration Sample (DEMO DATA)',
        analysis: item.analysis,
        is_sample: true
      });
      savedRecords.push(record);
    }

    db.updateDatasetMetadata({
      dataset_name: 'Academic Sample Demo Set',
      source: 'Sample Synthetic Demonstration Reviews',
      total_raw_records: sampleReviews.length,
      valid_records: savedRecords.length,
      processed_count: savedRecords.length
    });

    res.json({
      success: true,
      message: `Successfully loaded and analyzed ${savedRecords.length} sample hospitality reviews. Marked as DEMO DATA.`,
      loaded_count: savedRecords.length,
      records: savedRecords
    });
  } catch (err) {
    console.error('[Dataset Load] Error:', err);
    res.status(500).json({ error: 'Failed to load sample dataset.', details: err.message });
  }
});

// DELETE /api/dataset/clear - Clear database
router.delete('/clear', (req, res) => {
  try {
    const result = db.clearDatabase();
    db.updateDatasetMetadata({
      total_raw_records: 0,
      valid_records: 0,
      duplicates_filtered: 0,
      invalid_records_filtered: 0,
      processed_count: 0
    });
    res.json({ success: true, message: 'All reviews have been successfully removed from the database.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear database.', details: err.message });
  }
});

module.exports = router;
