"""
FastAPI Server for Hospitality Zero-Shot ABSA NLP Service.
Runs on port 8000.
Endpoints:
- POST /analyze: Single review clause segmentation + DeBERTa zero-shot ABSA
- POST /analyze-batch: Batch processing for CSV ingestion
- POST /evaluate: Strict evaluation against gold-standard annotated dataset
- GET /health: Health check, model status, and device metadata
- GET /config: Exact model specification, label mappings, and thresholds
"""

import time
import threading
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from clause_segmenter import extract_clauses, normalize_text
from deberta_engine import deberta_engine
from evaluation import evaluate_predictions
from config import (
    DEBERTA_MODEL_CHECKPOINT,
    MODEL_METADATA,
    ASPECTS,
    ASPECT_HYPOTHESES,
    get_sentiment_hypotheses,
    DECISION_THRESHOLDS
)

app = FastAPI(
    title="Hospitality ABSA Zero-Shot NLP Service",
    description="DeBERTa-based NLI Aspect-Based Sentiment Analysis for Hospitality Reviews",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SingleReviewRequest(BaseModel):
    review_text: str
    hotel_name: Optional[str] = "Unspecified Hotel"


class BatchReviewItem(BaseModel):
    review_id: Optional[str] = None
    hotel_name: Optional[str] = "Unspecified Hotel"
    review_text: str
    date: Optional[str] = None


class BatchReviewRequest(BaseModel):
    reviews: List[BatchReviewItem]


class EvaluationRequest(BaseModel):
    gold_records: List[Dict[str, Any]]
    predictions: Optional[List[Dict[str, Any]]] = None


@app.on_event("startup")
async def startup_event():
    print("[FastAPI NLP Service] Initializing DeBERTa ABSA Engine in background thread...")
    init_thread = threading.Thread(target=deberta_engine.initialize_model, daemon=True)
    init_thread.start()
    print("[FastAPI NLP Service] Server ready to accept requests.")


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "hospitality-absa-nlp-service",
        "engine": deberta_engine.engine_type,
        "model_checkpoint": deberta_engine.model_checkpoint,
        "model_loaded": deberta_engine.model_loaded,
        "device": deberta_engine.device,
        "aspects": ASPECTS,
        "decision_thresholds": DECISION_THRESHOLDS
    }


@app.get("/config")
def get_service_config():
    """Returns complete DeBERTa model specification, label mapping, and hypothesis templates."""
    aspect_hypotheses_map = {asp: get_sentiment_hypotheses(asp) for asp in ASPECTS}
    return {
        "model_metadata": MODEL_METADATA,
        "aspects": ASPECTS,
        "aspect_detection_hypotheses": ASPECT_HYPOTHESES,
        "sentiment_hypotheses": aspect_hypotheses_map,
        "decision_thresholds": DECISION_THRESHOLDS,
        "mapping_rules": [
            "1. Ambiguity Condition: If |P(Entailment|H_pos) - P(Entailment|H_neg)| < ambiguity_margin (0.08) and max < 0.55 -> Neutral (Abstained).",
            "2. Positive Condition: If P(Entailment|H_pos) >= P(Entailment|H_neg) + margin and >= P(Entailment|H_neu) -> Positive.",
            "3. Negative Condition: If P(Entailment|H_neg) >= P(Entailment|H_pos) + margin and >= P(Entailment|H_neu) -> Negative.",
            "4. Neutral Condition: If P(Entailment|H_neu) > max(P_pos, P_neg) or below polarity confidence -> Neutral."
        ]
    }


@app.post("/analyze")
def analyze_single_review(req: SingleReviewRequest):
    review_text = req.review_text.strip()
    if not review_text:
        raise HTTPException(status_code=400, detail="Review text cannot be empty.")

    start_time = time.time()
    
    # 1. Text Preprocessing & Syntactic Clause Segmentation
    clauses = extract_clauses(review_text)

    # 2. Zero-Shot Aspect Detection & 3-Hypothesis NLI Sentiment Inference
    analysis_result = deberta_engine.analyze_review(review_text, clauses)

    elapsed_ms = round((time.time() - start_time) * 1000, 2)
    analysis_result["processing_latency_ms"] = elapsed_ms
    analysis_result["hotel_name"] = req.hotel_name

    return analysis_result


@app.post("/analyze-batch")
def analyze_batch_reviews(req: BatchReviewRequest):
    if not req.reviews:
        raise HTTPException(status_code=400, detail="Reviews list cannot be empty.")

    batch_start = time.time()
    results = []

    for idx, item in enumerate(req.reviews):
        rev_start = time.time()
        review_text = item.review_text.strip()
        if not review_text:
            continue

        clauses = extract_clauses(review_text)
        analysis = deberta_engine.analyze_review(review_text, clauses)
        rev_latency = round((time.time() - rev_start) * 1000, 2)

        results.append({
            "review_id": item.review_id or f"REV-{idx+1:04d}",
            "hotel_name": item.hotel_name,
            "date": item.date,
            "latency_ms": rev_latency,
            "analysis": analysis
        })

    total_time_ms = round((time.time() - batch_start) * 1000, 2)
    avg_latency = round(total_time_ms / len(results), 2) if results else 0.0

    return {
        "status": "success",
        "total_processed": len(results),
        "total_latency_ms": total_time_ms,
        "avg_latency_ms": avg_latency,
        "results": results
    }


@app.post("/evaluate")
def run_evaluation(req: EvaluationRequest):
    """
    Evaluates predictions against manually annotated gold-standard records.
    If no gold annotations are available, returns status 'pending' with message:
    'Evaluation pending – manually annotated dataset required.'
    """
    predictions = req.predictions or []
    eval_result = evaluate_predictions(req.gold_records, predictions)
    return eval_result


if __name__ == "__main__":
    import uvicorn
    import os
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host=host, port=port, reload=False)
