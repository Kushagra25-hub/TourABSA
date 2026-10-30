const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/hotels - Get distinct hotels list
router.get('/', (req, res) => {
  try {
    const hotels = db.getHotels();
    res.json({ success: true, count: hotels.length, data: hotels });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve hotels list.', details: err.message });
  }
});

// POST /api/hotels/compare - Compare multiple hotels
router.post('/compare', (req, res) => {
  try {
    const { hotels } = req.body;
    if (!Array.isArray(hotels) || hotels.length < 2) {
      return res.status(400).json({
        error: 'Please select at least two hotels to perform an aspect comparison.'
      });
    }

    const comparisonData = db.getHotelComparison(hotels);
    res.json({
      success: true,
      selected_count: hotels.length,
      data: comparisonData
    });
  } catch (err) {
    res.status(500).json({ error: 'Hotel comparison failed.', details: err.message });
  }
});

module.exports = router;
