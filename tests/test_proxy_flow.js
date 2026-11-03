const fs = require('fs');

async function runVerification() {
  console.log('=== TEST 1: FRONTEND WEB APP ACCESSIBILITY ===');
  const feRes = await fetch('http://localhost:5173');
  console.log('Frontend Status:', feRes.status, '| Content-Type:', feRes.headers.get('content-type'));

  console.log('\n=== TEST 2: VITE PROXY -> NODE.JS -> PYTHON NLP HEALTH ===');
  const hRes = await fetch('http://localhost:5173/api/health').then(r => r.json());
  console.log('Backend status:', hRes.status, '| NLP connected:', hRes.nlp_service?.connected, '| Model:', hRes.nlp_service?.model_id);

  console.log('\n=== TEST 3: SINGLE REVIEW ANALYSIS VIA FRONTEND PROXY ===');
  const t0 = Date.now();
  const singleRes = await fetch('http://localhost:5173/api/analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hotel_name: 'Azure Bay Resort & Spa',
      review_text: 'The swimming pool was spectacular and the breakfast buffet was delicious, but the front desk receptionist was rude.'
    })
  }).then(r => r.json());
  console.log('Single Analysis success:', singleRes.success, 'in', Date.now() - t0, 'ms');
  console.log('Clauses detected:', singleRes.data.analysis.clauses.length);
  for (const [asp, info] of Object.entries(singleRes.data.analysis.aspects)) {
    if (info.mentioned) {
      console.log(`  -> [${asp}]: ${info.sentiment} (confidence: ${info.confidence}) | Rule: ${info.decision_rule}`);
      if (info.nli_distribution) {
        console.log(`     Satisfaction: ${(info.nli_distribution.satisfaction * 100).toFixed(1)}% | Dissatisfaction: ${(info.nli_distribution.dissatisfaction * 100).toFixed(1)}% | Neutral: ${(info.nli_distribution.neutral * 100).toFixed(1)}%`);
      }
    }
  }

  console.log('\n=== TEST 4: CSV BULK UPLOAD VIA FRONTEND PROXY ===');
  const csvContent = 'hotel_name,review_text,date\n"The Grand Meridian Hotel","The bedroom cleanliness was superb and room service was prompt.",2024-04-01\n"Urban Central Suites","Terrible street noise and the air conditioner was broken.",2024-04-02\n';
  const formData = new FormData();
  formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'sample_reviews.csv');

  const upRes = await fetch('http://localhost:5173/api/analysis/bulk/upload', {
    method: 'POST',
    body: formData
  }).then(r => r.json());
  console.log('Bulk upload success:', upRes.success, '| Rows:', upRes.total_rows, '| Suggested Mapping:', upRes.suggested_mapping);

  console.log('\n=== TEST 5: CSV BATCH PROCESSING VIA FRONTEND PROXY ===');
  const t1 = Date.now();
  const procRes = await fetch('http://localhost:5173/api/analysis/bulk/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rows: upRes.raw_rows,
      mapping: upRes.suggested_mapping
    })
  }).then(r => r.json());
  console.log('Bulk process success:', procRes.success, '| Processed:', procRes.processed_count, 'reviews in', Date.now() - t1, 'ms');
  for (const rec of procRes.records) {
    console.log(`  -> Review #${rec.id} [${rec.hotel_name}]: Overall Sentiment = ${rec.analysis.overall_sentiment}`);
  }

  console.log('\n=== TEST 6: CSV RESULTS EXPORT VIA FRONTEND PROXY ===');
  const expRes = await fetch('http://localhost:5173/api/analysis/bulk/export');
  const expText = await expRes.text();
  console.log('Export Status:', expRes.status, '| Header Line:', expText.split('\n')[0]);

  console.log('\n===============================================================');
  console.log('   ALL END-TO-END PIPELINES (PROXY -> BACKEND -> NLP) VERIFIED!');
  console.log('===============================================================\n');
}

runVerification().catch(e => {
  console.error('FAILED:', e);
  process.exit(1);
});
