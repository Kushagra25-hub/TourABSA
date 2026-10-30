const express = require('express');
const router = express.Router();
const db = require('../db/database');
const nlpClient = require('../services/nlpClient');

// POST /api/analysis - Analyze single review
router.post('/', async (req, res) => {
  try {
    const { review_text, hotel_name, date, rating } = req.body;
    if (!review_text || !review_text.trim()) {
      return res.status(400).json({ error: 'Review text is required.' });
    }

    const hotel = hotel_name && hotel_name.trim() ? hotel_name.trim() : 'Unspecified Hotel';
    
    // Call Python NLP Service for DeBERTa Zero-Shot ABSA
    const nlpResult = await nlpClient.analyzeReview(review_text.trim(), hotel);

    // Save to Database
    const savedRecord = db.saveReview({
      review_text: review_text.trim(),
      hotel_name: hotel,
      date: date || new Date().toISOString().split('T')[0],
      rating: rating ? Number(rating) : 4,
      analysis: nlpResult,
      is_sample: false
    });

    res.status(201).json({
      success: true,
      message: 'Review successfully analyzed and stored in database.',
      data: savedRecord
    });
  } catch (err) {
    console.error('[Route /analysis POST] Error:', err);
    res.status(500).json({
      error: 'Failed to complete review analysis.',
      details: err.message
    });
  }
});

// GET /api/analysis - Get list of analyzed reviews with filters
router.get('/', (req, res) => {
  try {
    const { hotel, aspect, sentiment, search, sortBy } = req.query;
    const reviews = db.getAllReviews({ hotel, aspect, sentiment, search, sortBy });
    res.json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (err) {
    console.error('[Route /analysis GET] Error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews.', details: err.message });
  }
});

// GET /api/analysis/:id - Get specific review
router.get('/:id', (req, res) => {
  try {
    const review = db.getReviewById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve review.', details: err.message });
  }
});

// DELETE /api/analysis/:id - Delete a review
router.delete('/:id', (req, res) => {
  try {
    const deleted = db.deleteReview(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Review not found.' });
    }
    res.json({ success: true, message: 'Review successfully deleted.', data: deleted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review.', details: err.message });
  }
});

module.exports = router;
