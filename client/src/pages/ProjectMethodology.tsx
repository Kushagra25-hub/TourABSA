import React from 'react';
import {
  BookOpen,
  Layers,
  Split,
  Binary,
  Cpu,
  BarChart2,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  GitBranch,
  Terminal,
  FileCode,
  Network
} from 'lucide-react';

export const ProjectMethodology: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Publication Header */}
      <div className="panel-enterprise p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-4">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-mono font-semibold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            ACADEMIC RESEARCH MANUSCRIPT &bull; METHODOLOGICAL FORMULATION
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            DISCIPLINE: APPLIED NATURAL LANGUAGE PROCESSING &bull; ZERO-SHOT NLI
          </span>
        </div>

        <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
          Unpacking Tourist Experiences: A Syntactically Guided Zero-Shot ABSA Framework for Hospitality
        </h1>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-4xl font-sans">
          Formal mathematical, linguistic, and architectural formulations underpinning the proposed zero-shot aspect-based sentiment analysis platform. Formulates sentiment polarity resolution as natural language inference across 6 predefined hospitality aspects without supervised token annotations.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-200 text-xs font-mono">
          <div>
            <span className="text-slate-400 text-[10px] uppercase block">Primary Model:</span>
            <span className="font-bold text-slate-800">DeBERTa-v3-small NLI</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase block">Parser Engine:</span>
            <span className="font-bold text-slate-800">spaCy en_core_web_sm v3</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase block">Aspect Ontology:</span>
            <span className="font-bold text-slate-800">6 Closed Dimensions</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase block">Decision Threshold:</span>
            <span className="font-bold text-slate-800">&theta; &ge; 0.50, &Delta; &ge; 0.08</span>
          </div>
        </div>
      </div>

      {/* 1.0 Problem Formulation & Theoretical Motivation */}
      <section className="panel-enterprise">
        <div className="panel-header flex items-center justify-between">
          <span className="font-bold text-xs tracking-wider uppercase">
            1.0 Problem Formulation &amp; Theoretical Motivation
          </span>
          <span className="text-[10px] font-mono text-slate-400">SECTION 1</span>
        </div>

        <div className="p-6 space-y-4 text-xs font-sans text-slate-700 leading-relaxed">
          <p>
            Customer feedback in the hospitality sector is fundamentally multi-faceted. A traveler reviewing a hotel stay frequently expresses diametrically opposing sentiments across different service touchpoints within a single document or compound sentence. Traditional document-level sentiment classification assigns a scalar polarity label <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">y &isin; &#123;Positive, Negative, Neutral&#125;</code> to an entire review <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">R</code>:
          </p>

          <div className="p-4 bg-slate-50 border border-slate-300 rounded font-mono text-xs text-slate-800 space-y-2">
            <div className="text-slate-500 text-[10px] uppercase font-bold">[MONOLITHIC CLASSIFIER COLLAPSE DEMONSTRATION]:</div>
            <div>
              Review R: <span className="font-sans italic">"The room cleanliness was pristine and staff was remarkably helpful, but the breakfast was cold and the hotel was situated far from city transit."</span>
            </div>
            <div className="pt-2 border-t border-slate-200 text-slate-700">
              Output: <span className="font-bold text-emerald-700">f(R) &rarr; Positive (Score: 0.68)</span>
              <span className="text-rose-700 ml-3 font-bold">&larr; Severe Information Loss: Obscures critical Food &amp; Location deficiencies.</span>
            </div>
          </div>

          <p>
            Supervised aspect-based sentiment analysis models mitigate this, but require tens of thousands of manually annotated domain tokens (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">[B-ASP], [I-ASP]</code>). This creates prohibitive annotation costs and poor cross-domain generalizability. We circumvent supervised labeling by reformulating hospitality ABSA as a <strong>Zero-Shot Natural Language Inference (NLI)</strong> task operating on syntactically segmented premises.
          </p>
        </div>
      </section>

      {/* 2.0 Syntactic Clause Segmentation Architecture */}
      <section className="panel-enterprise">
        <div className="panel-header flex items-center justify-between">
          <span className="font-bold text-xs tracking-wider uppercase">
            2.0 Syntactic Clause Decomposition Architecture
          </span>
          <span className="text-[10px] font-mono text-slate-400">SECTION 2</span>
        </div>

        <div className="p-6 space-y-4 text-xs font-sans text-slate-700 leading-relaxed">
          <p>
            Evaluating compound reviews directly through zero-shot NLI introduces premise cross-talk: conflicting sentiments within different clauses contaminate the cross-encoder's cross-attention matrix. To isolate distinct opinions, our pipeline executes a deterministic clause segmentation layer prior to hypothesis evaluation:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-2">
              <span className="font-mono font-bold text-xs text-slate-900 uppercase block">
                Adversative Discourse Split Markers:
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Decomposes sentences on coordinating and subordinating contrast markers:
                <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 mx-1">but</code>,
                <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 mx-1">however</code>,
                <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 mx-1">although</code>,
                <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 mx-1">though</code>,
                <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 mx-1">whereas</code>,
                <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 mx-1">yet</code>, and semicolons.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-2">
              <span className="font-mono font-bold text-xs text-slate-900 uppercase block">
                Syntactic Parent Context Retention:
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Sub-clauses preserve subject bindings and negation scopes from parent sentences so zero-shot hypotheses evaluate isolated clauses without losing anaphoric context or entity references.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3.0 Predefined Aspects & Hypothesis Formulation */}
      <section className="panel-enterprise">
        <div className="panel-header flex items-center justify-between">
          <span className="font-bold text-xs tracking-wider uppercase">
            3.0 Six-Aspect Ontology &amp; Zero-Shot Hypotheses Formulation
          </span>
          <span className="text-[10px] font-mono text-slate-400">SECTION 3</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-mono font-bold text-[10px] uppercase">
              <tr>
                <th className="px-4 py-3 w-32">Aspect Dimension (a)</th>
                <th className="px-4 py-3">Lexical Seed Priors</th>
                <th className="px-4 py-3">Zero-Shot Aspect Hypothesis (H<sub>a</sub>)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans">
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-slate-900">CLEANLINESS</td>
                <td className="px-4 py-3 text-slate-600">Room hygiene, bathroom sanitation, linen freshness, housekeeping, dusting</td>
                <td className="px-4 py-3 font-mono text-blue-700 text-[11px]">"This text discusses room cleanliness, hygiene, or maintenance."</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-slate-900">STAFF</td>
                <td className="px-4 py-3 text-slate-600">Front desk service, friendliness, professionalism, responsiveness, concierge</td>
                <td className="px-4 py-3 font-mono text-blue-700 text-[11px]">"This text discusses hotel staff behavior, service, or attitude."</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-slate-900">FOOD</td>
                <td className="px-4 py-3 text-slate-600">Breakfast buffet, restaurant quality, culinary freshness, dining taste</td>
                <td className="px-4 py-3 font-mono text-blue-700 text-[11px]">"This text discusses food quality, taste, or restaurant dining."</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-slate-900">VALUE</td>
                <td className="px-4 py-3 text-slate-600">Pricing, affordability, hidden surcharges, value-for-money perception</td>
                <td className="px-4 py-3 font-mono text-blue-700 text-[11px]">"This text discusses price, affordability, or value for money."</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-slate-900">AMENITIES</td>
                <td className="px-4 py-3 text-slate-600">Wi-Fi connectivity, pool, gym, elevators, air conditioning, parking</td>
                <td className="px-4 py-3 font-mono text-blue-700 text-[11px]">"This text discusses hotel amenities, Wi-Fi, or facilities."</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-slate-900">LOCATION</td>
                <td className="px-4 py-3 text-slate-600">Proximity to transit, attractions, central accessibility, walkability</td>
                <td className="px-4 py-3 font-mono text-blue-700 text-[11px]">"This text discusses the hotel location, transit, or accessibility."</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4.0 NLI-to-Sentiment Mapping Formulation */}
      <section className="panel-enterprise">
        <div className="panel-header flex items-center justify-between">
          <span className="font-bold text-xs tracking-wider uppercase">
            4.0 Formal NLI Inference &amp; Sentiment Polarity Mapping Operator
          </span>
          <span className="text-[10px] font-mono text-slate-400">SECTION 4</span>
        </div>

        <div className="p-6 space-y-4 text-xs font-sans text-slate-700 leading-relaxed">
          <p>
            Natural Language Inference cross-encoders output categorical probabilities over three states: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">&#123;Entailment, Contradiction, Neutral&#125;</code>. In ABSA literature, equating NLI entailment directly to positive sentiment is a known category error. We formalize an explicit multi-hypothesis projection operator <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">&Mu;</code>:
          </p>

          <div className="p-4 bg-slate-900 text-slate-200 rounded font-mono text-xs space-y-3">
            <div className="text-blue-400 font-bold uppercase tracking-wider text-[11px]">
              [HYPOTHESIS PAIR DEFINITION FOR ASPECT a]:
            </div>
            <div className="text-slate-300 pl-2">
              H<sub>pos</sub>(a) = "The customer is satisfied and pleased with the aspect."<br />
              H<sub>neg</sub>(a) = "The customer is dissatisfied or unhappy with the aspect."
            </div>
            <div className="pt-2 border-t border-slate-700 text-slate-300 space-y-1">
              <div className="text-emerald-400 font-bold">
                IF P(Entailment | H<sub>pos</sub>) &gt; P(Entailment | H<sub>neg</sub>) AND P(Entailment | H<sub>pos</sub>) &ge; &theta; AND &Delta; &ge; 0.08:
              </div>
              <div className="pl-6">&rarr; Sentiment(a) = POSITIVE</div>
              <div className="text-rose-400 font-bold pt-1">
                ELSE IF P(Entailment | H<sub>neg</sub>) &gt; P(Entailment | H<sub>pos</sub>) AND P(Entailment | H<sub>neg</sub>) &ge; &theta; AND &Delta; &ge; 0.08:
              </div>
              <div className="pl-6">&rarr; Sentiment(a) = NEGATIVE</div>
              <div className="text-amber-400 font-bold pt-1">
                ELSE:
              </div>
              <div className="pl-6">&rarr; Sentiment(a) = NEUTRAL / ABSTAIN</div>
            </div>
          </div>

          <p className="text-slate-600 text-xs">
            The margin constraint <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">&Delta; = |P(E|H<sub>pos</sub>) - P(E|H<sub>neg</sub>)| &ge; 0.08</code> prevents high-entropy ambiguous predictions from erroneously forcing polarity.
          </p>
        </div>
      </section>

      {/* 5.0 Three-Tier System Architecture */}
      <section className="panel-enterprise">
        <div className="panel-header flex items-center justify-between">
          <span className="font-bold text-xs tracking-wider uppercase">
            5.0 Three-Tier Enterprise Microservices Architecture
          </span>
          <span className="text-[10px] font-mono text-slate-400">SECTION 5</span>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-5 bg-slate-950 text-slate-200 rounded text-xs font-mono space-y-2 leading-relaxed border border-slate-800">
            <div className="flex items-center gap-2 text-blue-400 font-bold">
              <span className="w-2 h-2 rounded-xs bg-blue-400" />
              [CLIENT TIER] React 19 + TypeScript + Tailwind CSS (Port 5173 / Production Build)
            </div>
            <p className="text-slate-400 pl-4">&bull; Interactive High-Density Dashboard &amp; Recharts Benchmarking</p>
            <p className="text-slate-400 pl-4">&bull; Syntactic Clause Breakdown Tree &amp; Evidence Span Inspector</p>
            <p className="text-slate-400 pl-4">&bull; Multi-Property Aspect Matrix &amp; Bulk CSV Ingestion Workstation</p>
            
            <div className="text-slate-600 pl-8 py-1">&darr; HTTP REST APIs (JSON / Multipart Form-Data)</div>

            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-xs bg-emerald-400" />
              [APPLICATION TIER] Node.js + Express.js Engine (Port 5000)
            </div>
            <p className="text-slate-400 pl-4">&bull; API Gateway, Request Validation &amp; Error Boundary Handling</p>
            <p className="text-slate-400 pl-4">&bull; Persistent JSON / SQLite Data Layer with SHA-256 Deduplication</p>
            <p className="text-slate-400 pl-4">&bull; Cross-Property Aspect Aggregation &amp; Evaluation Metrics Engine</p>

            <div className="text-slate-600 pl-8 py-1">&darr; Internal Loopback Microservice RPC (Port 8000)</div>

            <div className="flex items-center gap-2 text-purple-400 font-bold">
              <span className="w-2 h-2 rounded-xs bg-purple-400" />
              [NLP INFERENCE TIER] Python 3.11 + FastAPI + Uvicorn (Port 8000)
            </div>
            <p className="text-slate-400 pl-4">&bull; spaCy en_core_web_sm Dependency Parser (Clause Segmentation)</p>
            <p className="text-slate-400 pl-4">&bull; Hugging Face DeBERTa-v3 Cross-Encoder Pipeline (Inference)</p>
            <p className="text-slate-400 pl-4">&bull; Strict Multi-Class Benchmarking Suite (Accuracy, Macro-F1, Confusion Matrix)</p>
          </div>
        </div>
      </section>
    </div>
  );
};
