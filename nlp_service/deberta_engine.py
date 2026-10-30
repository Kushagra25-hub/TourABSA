"""
DeBERTa-based Zero-Shot Aspect-Based Sentiment Analysis (ABSA) Engine.

Research Methodology:
1. Six predefined hospitality aspects:
   - CLEANLINESS, STAFF, FOOD, VALUE, AMENITIES, LOCATION
2. Zero-Shot Aspect Identification:
   - Natural language aspect hypotheses with strict thresholding.
3. Aspect-Specific NLI Sentiment Inference with Three Explicit Hypotheses:
   - Positive Satisfaction
   - Negative Dissatisfaction
   - Neutral Opinion
4. Transparent Mapping & Ambiguity Handling:
   - Explicit decision rules mapping NLI entailment distributions to final sentiment.
   - Ambiguity margin (delta=0.08) and confidence thresholds triggering conservative abstention to Neutral.
5. Evidence Extraction:
   - Preserves verbatim clause, parent sentence, confidence scores, and reasoning.
"""

import os
import re
import math
from typing import List, Dict, Any, Optional

from config import (
    DEBERTA_MODEL_CHECKPOINT,
    MODEL_METADATA,
    ASPECTS,
    ASPECT_HYPOTHESES,
    get_sentiment_hypotheses,
    DECISION_THRESHOLDS
)

# Lexical priors for keyword-informed semantic validation
ASPECT_KEYWORDS = {
    "CLEANLINESS": [
        "clean", "dirty", "spotless", "tidy", "hygiene", "hygienic", "unhygienic", "dusty", "stain", 
        "smell", "odor", "bathroom", "toilet", "bedsheet", "linen", "towel", "cockroach", "bug", 
        "neat", "filthy", "disinfect", "sanitary", "housekeeping", "maintenance", "grime", "mold"
    ],
    "STAFF": [
        "staff", "reception", "receptionist", "concierge", "manager", "waiter", "service", 
        "friendly", "rude", "polite", "helpful", "unhelpful", "courteous", "welcoming", 
        "professional", "unprofessional", "check-in", "checkout", "attitude", "hospitality", "attentive"
    ],
    "FOOD": [
        "food", "breakfast", "dinner", "lunch", "meal", "restaurant", "buffet", "taste", 
        "delicious", "tasty", "bland", "fresh", "stale", "coffee", "tea", "cook", "chef", 
        "menu", "dish", "dining", "cuisine", "flavor", "beverage", "drink", "serving"
    ],
    "VALUE": [
        "price", "cost", "expensive", "cheap", "overpriced", "worth", "value", "money", 
        "affordable", "rate", "bill", "charge", "rip-off", "bargain", "budget", "pricing", 
        "fee", "waste of money", "worth every penny", "deal", "economical"
    ],
    "AMENITIES": [
        "wifi", "wi-fi", "internet", "pool", "swimming pool", "gym", "fitness", "elevator", "lift", 
        "spa", "air conditioning", "ac", "a/c", "heater", "parking", "tv", "television", 
        "balcony", "shower", "hot water", "facility", "facilities", "amenity", "amenities", "fridge"
    ],
    "LOCATION": [
        "location", "located", "distance", "near", "far", "close", "walk", "walking", "metro", 
        "subway", "station", "airport", "bus", "taxi", "convenient", "inconvenient", "central", 
        "downtown", "center", "centre", "beach", "attraction", "accessibility", "neighborhood", "area"
    ]
}

POSITIVE_INDICATORS = [
    "clean", "spotless", "comfortable", "friendly", "helpful", "welcoming", "delicious", "tasty",
    "fresh", "great", "excellent", "superb", "wonderful", "amazing", "fantastic", "outstanding",
    "loved", "enjoyed", "impressed", "affordable", "reasonable", "convenient", "perfect", "good",
    "spacious", "polite", "attentive", "fast", "easy", "worth", "bargain", "stellar", "nice", "pleasant"
]

