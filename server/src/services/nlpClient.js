const axios = require('axios');

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://127.0.0.1:8000';

const nlpClient = {
  async checkHealth() {
    try {
      const response = await axios.get(`${NLP_SERVICE_URL}/health`, { timeout: 3000 });
      return { connected: true, data: response.data };
    } catch (err) {
      return { connected: false, error: err.message };
    }
  },

  async analyzeReview(reviewText, hotelName = 'Unspecified Hotel') {
    try {
      const response = await axios.post(`${NLP_SERVICE_URL}/analyze`, {
        review_text: reviewText,
        hotel_name: hotelName
      }, { timeout: 30000 });
      return response.data;
    } catch (err) {
      console.error('[NLP Client] Error communicating with Python service:', err.message);
      throw new Error(`NLP Service communication failed: ${err.message}`);
    }
  },

  async analyzeBatch(reviews) {
    try {
      const response = await axios.post(`${NLP_SERVICE_URL}/analyze-batch`, {
        reviews: reviews.map(r => ({
          review_id: r.review_id,
          hotel_name: r.hotel_name,
          review_text: r.review_text,
          date: r.date
        }))
      }, { timeout: 180000 });
      return response.data;
    } catch (err) {
      console.error('[NLP Client] Error during batch analysis:', err.message);
      throw new Error(`Batch NLP processing failed: ${err.message}`);
    }
  },

  async evaluate(goldRecords, predictions = []) {
    try {
      const response = await axios.post(`${NLP_SERVICE_URL}/evaluate`, {
        gold_records: goldRecords,
        predictions: predictions
      }, { timeout: 30000 });
      return response.data;
    } catch (err) {
      console.error('[NLP Client] Error evaluating predictions:', err.message);
      throw new Error(`Evaluation failed: ${err.message}`);
    }
  }
};

module.exports = nlpClient;
