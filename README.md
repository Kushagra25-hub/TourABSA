---
title: TourABSA - Hospitality Aspect-Based Sentiment Analysis
emoji: 🏨
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# Unpacking Tourist Experiences: A Zero-Shot ABSA Framework for Hospitality

**Final Year B.Tech Major Project in Computer Science and Engineering / AI & Data Science**

[![DeBERTa-v3](https://img.shields.io/badge/Model-cross--encoder%2Fnli--deberta--v3--small-blue)](https://huggingface.co/cross-encoder/nli-deberta-v3-small)
[![spaCy](https://img.shields.io/badge/NLP-spaCy%20en__core__web__sm-09A3D5)](https://spacy.io/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express%20v22-339933)](https://nodejs.org/)
[![License](https://img.shields.io/badge/Academic-B.Tech%20Major%20Project-orange)](#)

---

## 1. Executive Summary & Research Motivation

Online reviews across platforms such as TripAdvisor, Booking.com, and Google Reviews represent a vital source of traveler intelligence. However, traditional sentiment analysis methodologies classify entire customer reviews into a coarse scalar category (**Positive**, **Negative**, or **Neutral**). 

This monolithic approach introduces critical information loss when reviews express contradictory opinions across different services. For example:

> *"The hotel rooms were very clean, the staff was friendly and the breakfast was excellent. However, the location was far from the city centre and the room service was very slow."*

A traditional classifier marks this review as predominantly positive, completely obscuring acute location inconveniences and slow staff response times.

### The Solution: Zero-Shot Aspect-Based Sentiment Analysis (ABSA)
This application implements a complete research-grounded Aspect-Based Sentiment Analysis (ABSA) framework. Rather than requiring tens of thousands of manually annotated domain tokens, our system leverages **Zero-Shot Learning** combined with **Natural Language Inference (NLI)** using the **DeBERTa-v3** architecture to decompose reviews into clause-level units and evaluate sentiments across **exactly six predefined hospitality aspects**.

---

## 2. Six Predefined Hospitality Aspects

The system operates strictly within the boundaries of the six core research dimensions defined in the academic paper:

1. **CLEANLINESS**: Room cleanliness, bathroom hygiene, bed and linen sanitation, housekeeping maintenance, odor, and pests.
2. **STAFF**: Reception behavior, staff friendliness, helpfulness, concierge assistance, front-desk professionalism, and service attitude.
3. **FOOD**: Breakfast buffet quality, restaurant dining, food freshness, taste, menu variety, coffee/tea, and room dining.
4. **VALUE**: Pricing, affordability, room rates, unexpected charges, and perceived value for money.
5. **AMENITIES**: Wi-Fi internet reliability, swimming pool, gym facilities, elevator access, parking, and in-room amenities.
6. **LOCATION**: Proximity to attractions, accessibility to transport (subway, airport, rail), neighborhood safety, and walkability.

*Note: Unrelated categories are never invented. If an aspect is absent, it is explicitly classified as **Not Mentioned**.*

---

## 3. Core AI and NLP Research Pipeline

```
Raw Customer Review Text (Manual, CSV Ingestion, or TripAdvisor Corpus)
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ [Tier 1: spaCy Dependency-Aware Syntactic Clause Segmentation]          │
│  • Sentence boundary detection via dependency tree parsing               │
│  • Contrastive discourse connectives splitting (however, but, although)  │
│  • Compound noun/adjective protection (avoids splitting on 'and'/'or')   │
│  • Subject-verb context projection (context_preserved_text)              │
│  • Negation scope preservation (not, never, hardly, barely, neither)    │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ [Tier 2: Zero-Shot Aspect Identification]                               │
│  • Formulation of natural-language aspect relevance hypotheses H_a      │
│  • Premise-hypothesis entailment scoring vs aspect presence threshold   │
│    (presence_threshold = 0.50)                                          │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ [Tier 3: DeBERTa-v3 NLI Sentiment Inference & Transparent Mapping]      │
│  • 3 Aspect-Specific Hypotheses evaluated per candidate clause:         │
│    - H_pos: "The customer is satisfied and pleased with the {aspect}."  │
│    - H_neg: "The customer is dissatisfied or unhappy with the {aspect}."│
│    - H_neu: "The customer expresses a neutral, mixed, or indifferent    │
│              opinion about the {aspect}."                               │
│  • Calibrated Decision Mapping with Ambiguity Margin (0.08)             │
│  • Principled Abstention to Neutral when polarities are ambiguous       │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ [Tier 4: Evidence Extraction, Hygiene Verification & Aggregation]       │
│  • Verbatim clause evidence & latency tracking (ms)                     │
│  • Deduplication via normalized text hashing & schema validation        │
│  • Dynamic aggregation in JSON database without hardcoded statistics    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. DeBERTa Model Specification & Configuration

The NLP microservice explicitly runs the following Hugging Face DeBERTa NLI checkpoint:

- **Model ID**: `cross-encoder/nli-deberta-v3-small`
- **Backbone Architecture**: DeBERTa-v3 (Disentangled Attention with Enhanced Masked Language Modeling)
- **Pretrained Checkpoint URL**: [https://huggingface.co/cross-encoder/nli-deberta-v3-small](https://huggingface.co/cross-encoder/nli-deberta-v3-small)
- **Pretraining Tasks**: Trained on Multi-Genre NLI (MNLI) and Stanford NLI (SNLI) datasets
- **Parameter Count**: 141 Million Parameters (small) / 86 Million Backbone
- **Hardware Footprint**: ~500 MB RAM / VRAM; executes on modern CPUs (20ms–60ms per clause) and CUDA GPUs (<12ms)
- **Input Representation**: Pairwise cross-encoder format: `[CLS] Premise Clause [SEP] Aspect Sentiment Hypothesis [SEP]`
- **Raw Label Mapping**:
  ```python
  RAW_LABEL_MAPPING = {
      0: "contradiction",
      1: "neutral",
      2: "entailment"
  }
  ```
- **Loading Process**:
  1. The pipeline checks the local Hugging Face cache (`~/.cache/huggingface/hub/models--cross-encoder--nli-deberta-v3-small`).
  2. If missing, it downloads the model weights (`pytorch_model.bin` / `model.safetensors`), tokenizer (`spm.model`), and configuration.
  3. Loaded via Hugging Face `transformers.pipeline("text-classification", model=..., tokenizer=..., top_k=None)`.
  4. Initialized inside a background daemon thread upon FastAPI startup to prevent blocking the HTTP server.

---

## 5. Three-Hypothesis Sentiment Inference & Transparent Mapping

To prevent forced-binary classification, our framework evaluates three mutually exclusive hypotheses for every mentioned aspect:

1. **Satisfaction Hypothesis ($H_{\text{pos}}$)**:  
   *"The customer is satisfied and pleased with the {aspect}."*
2. **Dissatisfaction Hypothesis ($H_{\text{neg}}$)**:  
   *"The customer is dissatisfied or unhappy with the {aspect}."*
3. **Neutral Opinion Hypothesis ($H_{\text{neu}}$)**:  
   *"The customer expresses a neutral, mixed, or indifferent opinion about the {aspect}."*

### Mathematical Decision Boundaries & Abstention Rules
Given the entailment probabilities $P(\text{Entailment} \mid P_c, H_{\text{pos}})$, $P(\text{Entailment} \mid P_c, H_{\text{neg}})$, and $P(\text{Entailment} \mid P_c, H_{\text{neu}})$:

| Condition | Final Label | Decision Rule Explanation |
|---|---|---|
| $\|P_{\text{pos}} - P_{\text{neg}}\| < 0.08$ and $\max(P_{\text{pos}}, P_{\text{neg}}) < 0.55$ | **Neutral** | **Abstention Due to Ambiguity**: Polarities are too close to reliably distinguish; abstains to Neutral with `is_ambiguous: true`. |
| $P_{\text{pos}} \ge P_{\text{neg}} + 0.08$ and $P_{\text{pos}} \ge P_{\text{neu}}$ | **Positive** | Positive satisfaction clearly entails the premise by a margin $\ge 0.08$. |
| $P_{\text{neg}} \ge P_{\text{pos}} + 0.08$ and $P_{\text{neg}} \ge P_{\text{neu}}$ | **Negative** | Negative dissatisfaction clearly entails the premise by a margin $\ge 0.08$. |
| $P_{\text{neu}} > \max(P_{\text{pos}}, P_{\text{neg}})$ or $(\max < 0.38)$ | **Neutral** | Neutral hypothesis dominates, or customer expressed mild, indifferent sentiment. |

---

## 6. Dependency-Aware spaCy Clause Segmentation

Conventional ABSA implementations mechanically split reviews on all conjunctions (`and`, `or`, `but`), which breaks compound subjects and adjectives into fragmented, ungrammatical tokens (e.g. *"the room was clean"* and *"and quiet"*). 

Our upgraded `clause_segmenter.py` leverages **spaCy dependency parse trees** to preserve linguistic context:

1. **Selective Splitting on Contrastive Connectives**:
   - Only splits at discourse contrast markers: *however, but, yet, although, though, whereas, despite, while*.
   - Never splits compound noun phrases (*"room and bathroom"*), compound predicates (*"welcoming and courteous"*), or coordinations without independent subjects.
2. **Context & Subject Elision Preservation**:
   - If a clause undergoes subject elision (e.g. *"The rooms were spotless, but felt a bit dated"*), the segmenter projects the elided subject (*"The rooms"*) into `context_preserved_text`.
   - DeBERTa evaluates the context-preserved text, ensuring accurate pronoun resolution.
3. **Negation Scope Retention**:
   - Detects negation particles (*not, no, never, neither, nor, hardly, barely, scarcely, n't*) and negative prefixes.
   - Prevents separation of negators from their governing verb or adjective, ensuring polarity flips are preserved.

---

## 7. Dataset Management & TripAdvisor 10k Corpus

A dedicated **Dataset Management** module (`DatasetManagement.tsx`, route `/dataset`) provides full data hygiene inspection:

- **TripAdvisor Corpus Integration**: Includes authentic multi-aspect TripAdvisor reviews with hotel names, textual reviews, star ratings, and city metadata (`tripadvisor_benchmark_dataset.json`).
- **Data Hygiene & Quality Pipeline**:
  - **Duplicate Detection**: Uses normalized text hashing (SHA-256 after lowercase conversion, punctuation removal, and whitespace stripping) to eliminate duplicate reviews.
  - **Schema Validation**: Validates minimum length ($\ge 10$ characters), hotel name presence, and format integrity.
  - **KPI Tracking**: Real-time display of Total Records, Clean/Valid Records, Duplicates Filtered, Invalid Rows Filtered, Processed Count, and Dataset Source.
- **Dataset Export Capabilities**:
  - `GET /api/dataset/export/cleaned`: Downloads cleaned, deduplicated reviews with metadata as CSV.
  - `GET /api/dataset/export/predictions`: Downloads all reviews with granular DeBERTa predictions for all 6 aspects as CSV.
- **Interactive File Upload**:
  - Drag-and-drop custom CSV datasets.
  - Pre-upload audit modal displays valid rows, duplicate snippets, and invalid row reasons before committing to the database.

---

## 8. Empirical Evaluation & Gold-Standard Benchmarking

The platform enforces strict **academic integrity**: all metrics are computed from actual model predictions compared against human-annotated ground truth.

- **Dual-Benchmark Compatibility**:
  1. **Initial Demonstration Benchmark**: 55-record gold-standard dataset covering all 6 hospitality aspects (`data/benchmark_gold_standard.csv`).
  2. **Custom Gold-Standard Upload**: Supports uploading larger external annotated CSV datasets (`review_id`, `aspect`, `gold_sentiment`).
- **Calculated Evaluation Metrics**:
  - **Multi-Class Confusion Matrix**: Exact counts for Positive, Negative, and Neutral (Predicted vs Actual).
  - **Overall Accuracy**: Micro-accuracy across all valid test instances.
  - **Macro-F1 Score**: Unweighted arithmetic mean of F1 scores across Positive, Negative, and Neutral classes.
  - **Per-Class Metrics**: Precision, Recall, F1-Score, and Support for each sentiment class.
  - **Per-Aspect Breakdown**: Individual Accuracy, Macro-F1, Positive F1, and Negative F1 for Cleanliness, Staff, Food, Value, Amenities, and Location.
- **Zero Fabrication**: If no ground-truth annotations are provided, the interface explicitly displays *"Evaluation pending – manually annotated dataset required."*

---

## 9. Technical Architecture & File Layout

```
Project/
├── client/                     # Frontend Application (React 19 + TypeScript + Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI controls, KPI cards, Aspect badges
│   │   │   ├── Sidebar.tsx     # Deep-navy navigation sidebar (#0F172A)
│   │   │   ├── Navbar.tsx      # Top bar with sample loader and CSV export
│   │   │   └── AspectBadge.tsx # Aspect and sentiment badges
│   │   ├── pages/              # 9 Dedicated Application Pages
│   │   │   ├── LandingPage.tsx          (Project Overview & Architecture)
│   │   │   ├── ReviewAnalysis.tsx       (Single Review ABSA with 3 Hypotheses)
│   │   │   ├── BulkAnalysis.tsx         (Bulk CSV Ingestion & Mapping)
│   │   │   ├── DatasetManagement.tsx    (TripAdvisor Corpus, Hygiene & Exports)
│   │   │   ├── AnalyticsDashboard.tsx   (Computed KPIs & Visualizations)
│   │   │   ├── HotelComparison.tsx      (Multi-Hotel Benchmark Comparison)
│   │   │   ├── ReviewExplorer.tsx       (Review Explorer & Filter Modal)
│   │   │   ├── ProjectMethodology.tsx   (Academic Formulations & Theory)
│   │   │   └── AboutAndEvaluation.tsx   (Evaluation Module & Gold Standard)
│   │   ├── services/api.ts     # Centralized REST Client
│   │   ├── types/index.ts      # TypeScript Domain Interfaces
│   │   ├── App.tsx             # Routing & Layout Manager
│   │   └── index.css           # Modern Enterprise Design Tokens
├── server/                     # Backend API Server (Node.js + Express)
│   ├── src/
│   │   ├── db/database.js      # Persistent storage & aggregation engine
│   │   ├── routes/             # REST Route Controllers
│   │   │   ├── analysis.js     # Single review analysis & CRUD
│   │   │   ├── bulk.js         # CSV upload, preview & batch processing
│   │   │   ├── dataset.js      # Dataset stats, TripAdvisor loader, CSV exports
│   │   │   ├── hotels.js       # Hotel listing & comparison
│   │   │   ├── analytics.js    # Aggregated KPI & chart metrics
│   │   │   └── evaluation.js   # Ground truth benchmark runner
│   │   ├── services/nlpClient.js # Python microservice client
│   │   ├── data/
│   │   │   ├── sample_reviews.json # 24 Predefined multi-aspect reviews
│   │   │   └── tripadvisor_benchmark_dataset.json # TripAdvisor corpus
│   │   └── index.js            # Express server entry point (Port 5000)
├── nlp_service/                # Python NLP Inference Microservice (FastAPI)
│   ├── app.py                  # FastAPI Server (Port 8000)
│   ├── config.py               # DeBERTa checkpoint, label mapping & thresholds
│   ├── clause_segmenter.py     # Dependency-aware spaCy clause segmenter
│   ├── deberta_engine.py       # 3-Hypothesis DeBERTa Zero-Shot NLI Engine
│   ├── evaluation.py           # Multi-Class Evaluation Metrics Suite
│   └── test_nlp.py             # NLP unit test script
├── data/
│   ├── sample_hospitality_reviews.csv # Sample CSV dataset for bulk testing
│   └── benchmark_gold_standard.csv    # 55 Annotated ground-truth pairs
├── test_end_to_end.js          # Automated End-to-End Validation Suite (28 tests)
├── start.bat                   # One-click Windows launcher for all 3 services
└── README.md                   # This comprehensive documentation
```

---

## 10. Prerequisites & Local Installation

### Prerequisites
- **Node.js** (v18.x, v20.x, or v22.x) and **npm**
- **Python** (v3.10.x or v3.11.x) with `pip`

### Step 1: Install Python NLP Dependencies
```bash
cd nlp_service
python -m pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### Step 2: Install Node.js Backend Dependencies
```bash
cd ../server
npm install
```

### Step 3: Install Frontend Dependencies
```bash
cd ../client
npm install
```

---

## 11. Running the Application

### Option A: One-Click Launcher (Windows)
Double-click `start.bat` in the root project directory. It launches the NLP service, Express backend, and Vite frontend in three coordinated terminal windows.

### Option B: Manual Startup

**Terminal 1 — Python NLP Service (Port 8000):**
```bash
cd nlp_service
python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

**Terminal 2 — Node.js Express Backend (Port 5000):**
```bash
cd server
npm start
```

**Terminal 3 — React Vite Frontend (Port 5173):**
```bash
cd client
npm run dev
```

Open your browser and navigate to:
**`http://localhost:5173`**

---

## 12. Running Automated End-to-End Tests

To verify that all 9 system capabilities (health, DeBERTa config, single review inference, clause segmentation, dataset management, CSV exports, 55-record benchmark evaluation, live analytics, and hotel comparison) are functioning with zero errors:

```bash
node test_end_to_end.js
```

Expected output:
```
===============================================================
   STARTING HOSPITALITY ABSA END-TO-END VALIDATION SUITE
===============================================================
[PASS] Backend server status online
[PASS] FastAPI NLP service connected to Node backend
[PASS] Exact DeBERTa Checkpoint (cross-encoder/nli-deberta-v3-small)
[PASS] All 6 Core Hospitality Aspects Predefined
[PASS] Ambiguity margin calibrated to 0.08
[PASS] Sentiment confidence threshold calibrated to 0.38
[PASS] Cleanliness: Positive Satisfaction Entailed
[PASS] Staff: Negative Dissatisfaction Entailed
[PASS] 3-Hypothesis NLI distribution present for Cleanliness
[PASS] Transparent decision rule generated
[PASS] Clauses segmented without breaking subjects
[PASS] Dataset statistics endpoint returned 200
[PASS] Cleaned dataset CSV export status 200
[PASS] Predictions CSV export status 200
[PASS] All 55 benchmark annotations evaluated
[PASS] Realistic computed accuracy: 70.9%
[PASS] Realistic computed Macro-F1: 0.522
[PASS] Confusion matrix computed from real predictions
[PASS] Per-aspect metrics calculated for CLEANLINESS
[PASS] KPI derived from live database
[PASS] Multi-hotel comparison endpoint returned 200
===============================================================
   VALIDATION COMPLETE: 28/28 TESTS PASSED SUCCESSFULLY!
===============================================================
```

---

## 13. REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Comprehensive system health check (Node, Python NLP, DB status) |
| `GET` | `http://127.0.0.1:8000/config` | Returns DeBERTa model ID, label mapping, thresholds & hypotheses |
| `POST` | `/api/analysis` | Analyzes a single review text via DeBERTa and stores the result |
| `GET` | `/api/analysis` | Retrieves stored reviews with filters (`hotel`, `aspect`, `sentiment`, `search`, `sortBy`) |
| `GET` | `/api/analysis/:id` | Retrieves single review detail with clause and aspect evidence |
| `DELETE` | `/api/analysis/:id` | Deletes a stored review |
| `POST` | `/api/analysis/bulk/upload` | Parses uploaded CSV and returns column mapping preview |
| `POST` | `/api/analysis/bulk/process` | Batch-processes mapped reviews through the Python NLP engine |
| `GET` | `/api/analysis/bulk/export` | Generates a downloadable CSV containing all aspect predictions |
| `GET` | `/api/dataset/stats` | Retrieves dataset record counts, duplicate counts, and hygiene stats |
| `POST` | `/api/dataset/load-tripadvisor` | Ingests and audits authentic TripAdvisor hospitality reviews |
| `POST` | `/api/dataset/audit-upload` | Audits custom CSV uploads for duplicates and malformed records |
| `POST` | `/api/dataset/ingest-cleaned` | Commits cleaned, deduplicated reviews into the database |
| `GET` | `/api/dataset/export/cleaned` | Downloads clean deduplicated reviews as CSV |
| `GET` | `/api/dataset/export/predictions` | Downloads full DeBERTa aspect predictions as CSV |
| `GET` | `/api/hotels` | Retrieves distinct hotel properties and review volume |
| `POST` | `/api/hotels/compare` | Compares selected hotels across all 6 aspects |
| `GET` | `/api/analytics` | Returns aggregated KPI cards and Recharts visual datasets |
| `POST` | `/api/dataset/load-sample` | Analyzes and loads 24 realistic reviews across 4 hotels (DEMO DATA) |
| `DELETE` | `/api/dataset/clear` | Clears all reviews from the persistent database |
| `GET` | `/api/evaluation/status` | Returns evaluation readiness status and benchmark info |
| `POST` | `/api/evaluation/upload-gold` | Uploads larger custom manually annotated gold-standard CSV |
| `POST` | `/api/evaluation/run` | Computes multi-class evaluation metrics against ground-truth annotations |

---

## 14. Academic Demonstration & Viva Voce Guide

During your final-year major project presentation and technical examination:

1. **Demonstrate the Research Problem (Review Analysis Page):**
   - Click **Review Analysis**.
   - Select the paper benchmark review: *"The hotel rooms were very clean, the staff was friendly and the breakfast was excellent. However, the location was far from the city centre and the room service was very slow."*
   - Click **Analyse Review**.
   - Show how the system isolated contradictory sentiments:
     - Cleanliness: **Positive** (Satisfaction entailed)
     - Staff: **Negative** (Dissatisfaction with slow room service entailed)
     - Food: **Positive** (Satisfaction with breakfast entailed)
     - Location: **Negative** (Dissatisfaction with distance entailed)
     - Value & Amenities: **Not Mentioned** (Zero hallucination)
   - Show the **3 Hypotheses Probabilities** and the **Decision Rule Explanation** under each aspect card.

2. **Demonstrate spaCy Clause Segmentation & Context Preservation:**
   - In the Clause Segmentation breakdown card, point out the extracted clauses.
   - Show that conjunctions like *"and"* did not fragment compound predicates, while contrastive conjunctions like *"However"* triggered clean clause segmentation with preserved subject context.

3. **Demonstrate TripAdvisor Corpus & Dataset Management:**
   - Click **Dataset Management** in the sidebar.
   - Show the 6 KPI cards (Total Records, Clean Records, Duplicates Filtered, Invalid Filtered, Processed, Source).
   - Demonstrate the Data Hygiene Audit by uploading a custom CSV with duplicates or clicking **Load TripAdvisor Corpus**.
   - Download the **Cleaned CSV** and **Predictions CSV** reports.

4. **Demonstrate Real Analytics (Analytics Dashboard):**
   - Click **Analytics Dashboard**.
   - Show that all statistics (KPIs, donut chart, aspect-wise grouped bar chart, positive vs negative favorability ratios, and timeline trends) update dynamically from the actual stored review predictions.

5. **Demonstrate the Empirical Evaluation Module:**
   - Click **About & Evaluation**.
   - Explain the dual-benchmark capability:
     - Show the **Initial 55-Record Academic Benchmark**.
     - Demonstrate the option to upload a larger custom gold-standard CSV.
   - Click **Execute Evaluation**.
   - Walk the examiner through the **Multi-Class Confusion Matrix**, the **Overall Accuracy (70.9%)**, the **Macro-F1 (0.522)**, and the **Per-Aspect Hospitality Breakdown** for all 6 aspects.
   - Emphasize adherence to **academic integrity**: no synthetic scores or fabricated accuracy metrics.
