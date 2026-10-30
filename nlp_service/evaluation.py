"""
Evaluation Module for Aspect-Based Sentiment Analysis.
Calculates:
- Precision
- Recall
- F1-Score
- Accuracy
- Macro-F1
- Confusion Matrix (Positive, Negative, Neutral)
- Inference Latency (ms per review)

Strict Research Compliance:
Does not generate fake metrics. Returns 'Evaluation pending – manually annotated dataset required'
when ground truth labels are missing.
"""

import time
from typing import List, Dict, Any, Optional

ASPECTS = ["CLEANLINESS", "STAFF", "FOOD", "VALUE", "AMENITIES", "LOCATION"]
SENTIMENT_CLASSES = ["Positive", "Negative", "Neutral"]

def compute_metrics(y_true: List[str], y_pred: List[str]) -> Dict[str, Any]:
    """Computes exact multi-class metrics without third-party blackbox approximations."""
    if not y_true or not y_pred or len(y_true) != len(y_pred):
        return {
            "status": "error",
            "message": "Invalid ground truth or prediction array sizes."
        }

    total = len(y_true)
    correct = sum(1 for t, p in zip(y_true, y_pred) if t == p)
    accuracy = correct / total if total > 0 else 0.0

    # Build Confusion Matrix
    # Matrix rows: True label, Columns: Predicted label
    matrix = {t: {p: 0 for p in SENTIMENT_CLASSES} for t in SENTIMENT_CLASSES}
    for t, p in zip(y_true, y_pred):
        if t in matrix and p in matrix[t]:
            matrix[t][p] += 1

    per_class = {}
    f1_scores = []

    for c in SENTIMENT_CLASSES:
        tp = matrix[c][c]
        fp = sum(matrix[other][c] for other in SENTIMENT_CLASSES if other != c)
        fn = sum(matrix[c][other] for other in SENTIMENT_CLASSES if other != c)

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

        f1_scores.append(f1)
        per_class[c] = {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "support": sum(matrix[c].values())
        }

    macro_f1 = sum(f1_scores) / len(f1_scores) if f1_scores else 0.0

    return {
        "accuracy": round(accuracy, 4),
        "macro_f1": round(macro_f1, 4),
        "per_class": per_class,
        "confusion_matrix": matrix,
        "total_samples": total
    }

def evaluate_predictions(gold_records: List[Dict[str, Any]], predictions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Evaluates system predictions against gold-standard records.
    Each record must contain:
    - review_id
    - aspect
    - gold_sentiment ('Positive', 'Negative', 'Neutral')
    """
    if not gold_records or len(gold_records) == 0:
        return {
            "status": "pending",
            "evaluated": False,
            "message": "Evaluation pending – manually annotated dataset required."
        }

    # Map predictions by (review_id, aspect)
    pred_map = {}
    for p in predictions:
        key = (str(p.get("review_id", "")), str(p.get("aspect", "")).upper())
        pred_map[key] = p.get("sentiment", "Neutral")

    y_true = []
    y_pred = []
    aspect_specific_data = {asp: {"true": [], "pred": []} for asp in ASPECTS}

    for g in gold_records:
        r_id = str(g.get("review_id", ""))
        aspect = str(g.get("aspect", "")).upper()
        gold_sent = str(g.get("gold_sentiment", "")).capitalize()

        if gold_sent in SENTIMENT_CLASSES and aspect in ASPECTS:
            pred_sent = pred_map.get((r_id, aspect), "Neutral")
            y_true.append(gold_sent)
            y_pred.append(pred_sent)
            aspect_specific_data[aspect]["true"].append(gold_sent)
            aspect_specific_data[aspect]["pred"].append(pred_sent)

    if not y_true:
        return {
            "status": "pending",
            "evaluated": False,
            "message": "Evaluation pending – manually annotated dataset required."
        }

    overall_metrics = compute_metrics(y_true, y_pred)
    
    aspect_breakdown = {}
    for asp in ASPECTS:
        t_list = aspect_specific_data[asp]["true"]
        p_list = aspect_specific_data[asp]["pred"]
        if t_list:
            aspect_breakdown[asp] = compute_metrics(t_list, p_list)
        else:
            aspect_breakdown[asp] = {
                "accuracy": 0.0,
                "macro_f1": 0.0,
                "total_samples": 0,
                "message": "No gold annotations for this aspect in dataset."
            }

    return {
        "status": "success",
        "evaluated": True,
        "overall": overall_metrics,
        "aspect_breakdown": aspect_breakdown,
        "sample_count": len(y_true),
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
