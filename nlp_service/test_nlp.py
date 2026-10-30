import json
from clause_segmenter import extract_clauses
from deberta_engine import deberta_engine

test_review = (
    "The hotel rooms were very clean, the staff was friendly and the breakfast was excellent. "
    "However, the location was far from the city centre and the room service was very slow."
)

print("[TEST] Running Clause Segmentation...")
clauses = extract_clauses(test_review)
print(f"[TEST] Extracted {len(clauses)} clauses:")
for c in clauses:
    print(f"  Clause {c['clause_id']}: '{c['clause_text']}'")

print("\n[TEST] Running Zero-Shot Aspect Detection & NLI Inference...")
results = deberta_engine.analyze_review(test_review, clauses)

print(f"\n[TEST] Engine: {results['engine_info']['name']}")
print(f"[TEST] Overall Sentiment: {results['overall_sentiment']}")
print("\n[TEST] Aspect-level findings:")
for aspect, info in results['aspects'].items():
    if info['mentioned']:
        print(f"  * {aspect}: {info['sentiment']} (Confidence: {info['confidence']})")
        print(f"    Evidence: \"{info['supporting_evidence']}\"")
        print(f"    Reasoning: {info['explanation']}")
    else:
        print(f"  * {aspect}: Not Mentioned")

print("\n[TEST] SUCCESSFUL VERIFICATION.")
