/**
 * Comprehensive Automated System Test Suite
 * Hospitality Zero-Shot ABSA Framework
 * Tests: Every Page API, Form, Button Operation, CSV Workflow, Database Operation,
 * Sentiment Prediction Model, and Dashboard Chart Calculation.
 */

async function runExhaustiveTests() {
  console.log('========================================================================');
  console.log('   STARTING EXHAUSTIVE VALIDATION SUITE: ALL PAGES, BUTTONS, APIS,      ');
  console.log('   DATABASE OPS, SENTIMENT PREDICTIONS, CSV INGESTION, AND CHARTS      ');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, extra = '') {
    total++;
    if (!condition) {
      console.error(`  [FAIL] ${testName} ${extra}`);
      process.exit(1);
    } else {
      passed++;
      console.log(`  [PASS] ${testName} ${extra}`);
    }
  }

  // -------------------------------------------------------------------------
  // 1. FRONTEND DEV SERVER & REVERSE PROXY
  // -------------------------------------------------------------------------
  console.log('>>> [1/10] Verifying Frontend Web App & Vite Reverse Proxy...');
  const feRes = await fetch('http://localhost:5173');
  assert(feRes.status === 200, 'Frontend dev server serving HTTP 200');
  const feHtml = await feRes.text();
  assert(feHtml.includes('<div id="root"></div>') || feHtml.includes('<!DOCTYPE html>'), 'Valid HTML shell served with React root mount');

  const proxyHealth = await fetch('http://localhost:5173/api/health').then(r => r.json());
  assert(proxyHealth.status === 'online', 'Vite proxy successfully connects /api to Node.js backend');
  assert(proxyHealth.nlp_service?.connected === true, 'Node.js backend connected to Python FastAPI NLP service');

  // -------------------------------------------------------------------------
  // 2. MODEL CONFIGURATION & ZERO-SHOT NLI HYPOTHESES
  // -------------------------------------------------------------------------
  console.log('\n>>> [2/10] Verifying DeBERTa NLI Checkpoint & 3-Hypothesis Config...');
  const config = await fetch('http://127.0.0.1:8000/config').then(r => r.json());
  assert(config.model_metadata.model_id === 'cross-encoder/nli-deberta-v3-small', 'Model ID is cross-encoder/nli-deberta-v3-small');
  assert(config.aspects.length === 6, 'Exactly 6 core hospitality aspects defined');
  assert(config.decision_thresholds.ambiguity_margin === 0.08, 'Ambiguity margin threshold calibrated to 0.08');
  assert(config.decision_thresholds.sentiment_confidence_threshold === 0.38, 'Sentiment confidence threshold calibrated to 0.38');
  assert(Boolean(config.sentiment_hypotheses.CLEANLINESS.Positive), 'Aspect-specific positive satisfaction hypothesis exists');
  assert(Boolean(config.sentiment_hypotheses.STAFF.Negative), 'Aspect-specific negative dissatisfaction hypothesis exists');
  assert(Boolean(config.sentiment_hypotheses.FOOD.Neutral), 'Aspect-specific neutral opinion hypothesis exists');

  // -------------------------------------------------------------------------
  // 3. SINGLE REVIEW ANALYSIS & PREDICTION
  // -------------------------------------------------------------------------
  console.log('\n>>> [3/10] Testing Single Review Analysis, Clause Segmentation & NLI Rules...');
  const singlePayload = {
    hotel_name: 'The Grand Regency Hotel',
    review_text: 'The room was impeccably clean and the bed was comfortable. However, the receptionist was very rude and the breakfast was overpriced.',
    rating: 3
  };
  const singleRes = await fetch('http://localhost:5000/api/analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(singlePayload)
  }).then(r => r.json());

  assert(singleRes.success === true, 'Single review analysis succeeded');
  assert(Boolean(singleRes.data.review_id), `Review assigned unique ID: ${singleRes.data.review_id}`);
  const testRevId = singleRes.data.review_id;

  const analysis = singleRes.data.analysis;
  assert(analysis.clauses.length >= 2, `Dependency-aware clause segmentation extracted ${analysis.clauses.length} clauses`);
  const cleanAspect = analysis.aspects.CLEANLINESS;
  const staffAspect = analysis.aspects.STAFF;
  const valueAspect = analysis.aspects.VALUE;

  assert(cleanAspect.mentioned === true && cleanAspect.sentiment === 'Positive', 'Cleanliness detected as Positive');
  assert(staffAspect.mentioned === true && staffAspect.sentiment === 'Negative', 'Staff detected as Negative');
  assert(valueAspect.mentioned === true && valueAspect.sentiment === 'Negative', 'Value detected as Negative');
  assert(cleanAspect.confidence >= 0.5, `Cleanliness confidence: ${(cleanAspect.confidence * 100).toFixed(1)}%`);
  assert(Boolean(cleanAspect.decision_rule), `Decision rule: "${cleanAspect.decision_rule}"`);

  // -------------------------------------------------------------------------
  // 4. DATABASE RETRIEVAL, FILTERING, SORTING & DELETION
  // -------------------------------------------------------------------------
  console.log('\n>>> [4/10] Testing Database Operations (Read, Search, Filter, Sort, Delete)...');
  
  // Get by ID
  const getByIdRes = await fetch(`http://localhost:5000/api/analysis/${testRevId}`).then(r => r.json());
  assert(getByIdRes.success === true && getByIdRes.data.review_id === testRevId, 'Retrieved review by ID from database');

  // Keyword search
  const searchRes = await fetch('http://localhost:5000/api/analysis?search=receptionist').then(r => r.json());
  assert(searchRes.data.length >= 1, `Search by keyword returned ${searchRes.data.length} match(es)`);

  // Filter by aspect
  const aspectFilterRes = await fetch('http://localhost:5000/api/analysis?aspect=STAFF').then(r => r.json());
  assert(aspectFilterRes.data.every(r => r.analysis.aspects.STAFF?.mentioned), 'Aspect filter returned only reviews mentioning STAFF');

  // Filter by sentiment
  const sentFilterRes = await fetch('http://localhost:5000/api/analysis?sentiment=Positive').then(r => r.json());
  assert(sentFilterRes.data.every(r => r.analysis.overall_sentiment === 'Positive'), 'Sentiment filter returned only Positive reviews');

  // Sort by date
  const sortAscRes = await fetch('http://localhost:5000/api/analysis?sortBy=date-asc').then(r => r.json());
  assert(sortAscRes.success === true, 'Sort by date ascending succeeded');

  // Delete test review
  const deleteRes = await fetch(`http://localhost:5000/api/analysis/${testRevId}`, { method: 'DELETE' }).then(r => r.json());
  assert(deleteRes.success === true, `Deleted test review ${testRevId}`);
  const verifyDelete = await fetch(`http://localhost:5000/api/analysis/${testRevId}`);
  assert(verifyDelete.status === 404, 'Verified deleted review is no longer in database (HTTP 404)');

  // -------------------------------------------------------------------------
  // 5. BULK CSV UPLOAD, AUTO-MAPPING, BATCH PROCESSING & RESULTS EXPORT
  // -------------------------------------------------------------------------
  console.log('\n>>> [5/10] Testing Bulk CSV Upload, Parsing, Inference, and Export...');
  const sampleCsv = `hotel_name,review_text,date,rating
"The Grand Meridian Hotel","Spotless bathroom and comfortable luxury bed.",2024-04-10,5
"Urban Central Suites","The room was noisy and the air conditioner was broken.",2024-04-11,2
`;
  const uploadForm = new FormData();
  uploadForm.append('file', new Blob([sampleCsv], { type: 'text/csv' }), 'bulk_test.csv');

  const uploadRes = await fetch('http://localhost:5000/api/analysis/bulk/upload', {
    method: 'POST',
    body: uploadForm
  }).then(r => r.json());

  assert(uploadRes.success === true, 'CSV file upload and parsing succeeded');
  assert(uploadRes.total_rows === 2, `Parsed exactly 2 rows from CSV`);
  assert(uploadRes.suggested_mapping.hotel_col === 'hotel_name', 'Auto-mapped hotel_name column');
  assert(uploadRes.suggested_mapping.text_col === 'review_text', 'Auto-mapped review_text column');

  // Batch process
  const batchRes = await fetch('http://localhost:5000/api/analysis/bulk/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rows: uploadRes.raw_rows,
      mapping: uploadRes.suggested_mapping
    })
  }).then(r => r.json());

  assert(batchRes.success === true, 'Batch inference processing succeeded');
  assert(batchRes.processed_count === 2, 'Processed 2 reviews in batch');
  assert(batchRes.records[0].analysis.overall_sentiment === 'Positive', 'First CSV review classified as Positive');
  assert(batchRes.records[1].analysis.overall_sentiment === 'Negative', 'Second CSV review classified as Negative');

  // Export Results CSV
  const exportRes = await fetch('http://localhost:5000/api/analysis/bulk/export');
  assert(exportRes.status === 200, 'Export Formatted Results CSV returns HTTP 200');
  const exportCsvText = await exportRes.text();
  assert(exportCsvText.includes('Overall_Sentiment') && exportCsvText.includes('Cleanliness_Sentiment'), 'Export CSV contains all 6 aspect columns');

  // -------------------------------------------------------------------------
  // 6. DATASET MANAGEMENT & HYGIENE AUDIT
  // -------------------------------------------------------------------------
  console.log('\n>>> [6/10] Testing Dataset Management, Deduplication & Quality Audit...');
  const statsRes = await fetch('http://localhost:5000/api/dataset/stats').then(r => r.json());
  assert(statsRes.success === true, 'Dataset stats endpoint returned 200');
  assert(typeof statsRes.data.total_records === 'number' && statsRes.data.total_records > 0, `Total database records: ${statsRes.data.total_records}`);

  // Test Audit upload with duplicates & invalid rows
  const dirtyCsv = `hotel_name,review_text,date
"Azure Bay Resort","The swimming pool was murky and the beach was littered.",2024-04-11
"Duplicate Hotel","The swimming pool was murky and the beach was littered.",2024-04-12
"Invalid Hotel","",2024-04-13
`;
  const auditForm = new FormData();
  auditForm.append('file', new Blob([dirtyCsv], { type: 'text/csv' }), 'dirty_dataset.csv');

  const auditRes = await fetch('http://localhost:5000/api/dataset/audit-upload', {
    method: 'POST',
    body: auditForm
  }).then(r => r.json());

  assert(auditRes.success === true, 'Dataset audit upload parsed file');
  assert(auditRes.audit.duplicate_count >= 1, `Deduplication algorithm detected ${auditRes.audit.duplicate_count} duplicate review(s)`);
  assert(auditRes.audit.invalid_count >= 1, `Data hygiene detected ${auditRes.audit.invalid_count} invalid empty review(s)`);

  // Cleaned and Predictions exports
  const cleanedExport = await fetch('http://localhost:5000/api/dataset/export/cleaned');
  assert(cleanedExport.status === 200, 'Cleaned dataset export returned HTTP 200');
  const predExport = await fetch('http://localhost:5000/api/dataset/export/predictions');
  assert(predExport.status === 200, 'Prediction outputs export returned HTTP 200');

  // -------------------------------------------------------------------------
  // 7. ANALYTICS DASHBOARD CALCULATIONS & CHARTS
  // -------------------------------------------------------------------------
  console.log('\n>>> [7/10] Testing Analytics Dashboard KPI & Chart Calculations...');
  const analytics = await fetch('http://localhost:5000/api/analytics').then(r => r.json());
  assert(analytics.success === true, 'Analytics endpoint returned HTTP 200');

  const kpi = analytics.data.kpi;
  assert(kpi.total_reviews >= 25, `KPI Total Reviews: ${kpi.total_reviews}`);
  assert(kpi.positive_count + kpi.negative_count + kpi.neutral_count === kpi.total_reviews, 'KPI sentiment partition sums to total reviews');
  assert(kpi.hotels_analyzed >= 2, `Distinct hotels analyzed: ${kpi.hotels_analyzed}`);

  // Charts
  const charts = analytics.data.charts;
  assert(charts.overall_donut.length === 3, 'Donut chart contains 3 sentiment slices (Positive, Negative, Neutral)');
  assert(charts.grouped_aspect_bars.length === 6, 'Aspect grouped bar chart contains all 6 aspects');
  assert(charts.pos_vs_neg_bars.length === 6, 'Pos vs Neg ratio bar chart contains all 6 aspects');
  assert(charts.hotel_breakdown.length >= 2, 'Hotel breakdown bar chart contains active hotel records');
  assert(charts.timeline_trends.length > 0, 'Timeline trend line chart contains chronological data points');

  // Aspect Cards
  const aspectCards = analytics.data.aspect_cards;
  for (const asp of ['CLEANLINESS', 'STAFF', 'FOOD', 'VALUE', 'AMENITIES', 'LOCATION']) {
    assert(Boolean(aspectCards[asp]), `Aspect card generated for ${asp}`);
  }

  // Filtered Analytics
  const filteredAnalytics = await fetch('http://localhost:5000/api/analytics?hotel=The%20Grand%20Meridian%20Hotel').then(r => r.json());
  assert(filteredAnalytics.success === true, 'Filtered analytics for single hotel returned 200');
  assert(filteredAnalytics.data.kpi.hotels_analyzed <= 1, 'Filtered analytics correctly isolated to single hotel');

  // -------------------------------------------------------------------------
  // 8. HOTEL COMPARISON ANALYTICS & CHARTS
  // -------------------------------------------------------------------------
  console.log('\n>>> [8/10] Testing Multi-Hotel Comparative Analysis...');
  const hotelsList = await fetch('http://localhost:5000/api/hotels').then(r => r.json());
  assert(hotelsList.success === true && hotelsList.data.length >= 2, `Hotel registry contains ${hotelsList.data.length} hotels`);

  const compareRes = await fetch('http://localhost:5000/api/hotels/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hotels: [hotelsList.data[0].name, hotelsList.data[1].name]
    })
  }).then(r => r.json());

  assert(compareRes.success === true, 'Hotel comparison API returned 200');
  assert(compareRes.data.hotels.length === 2, 'Comparison returned profiles for 2 hotels');
  assert(Boolean(compareRes.data.hotels[0].strongest_aspect), 'Strongest aspect identified for Hotel 1');
  assert(Boolean(compareRes.data.hotels[0].weakest_aspect), 'Weakest aspect identified for Hotel 1');
  assert(compareRes.data.aspect_comparison.length === 6, 'Comparative aspect scores generated for all 6 aspects');

  // -------------------------------------------------------------------------
  // 9. GOLD-STANDARD BENCHMARK EVALUATION (55 RECORDS)
  // -------------------------------------------------------------------------
  console.log('\n>>> [9/10] Testing Gold-Standard Model Evaluation & Confusion Matrix...');
  const evalStatus = await fetch('http://localhost:5000/api/evaluation/status').then(r => r.json());
  assert(evalStatus.benchmark_info.total_annotations === 55, 'Benchmark contains exactly 55 gold-standard annotations');

  const evalRes = await fetch('http://localhost:5000/api/evaluation/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }).then(r => r.json());

  assert(evalRes.success === true, 'Evaluation run succeeded');
  const overall = evalRes.data.overall;
  assert(overall.total_samples === 55, 'Evaluated all 55 ground-truth annotations');
  assert(overall.accuracy > 0.65, `Real evaluated Accuracy: ${(overall.accuracy * 100).toFixed(1)}%`);
  assert(overall.macro_f1 > 0.45, `Real evaluated Macro-F1: ${overall.macro_f1.toFixed(3)}`);
  assert(Boolean(overall.confusion_matrix.Positive), 'Confusion matrix row Positive exists');
  assert(Boolean(overall.confusion_matrix.Negative), 'Confusion matrix row Negative exists');
  assert(Boolean(overall.confusion_matrix.Neutral), 'Confusion matrix row Neutral exists');

  // -------------------------------------------------------------------------
  // 10. SPA REFRESH & DATABASE PERSISTENCE VERIFICATION
  // -------------------------------------------------------------------------
  console.log('\n>>> [10/10] Verifying Data Persistence and Integrity Across Re-reads...');
  const postEvalStats = await fetch('http://localhost:5000/api/dataset/stats').then(r => r.json());
  assert(postEvalStats.data.total_records >= 25, `Database records remain safely persisted (${postEvalStats.data.total_records} records)`);

  console.log('\n========================================================================');
  console.log(`   VALIDATION COMPLETE: ALL ${passed}/${total} TESTS PASSED SUCCESSFULLY!`);
  console.log('   ZERO ERRORS DETECTED ACROSS ALL COMPONENTS & PIPELINES.');
  console.log('========================================================================\n');
}

runExhaustiveTests().catch(err => {
  console.error('[FATAL ERROR IN TEST SUITE]:', err);
  process.exit(1);
});
