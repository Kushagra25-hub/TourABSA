"""
DeBERTa Model & NLP Service Configuration
Specifies the exact Hugging Face checkpoint, model ID, label mappings, and inference parameters.
"""

import os

# Exact Hugging Face DeBERTa NLI Model Checkpoint
# Default: cross-encoder/nli-deberta-v3-small (141M parameters, based on Microsoft DeBERTa-v3 architecture)
# Alternative supported checkpoint: MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli
DEBERTA_MODEL_CHECKPOINT = os.environ.get(
    "DEBERTA_CHECKPOINT", 
    "cross-encoder/nli-deberta-v3-small"
)

# Model Metadata
MODEL_METADATA = {
    "model_id": DEBERTA_MODEL_CHECKPOINT,
    "architecture": "DeBERTa-v3 (Disentangled Attention with Enhanced Masked Language Modeling)",
    "pretraining_tasks": ["MNLI (Multi-Genre NLI)", "SNLI (Stanford NLI)"],
    "parameters": "141 Million Parameters (small) / 86 Million Backbone",
    "supported_device": "cuda" if os.environ.get("USE_CUDA", "0") == "1" else "cpu",
    "input_format": "[CLS] Premise Clause [SEP] Aspect Sentiment Hypothesis [SEP]",
    "raw_label_mapping": {
        0: "contradiction",
        1: "neutral",
        2: "entailment"
    },
    "memory_footprint": "~500 MB RAM / VRAM",
    "expected_latency": "20ms - 60ms per clause on modern CPU; <12ms on CUDA GPU"
}

# The Six Predefined Research Hospitality Aspects
ASPECTS = [
    "CLEANLINESS",
    "STAFF",
    "FOOD",
    "VALUE",
    "AMENITIES",
    "LOCATION"
]

# Aspect Descriptors & Zero-Shot Detection Hypotheses
ASPECT_HYPOTHESES = {
    "CLEANLINESS": "This text discusses room cleanliness, bathroom hygiene, linen cleanliness, or housekeeping maintenance.",
    "STAFF": "This text discusses hotel staff behavior, friendliness, professionalism, helpfulness, or front desk service.",
    "FOOD": "This text discusses food quality, taste, breakfast buffet, restaurant dining, or meal options.",
    "VALUE": "This text discusses price, affordability, cost, value for money, or room rates.",
    "AMENITIES": "This text discusses hotel amenities like Wi-Fi internet, swimming pool, gym, elevator, or room facilities.",
    "LOCATION": "This text discusses the hotel location, accessibility, distance to attractions, nearby transport, or surroundings."
}

# Three Aspect-Specific Sentiment Hypotheses per Aspect
def get_sentiment_hypotheses(aspect_name: str) -> dict:
    """
    Returns the three distinct aspect-specific hypotheses:
    1. Positive satisfaction
    2. Negative dissatisfaction
    3. Neutral opinion
    """
    asp_clean = aspect_name.lower()
    readable_aspect_map = {
        "cleanliness": "room and bathroom cleanliness",
        "staff": "hotel staff behavior and service",
        "food": "food and dining quality",
        "value": "pricing and value for money",
        "amenities": "hotel facilities and amenities",
        "location": "hotel location and accessibility"
    }
    target = readable_aspect_map.get(asp_clean, asp_clean)

    return {
        "Positive": f"The customer is satisfied and pleased with the {target}.",
        "Negative": f"The customer is dissatisfied or unhappy with the {target}.",
        "Neutral": f"The customer expresses a neutral, mixed, or indifferent opinion about the {target}."
    }

# Decision Thresholds for NLI Inference & Abstention
DECISION_THRESHOLDS = {
    "aspect_presence_threshold": 0.50,     # Minimum relevance score to consider an aspect mentioned
    "sentiment_confidence_threshold": 0.38, # Minimum probability required for polarity assignment
    "ambiguity_margin": 0.08               # |p_pos - p_neg| < margin triggers conservative abstention to Neutral
}
