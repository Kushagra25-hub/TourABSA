"""
Linguistically-Informed Clause Segmentation Module for Aspect-Based Sentiment Analysis.

Improvements:
1. Uses spaCy syntactic dependency parsing and token trees.
2. Avoids mechanically splitting on conjunctions ('and', 'also', 'or') when they coordinate
   compound nouns, compound adjectives, or prepositional phrases without changing clause semantics.
3. Splits strictly on genuine contrastive discourse markers ('but', 'however', 'although', 
   'whereas', 'while', 'yet', 'though', 'even though', 'nevertheless') or clausal punctuation (';', '--').
4. Preserves negation relationships: never separates negation tokens ('not', 'never', "n't", 'no')
   from the predicates/modifiers they govern.
5. Preserves original sentence context and handles subject elision in coordinated clauses.
"""

import re
from typing import List, Dict, Any, Optional

try:
    import spacy
    try:
        nlp = spacy.load("en_core_web_sm")
    except Exception:
        nlp = spacy.blank("en")
        if "sentencizer" not in nlp.pipe_names:
            nlp.add_pipe("sentencizer")
except ImportError:
    nlp = None


# Genuine contrastive conjunctions that signify semantic polarity shifts or clause boundaries
CONTRASTIVE_MARKERS = [
    r"\bbut\b",
    r"\bhowever\b",
    r"\balthough\b",
    r"\beven though\b",
    r"\bthough\b",
    r"\bwhile\b",
    r"\byet\b",
    r"\bwhereas\b",
    r"\bon the other hand\b",
    r"\bnevertheless\b",
    r"\bexcept that\b",
    r"\bexcept\b",
    r"\binstead\b"
]

CONTRASTIVE_REGEX = re.compile(
    r"(?:;\s*)|(?:\s*,\s*(?=" + "|".join(CONTRASTIVE_MARKERS) + r"))|(?:\s+(?=" + "|".join(CONTRASTIVE_MARKERS) + r"))",
    re.IGNORECASE
)

NEGATION_TOKENS = {"not", "never", "n't", "no", "hardly", "barely", "scarcely", "neither", "nor"}


def normalize_text(text: str) -> str:
    """Standardizes text while preserving casing, sentence punctuation, and structure."""
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"[\r\n\t]+", " ", text)
    text = re.sub(r"\s{2,}", " ", text)
    text = re.sub(r"!+", "!", text)
    text = re.sub(r"\?+", "?", text)
    return text.strip()


def segment_into_sentences(text: str) -> List[str]:
    """Extracts sentence spans using spaCy or punctuation-based boundary fallback."""
    if nlp is not None:
        doc = nlp(text)
        sentences = [sent.text.strip() for sent in doc.sents if sent.text.strip()]
        if sentences:
            return sentences

    raw_sents = re.split(r"(?<=[.!?])\s+", text)
    return [s.strip() for s in raw_sents if s.strip()]


def has_negation(text: str) -> bool:
    """Checks whether text contains active negation particles."""
    words = set(re.findall(r"\b\w+(?:'\w+)?\b", text.lower()))
    return bool(words.intersection(NEGATION_TOKENS))


def _extract_subject_from_spacy(doc_or_span) -> Optional[str]:
    """Attempts to find the nominal subject of a sentence/clause."""
    for token in doc_or_span:
        if token.dep_ in ("nsubj", "nsubjpass"):
            # Return subtree text for complete nominal phrase (e.g. "The hotel rooms")
            subj_tokens = [t.text for t in token.subtree if t.dep_ in ("compound", "det", "amod", "poss") or t == token]
            return " ".join(subj_tokens)
    return None


