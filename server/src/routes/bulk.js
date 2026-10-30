const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../db/database');
const nlpClient = require('../services/nlpClient');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper: Parse CSV buffer into rows and headers handling quotes
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

// POST /api/analysis/bulk/upload - Upload and parse CSV preview
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file was uploaded.' });
    }

    const csvContent = req.file.buffer.toString('utf8');
    const { headers, rows } = parseCSV(csvContent);

    if (headers.length === 0 || rows.length === 0) {
      return res.status(400).json({ error: 'Uploaded CSV file contains no valid data or headers.' });
    }

    // Auto-detect default columns
    let suggestedHotelCol = headers.find(h => /hotel/i.test(h)) || headers[0];
    let suggestedTextCol = headers.find(h => /(review|text|comment|body)/i.test(h)) || (headers[1] || headers[0]);
    let suggestedIdCol = headers.find(h => /(id|code|num)/i.test(h)) || null;
    let suggestedDateCol = headers.find(h => /(date|time)/i.test(h)) || null;

    res.json({
      success: true,
      filename: req.file.originalname,
      total_rows: rows.length,
      headers: headers,
      suggested_mapping: {
        hotel_col: suggestedHotelCol,
        text_col: suggestedTextCol,
        id_col: suggestedIdCol,
        date_col: suggestedDateCol
      },
      preview: rows.slice(0, 5),
      raw_rows: rows
    });
  } catch (err) {
    console.error('[Bulk Upload] Error:', err);
    res.status(500).json({ error: 'Failed to process CSV file.', details: err.message });
  }
});

// POST /api/analysis/bulk/process - Process reviews in batch
router.post('/process', async (req, res) => {
  try {
    const { rows, mapping } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No rows provided for processing.' });
    }

    const hotelCol = mapping?.hotel_col;
    const textCol = mapping?.text_col;
    const idCol = mapping?.id_col;
    const dateCol = mapping?.date_col;

    if (!textCol) {
      return res.status(400).json({ error: 'A review text column must be mapped.' });
    }

    // Format for NLP service
    const reviewsToAnalyze = rows.map((r, idx) => ({
      review_id: (idCol && r[idCol]) ? r[idCol] : `BULK-${Date.now()}-${idx + 1}`,
      hotel_name: (hotelCol && r[hotelCol]) ? r[hotelCol] : 'Unspecified Hotel',
      review_text: r[textCol] || '',
      date: (dateCol && r[dateCol]) ? r[dateCol] : new Date().toISOString().split('T')[0]
    })).filter(item => item.review_text.trim().length > 0);

    if (reviewsToAnalyze.length === 0) {
      return res.status(400).json({ error: 'No valid review text found in mapped rows.' });
    }

    // Call Python batch analysis endpoint
    const batchResult = await nlpClient.analyzeBatch(reviewsToAnalyze);

    // Save each to database
    const savedRecords = [];
    for (const item of batchResult.results) {
      const record = db.saveReview({
        review_id: item.review_id,
        hotel_name: item.hotel_name,
        review_text: item.analysis.original_review,
        date: item.date,
        rating: 4,
        analysis: item.analysis,
        is_sample: false
      });
      savedRecords.push(record);
    }

    res.json({
      success: true,
      processed_count: savedRecords.length,
      avg_latency_ms: batchResult.avg_latency_ms,
      total_latency_ms: batchResult.total_latency_ms,
      records: savedRecords
    });
  } catch (err) {
    console.error('[Bulk Process] Error:', err);
    res.status(500).json({ error: 'Bulk review processing failed.', details: err.message });
  }
});

// GET /api/analysis/bulk/export - Download analyzed reviews as CSV
router.get('/export', (req, res) => {
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
      'Location_Confidence'
    ];

    const csvLines = [headers.join(',')];

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
        asp.LOCATION?.confidence || 0
      ];
      csvLines.push(row.join(','));
    }

    const csvString = csvLines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="hospitality_absa_results.csv"');
    res.status(200).send(csvString);
  } catch (err) {
    console.error('[Bulk Export] Error:', err);
    res.status(500).json({ error: 'Failed to export CSV report.', details: err.message });
  }
});

module.exports = router;
