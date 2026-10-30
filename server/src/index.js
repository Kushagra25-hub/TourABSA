require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const analysisRouter = require('./routes/analysis');
const bulkRouter = require('./routes/bulk');
const hotelsRouter = require('./routes/hotels');
const analyticsRouter = require('./routes/analytics');
const datasetRouter = require('./routes/dataset');
const evaluationRouter = require('./routes/evaluation');
const nlpClient = require('./services/nlpClient');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check
app.get('/api/health', async (req, res) => {
  const nlpHealth = await nlpClient.checkHealth();
  const allReviews = db.getAllReviews();

  res.json({
    status: 'online',
    server: 'Hospitality ABSA Backend (Node.js/Express)',
    port: PORT,
    database: {
      status: 'connected',
      type: 'persistent-json-store',
      total_reviews: allReviews.length
    },
    nlp_service: nlpHealth,
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/analysis/bulk', bulkRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/hotels', hotelsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/dataset', datasetRouter);
app.use('/api/evaluation', evaluationRouter);

// Serve Static Frontend Assets in Production
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error Handler]:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  Hospitality ABSA Backend Server is RUNNING`);
  console.log(`  Local URL: http://localhost:${PORT}`);
  console.log(`  Health API: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
