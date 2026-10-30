const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db/database');
const nlpClient = require('../services/nlpClient');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const candidatePaths = [
  path.resolve(__dirname, '../../../data/benchmark_gold_standard.csv'),
  path.resolve(__dirname, '../../data/benchmark_gold_standard.csv'),
  path.resolve(process.cwd(), 'data/benchmark_gold_standard.csv'),
  path.resolve(process.cwd(), '../data/benchmark_gold_standard.csv')
];
const BENCHMARK_FILE = candidatePaths.find(p => fs.existsSync(p)) || candidatePaths[0];

// Helper to parse benchmark CSV
function parseGoldStandardCSV(content) {
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const idIdx = headers.findIndex(h => h.includes('id'));
  const aspectIdx = headers.findIndex(h => h.includes('aspect'));
  const sentIdx = headers.findIndex(h => h.includes('sentiment') || h.includes('label'));

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim());
    if (parts.length >= 3) {
      records.push({
        review_id: parts[idIdx >= 0 ? idIdx : 0],
        aspect: parts[aspectIdx >= 0 ? aspectIdx : 1].toUpperCase(),
        gold_sentiment: parts[sentIdx >= 0 ? sentIdx : 2]
      });
    }
  }
  return records;
}

function loadBenchmarkRecords() {
  if (!fs.existsSync(BENCHMARK_FILE)) {
    console.warn('[Evaluation] Benchmark file not found at:', BENCHMARK_FILE);
    return [];
  }
  const content = fs.readFileSync(BENCHMARK_FILE, 'utf8');
  return parseGoldStandardCSV(content);
}

// GET /api/evaluation/status - Returns evaluation status and benchmark details
router.get('/status', (req, res) => {
  try {
    const reviews = db.getAllReviews();
    const benchmarkRecords = loadBenchmarkRecords();

    if (reviews.length === 0) {
      return res.json({
        evaluated: false,
        status: 'pending',
        message: 'Evaluation pending – manually annotated dataset required.',
        benchmark_sample_count: benchmarkRecords.length
      });
    }

    res.json({
      evaluated: false,
      status: 'ready',
      message: 'System has reviews in database. Ready to evaluate against gold-standard benchmark annotations.',
      benchmark_info: {
        name: 'Initial Research Benchmark (55 Ground-Truth Records)',
        total_annotations: benchmarkRecords.length,
        source: 'data/benchmark_gold_standard.csv'
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check evaluation status.', details: err.message });
  }
});

// POST /api/evaluation/upload-gold - Upload a custom larger gold-standard annotated CSV
router.post('/upload-gold', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file was uploaded.' });
    }

    const content = req.file.buffer.toString('utf8');
    const records = parseGoldStandardCSV(content);

    if (records.length === 0) {
      return res.status(400).json({ error: 'No valid gold-standard records (review_id, aspect, gold_sentiment) found in CSV.' });
    }

    res.json({
      success: true,
      filename: req.file.originalname,
      total_annotations: records.length,
      records: records,
      preview: records.slice(0, 5)
    });
  } catch (err) {
    console.error('[Upload Gold Standard] Error:', err);
    res.status(500).json({ error: 'Failed to parse gold standard CSV.', details: err.message });
  }
});

// POST /api/evaluation/run - Run evaluation against benchmark or uploaded gold-standard
router.post('/run', async (req, res) => {
  try {
    const { custom_gold_records, benchmark_mode } = req.body;
    let goldRecords = custom_gold_records;
    let datasetName = 'Custom Gold-Standard Dataset';

    if (!Array.isArray(goldRecords) || goldRecords.length === 0) {
      goldRecords = loadBenchmarkRecords();
      datasetName = 'Initial 55-Record Academic Benchmark (data/benchmark_gold_standard.csv)';
    }

    if (!goldRecords || goldRecords.length === 0) {
      return res.json({
        evaluated: false,
        status: 'pending',
        message: 'Evaluation pending – manually annotated dataset required.'
      });
    }

    // Extract current model predictions from database
    const reviews = db.getAllReviews();
    if (reviews.length === 0) {
      return res.json({
        evaluated: false,
        status: 'pending',
        message: 'No reviews found in database to evaluate. Please load reviews first.'
      });
    }

    const predictions = [];
    for (const r of reviews) {
      const aspects = r.analysis?.aspects || {};
      for (const [aspName, aspData] of Object.entries(aspects)) {
        if (aspData.mentioned) {
          predictions.push({
            review_id: r.review_id,
            aspect: aspName.toUpperCase(),
            sentiment: aspData.sentiment,
            confidence: aspData.confidence
          });
        }
      }
    }

    // Call Python NLP evaluation module
    const evalResult = await nlpClient.evaluate(goldRecords, predictions);
    evalResult.benchmark_dataset = datasetName;

    res.json({
      success: true,
      data: evalResult
    });
  } catch (err) {
    console.error('[Evaluation Run] Error:', err);
    res.status(500).json({ error: 'Failed to execute evaluation pipeline.', details: err.message });
  }
});

module.exports = router;
