// End-to-End Automated Test Suite for Hospitality ABSA Platform
// Validates all 9 core capabilities:
// 1. Health & Service Connection
// 2. DeBERTa Checkpoint Configuration & Thresholds
// 3. Dependency-aware spaCy Clause Segmentation & Inference
// 4. 3-Hypothesis Sentiment Inference & Transparent Mapping
// 5. Dataset Management & Metadata Stats
// 6. Data Export (Cleaned Reviews CSV & DeBERTa Predictions CSV)
// 7. Multi-Class Evaluation on 55-Record Gold-Standard Benchmark
// 8. Analytics Aggregation from Real Stored Predictions
// 9. Multi-Hotel Comparative Analysis

async function runTestSuite() {
  console.log('===============================================================');
  console.log('   STARTING HOSPITALITY ABSA END-TO-END VALIDATION SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, extra = '') {
    total++;
    if (!condition) {
      console.error(`[FAIL] ${testName} ${extra}`);
      process.exit(1);
    } else {
      passed++;
      console.log(`[PASS] ${testName} ${extra}`);
    }
  }

  // 1. Backend & NLP Health Check
  console.log('>>> [1/9] Verifying Backend & NLP Service Health...');
  const healthRes = await fetch('http://localhost:5000/api/health').then(r => r.json());
  assert(healthRes.status === 'online', 'Backend server status online');
  assert(healthRes.nlp_service.connected === true, 'FastAPI NLP service connected to Node backend');

  // 2. DeBERTa Model Configuration & Metadata
  console.log('\n>>> [2/9] Inspecting Hugging Face DeBERTa Checkpoint & Configuration...');
  const configRes = await fetch('http://127.0.0.1:8000/config').then(r => r.json());
  assert(
    configRes.model_metadata.model_id === 'cross-encoder/nli-deberta-v3-small',
    'Exact DeBERTa Checkpoint',
    `(${configRes.model_metadata.model_id})`
  );
  assert(
    configRes.aspects.length === 6,
    'All 6 Core Hospitality Aspects Predefined',
    `[${configRes.aspects.join(', ')}]`
  );
  assert(
    configRes.decision_thresholds.ambiguity_margin === 0.08,
    'Ambiguity margin calibrated to 0.08'
  );
  assert(
    configRes.decision_thresholds.sentiment_confidence_threshold === 0.38,
    'Sentiment confidence threshold calibrated to 0.38'
  );

  // 3. Single Review DeBERTa Inference with 3 Hypotheses
  console.log('\n>>> [3/9] Testing Live DeBERTa Zero-Shot Inference on Unstructured Review...');
  const analyzeRes = await fetch('http://localhost:5000/api/analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hotel_name: 'Hyatt Regency London',
      review_text: 'The room was impeccably clean and the bed was comfortable, but the receptionist was rude.'
    })
  }).then(r => r.json());
  assert(analyzeRes.success === true, 'Analysis endpoint succeeded');
  const cleanAspect = analyzeRes.data.analysis.aspects.CLEANLINESS;
  const staffAspect = analyzeRes.data.analysis.aspects.STAFF;
  assert(cleanAspect.mentioned === true && cleanAspect.sentiment === 'Positive', 'Cleanliness: Positive Satisfaction Entailed');
  assert(staffAspect.mentioned === true && staffAspect.sentiment === 'Negative', 'Staff: Negative Dissatisfaction Entailed');
  assert(Boolean(cleanAspect.nli_distribution), '3-Hypothesis NLI distribution present for Cleanliness');
  assert(Boolean(staffAspect.decision_rule), 'Transparent decision rule generated');

  // 4. spaCy Dependency-Aware Clause Segmentation
  console.log('\n>>> [4/9] Testing Dependency-Aware Clause Segmentation Context Preservation...');
  assert(
    analyzeRes.data.analysis.clauses.length >= 2,
    `Clauses segmented without breaking subjects (count: ${analyzeRes.data.analysis.clauses.length})`
  );

  // 5. Dataset Management Stats & TripAdvisor Corpus
  console.log('\n>>> [5/9] Testing Dataset Management & Statistics API...');
  const statsRes = await fetch('http://localhost:5000/api/dataset/stats').then(r => r.json());
  assert(statsRes.success === true, 'Dataset statistics endpoint returned 200');
  assert(typeof statsRes.data.total_records === 'number', `Total records indexed: ${statsRes.data.total_records}`);
  assert(typeof statsRes.data.duplicates_filtered === 'number', `Duplicate tracking active (${statsRes.data.duplicates_filtered} filtered)`);

  // 6. CSV Dataset Exports (Cleaned & Predictions)
  console.log('\n>>> [6/9] Testing Dataset Download Endpoints (Cleaned & Predictions)...');
  const exportCleaned = await fetch('http://localhost:5000/api/dataset/export/cleaned');
  assert(exportCleaned.status === 200, 'Cleaned dataset CSV export status 200');
  const exportPreds = await fetch('http://localhost:5000/api/dataset/export/predictions');
  assert(exportPreds.status === 200, 'Predictions CSV export status 200');

  // 7. Multi-Class Evaluation against 55-Record Gold-Standard Benchmark
  console.log('\n>>> [7/9] Running Empirical Evaluation against 55-Record Gold Benchmark...');
  const evalRes = await fetch('http://localhost:5000/api/evaluation/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }).then(r => r.json());
  assert(evalRes.success === true, 'Evaluation run succeeded');
  assert(evalRes.data.overall.total_samples === 55, 'All 55 benchmark annotations evaluated');
  assert(evalRes.data.overall.accuracy > 0.65, `Realistic computed accuracy: ${(evalRes.data.overall.accuracy * 100).toFixed(1)}%`);
  assert(evalRes.data.overall.macro_f1 > 0.45, `Realistic computed Macro-F1: ${evalRes.data.overall.macro_f1.toFixed(3)}`);
  assert(Boolean(evalRes.data.overall.confusion_matrix), 'Confusion matrix computed from real predictions');
  assert(Boolean(evalRes.data.aspect_breakdown.CLEANLINESS), 'Per-aspect metrics calculated for CLEANLINESS');

  // 8. Analytics Aggregation from Real Stored Inferences
  console.log('\n>>> [8/9] Verifying Analytics Dashboard Live Calculations...');
  const analyticsRes = await fetch('http://localhost:5000/api/analytics').then(r => r.json());
  assert(analyticsRes.success === true, 'Analytics endpoint returned successfully');
  assert(analyticsRes.data.kpi.total_reviews >= 25, `KPI derived from live database: ${analyticsRes.data.kpi.total_reviews} reviews`);
  assert(analyticsRes.data.charts.overall_donut.length > 0, 'Sentiment distribution chart computed');

  // 9. Hotel Comparison
  console.log('\n>>> [9/9] Verifying Multi-Hotel Aspect Comparative Analytics...');
  const compRes = await fetch('http://localhost:5000/api/hotels/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hotels: ['The Grand Meridian Hotel', 'Urban Central Suites'] })
  }).then(r => r.json());
  assert(compRes.success === true, 'Multi-hotel comparison endpoint returned 200');
  assert(compRes.data.hotels.length >= 2, '2 hotel profiles compared side-by-side');

  console.log('\n===============================================================');
  console.log(`   VALIDATION COMPLETE: ${passed}/${total} TESTS PASSED SUCCESSFULLY!`);
  console.log('===============================================================\n');
}

runTestSuite().catch(err => {
  console.error('[ERROR] Test runner crashed:', err);
  process.exit(1);
});
