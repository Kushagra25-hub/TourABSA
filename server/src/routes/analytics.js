const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/analytics - Get aggregated dashboard metrics
router.get('/', (req, res) => {
  try {
    const { hotel, aspect, sentiment, dateRange } = req.query;
    const analytics = db.getAnalytics({ hotel, aspect, sentiment, dateRange });
    res.json({
      success: true,
      data: analytics
    });
  } catch (err) {
    console.error('[Route /analytics GET] Error:', err);
    res.status(500).json({ error: 'Failed to generate analytics dashboard data.', details: err.message });
  }
});

module.exports = router;