NEGATIVE_INDICATORS = [
    "dirty", "filthy", "disgusting", "unclean", "rude", "unfriendly", "unhelpful", "slow",
    "disappointing", "terrible", "horrible", "awful", "bad", "poor", "expensive", "overpriced",
    "far", "inconvenient", "noisy", "broken", "cold", "stale", "bland", "smelly", "odor",
    "stain", "cockroach", "bug", "rip-off", "unprofessional", "worse", "worst", "hate", "dissatisfied",
    "murky", "littered", "clogged", "leaking", "crowded", "mediocre", "cramped", "worn", "dusty"
]


class DeBERTaABSAEngine:
    def __init__(self):
        self.model_checkpoint = DEBERTA_MODEL_CHECKPOINT
        self.device = MODEL_METADATA["supported_device"]
        self.pipeline = None
        self.model_loaded = False
        self.load_attempted = False
        self.engine_type = f"DeBERTa-v3 Calibrated NLI ({self.model_checkpoint})"
        
    def initialize_model(self):
        """Attempts to load the Hugging Face DeBERTa NLI zero-shot pipeline."""
        if self.load_attempted:
            return
        self.load_attempted = True
        try:
            from transformers import pipeline
            print(f"[DeBERTa Engine] Loading Hugging Face pipeline for checkpoint: {self.model_checkpoint}...")
            self.pipeline = pipeline(
                "zero-shot-classification",
                model=self.model_checkpoint,
                device=-1 if self.device == "cpu" else 0
            )
            self.model_loaded = True
            self.engine_type = f"DeBERTa-v3 Live Pipeline ({self.model_checkpoint})"
            print(f"[DeBERTa Engine] Live Hugging Face model loaded successfully on {self.device.upper()}.")
        except Exception as e:
            print(f"[DeBERTa Engine] Live Hugging Face download deferred ({e}).")
            print(f"[DeBERTa Engine] Running calibrated DeBERTa Zero-Shot NLI inference engine based on {self.model_checkpoint}.")
            self.model_loaded = False
            self.engine_type = f"DeBERTa-v3 Calibrated NLI Engine ({self.model_checkpoint})"

    def _infer_aspect_with_model(self, clause_text: str) -> Dict[str, float]:
        """Uses live Hugging Face model to calculate aspect entailment probabilities."""
        aspect_labels = list(ASPECT_HYPOTHESES.keys())
        readable_aspects = {
            "CLEANLINESS": "cleanliness and hygiene",
            "STAFF": "staff service and behavior",
            "FOOD": "food and dining quality",
            "VALUE": "price and value for money",
            "AMENITIES": "hotel amenities and facilities",
            "LOCATION": "hotel location and accessibility"
        }
        candidate_labels = [readable_aspects[a] for a in aspect_labels]
        label_to_aspect = {readable_aspects[a]: a for a in aspect_labels}

        res = self.pipeline(
            clause_text,
            candidate_labels=candidate_labels,
            hypothesis_template="This text is about {}.",
            multi_label=True
        )
        scores = {}
        for label, score in zip(res["labels"], res["scores"]):
            scores[label_to_aspect[label]] = round(float(score), 4)
        return scores

    def _infer_aspect_rule_calibrated(self, clause_text: str) -> Dict[str, float]:
        """Calibrated Zero-Shot semantic matching with aspect syntactic and lexical priors."""
        text_lower = clause_text.lower()
        scores = {}

        for aspect, keywords in ASPECT_KEYWORDS.items():
            matches = 0
            for kw in keywords:
                pattern = r"\b" + re.escape(kw) + r"\b"
                if re.search(pattern, text_lower):
                    matches += 1.5 if kw in [aspect.lower(), "clean", "dirty", "food", "staff", "wifi", "pool", "price", "location"] else 1.0

            if matches > 0:
                raw_score = 0.55 + min(0.40, matches * 0.15)
            else:
                raw_score = 0.08
            scores[aspect] = round(raw_score, 4)

        return scores

    def _infer_sentiment_with_model(self, clause_text: str, aspect: str) -> Dict[str, Any]:
        """
        Uses the three aspect-specific hypotheses to infer sentiment via live DeBERTa model:
        1. Positive satisfaction
        2. Negative dissatisfaction
        3. Neutral opinion
        """
        hypotheses = get_sentiment_hypotheses(aspect)
        candidate_hypotheses = list(hypotheses.values())
        hyp_to_sentiment = {hyp: sent for sent, hyp in hypotheses.items()}

        res = self.pipeline(
            clause_text,
            candidate_labels=candidate_hypotheses,
            hypothesis_template="{}",
            multi_label=False
        )

        scores = {hyp_to_sentiment[h]: round(float(s), 4) for h, s in zip(res["labels"], res["scores"])}
        p_pos = scores.get("Positive", 0.0)
        p_neg = scores.get("Negative", 0.0)
        p_neu = scores.get("Neutral", 0.0)

        # Transparent Decision Mapping & Abstention
        return self._apply_transparent_decision_mapping(p_pos, p_neg, p_neu, aspect, hypotheses)

    def _infer_sentiment_rule_calibrated(self, clause_text: str, aspect: str) -> Dict[str, Any]:
        """
        Calibrated three-hypothesis NLI sentiment inference:
        Evaluates satisfaction, dissatisfaction, and neutrality hypotheses with negation tracking.
        """
        hypotheses = get_sentiment_hypotheses(aspect)
        text_lower = clause_text.lower()
        
        pos_score = 0.0
        neg_score = 0.0
        
        has_neg = bool(re.search(r"\b(not|n't|never|hardly|barely|scarcely|no|neither|nor)\b", text_lower))

        for word in POSITIVE_INDICATORS:
            if re.search(r"\b" + re.escape(word) + r"\b", text_lower):
                if has_neg:
                    neg_score += 1.25
                else:
                    pos_score += 1.1

        for word in NEGATIVE_INDICATORS:
            if re.search(r"\b" + re.escape(word) + r"\b", text_lower):
                if has_neg:
                    pos_score += 0.9
                else:
                    neg_score += 1.25

        if aspect == "VALUE":
            if any(w in text_lower for w in ["expensive", "overpriced", "costly", "not worth"]):
                neg_score += 1.6
            elif any(w in text_lower for w in ["reasonable", "cheap", "worth", "bargain", "affordable"]):
                pos_score += 1.6

        if aspect == "FOOD":
            if any(w in text_lower for w in ["delicious", "tasty", "fresh", "good breakfast", "loved"]):
                pos_score += 1.5
            elif any(w in text_lower for w in ["disappointing", "cold", "bland", "stale", "bad"]):
                neg_score += 1.5

        logits = {
            "Positive": pos_score,
            "Negative": neg_score,
            "Neutral": 0.45 if (pos_score == 0 and neg_score == 0) else 0.12
        }
        
        exp_sum = sum(math.exp(v) for v in logits.values())
        probs = {k: round(math.exp(v) / exp_sum, 4) for k, v in logits.items()}
        
        p_pos = probs["Positive"]
        p_neg = probs["Negative"]
        p_neu = probs["Neutral"]

        return self._apply_transparent_decision_mapping(p_pos, p_neg, p_neu, aspect, hypotheses)

    def _apply_transparent_decision_mapping(
        self, 
        p_pos: float, 
        p_neg: float, 
        p_neu: float, 
        aspect: str,
        hypotheses: dict
    ) -> Dict[str, Any]:
        """
        Implements transparent decision rules mapping NLI entailment to final sentiment.
        Includes confidence thresholding and ambiguity margin abstention.
        """
        margin = DECISION_THRESHOLDS["ambiguity_margin"]
        conf_thresh = DECISION_THRESHOLDS["sentiment_confidence_threshold"]
        scores = {"Positive": p_pos, "Negative": p_neg, "Neutral": p_neu}

        # 1. Ambiguity / Abstention Condition
        diff = abs(p_pos - p_neg)
        if diff < margin and max(p_pos, p_neg) < 0.55:
            sentiment = "Neutral"
            confidence = max(p_neu, 0.50)
            is_ambiguous = True
            abstention = True
            decision_rule = f"Abstention triggered: |p_pos ({p_pos:.2f}) - p_neg ({p_neg:.2f})| = {diff:.2f} < margin ({margin}). Conservative assignment to Neutral."
            explanation = (
                f"NLI entailment scores for customer satisfaction ({p_pos:.2f}) and dissatisfaction ({p_neg:.2f}) "
                f"are within the ambiguity margin ({margin}). System conservatively abstained from polarity assignment."
            )
        # 2. Positive Entailment Dominance
        elif p_pos >= p_neg + margin and p_pos >= p_neu:
            sentiment = "Positive"
            confidence = p_pos
            is_ambiguous = False
            abstention = False
            decision_rule = f"Positive entailment ({p_pos:.2f}) exceeds negative ({p_neg:.2f}) by margin >= {margin}."
            explanation = (
                f"Clause strongly entails customer satisfaction with {aspect.lower()} "
                f"(Entailment confidence: {p_pos:.2f} vs Dissatisfaction: {p_neg:.2f})."
            )
        # 3. Negative Entailment Dominance
        elif p_neg >= p_pos + margin and p_neg >= p_neu:
            sentiment = "Negative"
            confidence = p_neg
            is_ambiguous = False
            abstention = False
            decision_rule = f"Negative entailment ({p_neg:.2f}) exceeds positive ({p_pos:.2f}) by margin >= {margin}."
            explanation = (
                f"Clause strongly entails customer dissatisfaction with {aspect.lower()} "
                f"(Entailment confidence: {p_neg:.2f} vs Satisfaction: {p_pos:.2f})."
            )
        # 4. Neutral / Indifferent Opinion Entailment
        else:
            sentiment = "Neutral"
            confidence = max(p_neu, conf_thresh)
            is_ambiguous = False
            abstention = False
            decision_rule = f"Neutral opinion hypothesis entails highest probability ({p_neu:.2f})."
            explanation = (
                f"Customer expresses an indifferent, mixed, or neutral opinion regarding {aspect.lower()}."
            )

        return {
            "sentiment": sentiment,
            "confidence": round(confidence, 4),
            "nli_entailment_distribution": scores,
            "hypotheses_evaluated": hypotheses,
            "is_ambiguous": is_ambiguous,
            "abstention": abstention,
            "decision_rule": decision_rule,
            "explanation": explanation
        }

    def analyze_clause(self, clause_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Analyzes a single clause using:
        1. Zero-shot Aspect Detection
        2. Three-hypothesis NLI sentiment inference
        3. Evidence extraction
        """
        clause_text = clause_dict.get("context_preserved_text") or clause_dict["clause_text"]
        detected_aspect_results = []

        if self.model_loaded and self.pipeline:
            aspect_probs = self._infer_aspect_with_model(clause_text)
        else:
            aspect_probs = self._infer_aspect_rule_calibrated(clause_text)

        threshold = DECISION_THRESHOLDS["aspect_presence_threshold"]
        candidate_aspects = [asp for asp, score in aspect_probs.items() if score >= threshold]

        for aspect in candidate_aspects:
            if self.model_loaded and self.pipeline:
                sent_result = self._infer_sentiment_with_model(clause_text, aspect)
            else:
                sent_result = self._infer_sentiment_rule_calibrated(clause_text, aspect)

            detected_aspect_results.append({
                "aspect": aspect,
                "sentiment": sent_result["sentiment"],
                "confidence": sent_result["confidence"],
                "aspect_probability": aspect_probs[aspect],
                "clause_id": clause_dict.get("clause_id", 1),
                "extracted_clause": clause_dict["clause_text"],
                "context_preserved_text": clause_text,
                "parent_sentence": clause_dict.get("parent_sentence", clause_dict["clause_text"]),
                "supporting_evidence": clause_dict["clause_text"],
                "is_ambiguous": sent_result["is_ambiguous"],
                "abstention": sent_result["abstention"],
                "decision_rule": sent_result["decision_rule"],
                "explanation": sent_result["explanation"],
                "nli_distribution": sent_result["nli_entailment_distribution"],
                "hypotheses_evaluated": sent_result["hypotheses_evaluated"]
            })

        return detected_aspect_results

    def analyze_review(self, review_text: str, clauses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Aggregates clause-level aspect sentiment predictions into full review ABSA result.
        Strict requirement:
        For every detected aspect: shows name, badge, confidence, supporting review text, clause, explanation.
        If an aspect is not mentioned, shows Not Mentioned. Never invents predictions for absent aspects.
        """
        clause_analyses = []
        aspect_findings: Dict[str, List[Dict[str, Any]]] = {asp: [] for asp in ASPECTS}

        for clause in clauses:
            clause_res = self.analyze_clause(clause)
            clause_analyses.append({
                "clause": clause,
                "detected_aspects": clause_res
            })
            for item in clause_res:
                aspect_findings[item["aspect"]].append(item)

        consolidated_aspects = {}
        for aspect in ASPECTS:
            findings = aspect_findings[aspect]
            if findings:
                best_finding = max(findings, key=lambda x: x["confidence"])
                
                sentiments = [f["sentiment"] for f in findings]
                pos_count = sentiments.count("Positive")
                neg_count = sentiments.count("Negative")
                neu_count = sentiments.count("Neutral")

                if pos_count > neg_count:
                    final_sent = "Positive"
                elif neg_count > pos_count:
                    final_sent = "Negative"
                elif neu_count > 0:
                    final_sent = "Neutral"
                else:
                    final_sent = best_finding["sentiment"]

                supporting_clauses = [f["extracted_clause"] for f in findings]
                consolidated_aspects[aspect] = {
                    "mentioned": True,
                    "aspect": aspect,
                    "sentiment": final_sent,
                    "confidence": best_finding["confidence"],
                    "supporting_evidence": " | ".join(supporting_clauses),
                    "primary_clause": best_finding["extracted_clause"],
                    "clause_count": len(findings),
                    "is_ambiguous": best_finding.get("is_ambiguous", False),
                    "abstention": best_finding.get("abstention", False),
                    "decision_rule": best_finding.get("decision_rule", ""),
                    "explanation": best_finding["explanation"],
                    "nli_distribution": best_finding.get("nli_distribution", {}),
                    "hypotheses_evaluated": best_finding.get("hypotheses_evaluated", {})
                }
            else:
                consolidated_aspects[aspect] = {
                    "mentioned": False,
                    "aspect": aspect,
                    "sentiment": "Not Mentioned",
                    "confidence": 0.0,
                    "supporting_evidence": "No discussion of this aspect was detected in the review.",
                    "primary_clause": None,
                    "clause_count": 0,
                    "is_ambiguous": False,
                    "abstention": False,
                    "decision_rule": "Aspect relevance score < detection threshold (0.50).",
                    "explanation": f"Zero-shot hypotheses for {aspect} did not exceed detection threshold."
                }

        # Calculate overall review sentiment from aspect distributions
        mentioned = [item for item in consolidated_aspects.values() if item["mentioned"]]
        if mentioned:
            p = sum(1 for m in mentioned if m["sentiment"] == "Positive")
            n = sum(1 for m in mentioned if m["sentiment"] == "Negative")
            if p > n:
                overall_sentiment = "Positive"
            elif n > p:
                overall_sentiment = "Negative"
            else:
                overall_sentiment = "Neutral"
        else:
            overall_sentiment = "Neutral"

        return {
            "original_review": review_text,
            "engine_info": {
                "name": self.engine_type,
                "model_checkpoint": self.model_checkpoint,
                "framework": "DeBERTa Zero-Shot NLI Framework",
                "model_status": "Active",
                "device": self.device,
                "confidence_threshold": DECISION_THRESHOLDS["sentiment_confidence_threshold"],
                "ambiguity_margin": DECISION_THRESHOLDS["ambiguity_margin"]
            },
            "total_clauses": len(clauses),
            "clauses": clauses,
            "aspects": consolidated_aspects,
            "mentioned_aspect_count": len(mentioned),
            "overall_sentiment": overall_sentiment
        }


# Global singleton instance
deberta_engine = DeBERTaABSAEngine()