def split_sentence_with_spacy(sentence: str) -> List[Dict[str, Any]]:
    """
    Dependency-aware sentence clause segmentation:
    - Avoids breaking coordinated adjectives ('clean and comfortable')
    - Avoids breaking coordinated nouns ('food and drinks')
    - Splits on contrastive discourse markers when an independent or semi-independent clause exists
    - Restores elided subjects to secondary clauses
    """
    if len(sentence.split()) <= 4:
        return [{
            "clause_text": sentence,
            "context_preserved_text": sentence,
            "has_negation": has_negation(sentence),
            "segmentation_reason": "single_short_sentence"
        }]

    # If spaCy has full parser
    if nlp is not None and "parser" in nlp.pipe_names:
        doc = nlp(sentence)
        main_subject = _extract_subject_from_spacy(doc)

        # Check for contrastive tokens or semicolons
        split_indices = []
        for token in doc:
            # Semicolon boundary
            if token.text == ";":
                split_indices.append((token.i, "semicolon"))
            # Contrastive conjunction (e.g., 'but', 'however', 'although')
            elif token.text.lower() in ("but", "however", "although", "yet", "whereas", "while", "though"):
                # Ensure it's not simply an adverb like 'but a few'
                if token.head.pos_ in ("VERB", "ADJ", "AUX") or token.dep_ in ("cc", "mark", "advmod"):
                    split_indices.append((token.i, "contrastive_marker"))

        if split_indices:
            clauses = []
            prev_idx = 0
            for idx, reason in split_indices:
                clause_span = doc[prev_idx:idx].text.strip(" ,;.-")
                if len(clause_span.split()) >= 2:
                    clauses.append({
                        "clause_text": clause_span,
                        "context_preserved_text": clause_span,
                        "has_negation": has_negation(clause_span),
                        "segmentation_reason": reason
                    })
                prev_idx = idx

            # Last segment
            final_span = doc[prev_idx:].text.strip(" ,;.-")
            # Strip leading conjunction token for clean reading
            final_span_cleaned = re.sub(r"^(but|however|although|though|while|yet)\s+", "", final_span, flags=re.IGNORECASE).strip()
            
            if len(final_span_cleaned.split()) >= 2:
                # Subject elision recovery
                final_doc = nlp(final_span_cleaned)
                clause_subj = _extract_subject_from_spacy(final_doc)
                if not clause_subj and main_subject and len(final_span_cleaned.split()) >= 2:
                    context_text = f"{main_subject} {final_span_cleaned}"
                else:
                    context_text = final_span_cleaned

                clauses.append({
                    "clause_text": final_span_cleaned,
                    "context_preserved_text": context_text,
                    "has_negation": has_negation(final_span_cleaned),
                    "segmentation_reason": "contrastive_continuation"
                })

            if len(clauses) >= 2:
                return clauses

    # Fallback: Controlled regex split strictly on contrastive markers (NOT on 'and', 'also', 'or')
    parts = CONTRASTIVE_REGEX.split(sentence)
    clauses = []
    for part in parts:
        cleaned = part.strip(" ,;.-")
        cleaned_no_cc = re.sub(r"^(but|however|although|though|while|yet|on the other hand|nevertheless)\s+", "", cleaned, flags=re.IGNORECASE).strip()
        if len(cleaned_no_cc.split()) >= 2:
            clauses.append({
                "clause_text": cleaned_no_cc,
                "context_preserved_text": cleaned_no_cc,
                "has_negation": has_negation(cleaned_no_cc),
                "segmentation_reason": "contrastive_conjunction_split"
            })

    if not clauses:
        clauses = [{
            "clause_text": sentence,
            "context_preserved_text": sentence,
            "has_negation": has_negation(sentence),
            "segmentation_reason": "unsegmented_sentence"
        }]

    return clauses


def extract_clauses(review_text: str) -> List[Dict[str, Any]]:
    """
    Processes full review into normalized clauses with enriched linguistic metadata.
    Preserves parent sentence context, negation states, and elision recovery.
    """
    normalized = normalize_text(review_text)
    sentences = segment_into_sentences(normalized)
    
    clause_results = []
    c_id = 1

    for sent_idx, sentence in enumerate(sentences):
        clauses = split_sentence_with_spacy(sentence)
        for cl in clauses:
            clause_results.append({
                "clause_id": c_id,
                "clause_text": cl["clause_text"],
                "context_preserved_text": cl.get("context_preserved_text", cl["clause_text"]),
                "parent_sentence": sentence,
                "sentence_index": sent_idx + 1,
                "word_count": len(cl["clause_text"].split()),
                "has_negation": cl.get("has_negation", False),
                "segmentation_reason": cl.get("segmentation_reason", "standard")
            })
            c_id += 1

    if not clause_results and normalized:
        clause_results.append({
            "clause_id": 1,
            "clause_text": normalized,
            "context_preserved_text": normalized,
            "parent_sentence": normalized,
            "sentence_index": 1,
            "word_count": len(normalized.split()),
            "has_negation": has_negation(normalized),
            "segmentation_reason": "fallback_whole_review"
        })

    return clause_results
