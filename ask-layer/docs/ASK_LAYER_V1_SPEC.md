# Ask-the-Data Layer — V1 Specification (Simplified)

**Status:** Spec + implementation
**Replaces:** Previous 15-intent draft
**Does not cover:** LLM routing, natural-language input, HTTP API, embeddings

---

## 1 — What it is

A deterministic **intent dispatcher**: caller passes an intent name and optional params, gets back a structured JSON envelope backed by a real MongoDB aggregation. No language model. No HTTP layer. One public function.

```python
result = ask("provider_perception", {"segment_industry_codes": [11]}, db)
```

---

## 2 — Architecture

```
ask(intent_id, params, db)
      │
      ├── look up intent in intents.json
      │     → template name, static template params, defaults, required params
      │
      ├── merge: intent defaults ← caller params ← static template params
      │
      ├── build pipeline
      │     query_templates.py → MongoDB aggregation pipeline (list of dicts)
      │
      ├── execute
      │     db[collection].aggregate(pipeline)
      │
      └── format envelope
            formatters.py → { intent, params, meta, data }
```

**Rules:**
- All templates return a plain Python `list` (aggregation pipeline). No special cases.
- The intent registry specifies which MongoDB collection each template queries.
- Segment filters are always placed before the first `$unwind` (efficiency).
- Every response includes `meta.n_respondents_in_base` so any claim is qualifiable.

---

## 3 — Intents (8)

| Intent | Business question | Template | Query source |
|--------|------------------|----------|-------------|
| `provider_perception` | How does a brand rate on each Q24 attribute vs the field average? | `attribute_unwind` (mode: gap_vs_field) | Q5-B |
| `provider_comparison` | Head-to-head Q24 attribute gap between two brands | `attribute_unwind` (mode: ratings) | Q3-C, Q5-C |
| `provider_momentum` | Which brands are buyers expecting to improve or decline? | `performance_trajectory` | Q1-C |
| `segment_profile` | How does a brand's purchase intent vary across a segment dimension? | `brand_segment_metric` | Q2-A, Q2-C, Q2-D |
| `segment_difference` | Where does a brand over/under-index vs the market across a segment? | `brand_segment_metric` (market_compare) | Q2-B, Q1-B |
| `unmet_needs` | What unmet needs are respondents expressing? (Q17 verbatims) | `verbatim_fetch` | Q4-A, Q4-D |
| `target_list` | Which respondent profiles show high intent for a brand? | `respondent_list` | Q1-A |
| `white_space` | Which attribute × brand slots have the highest skip rate? | `attribute_unwind` (mode: uncertainty) | Q5-D |

Stakeholder guidance lives in `intents.json` as metadata. It does not affect runtime behaviour.

---

## 4 — Query templates (5)

| Template | Used by | Description |
|----------|---------|-------------|
| `attribute_unwind` | `provider_perception`, `provider_comparison`, `white_space` | Double-unwind `brand_scores` + `attribute_ratings`. Three modes: `gap_vs_field`, `ratings`, `uncertainty` |
| `performance_trajectory` | `provider_momentum` | Unwind shown `brand_scores`; compute now vs 2yr-future rating delta per brand |
| `brand_segment_metric` | `segment_profile`, `segment_difference` | Unwind shown `brand_scores`; group by one profile dimension; optional market-average pivot |
| `verbatim_fetch` | `unmet_needs` | Aggregation on `verbatims` collection with segment + keyword filters |
| `respondent_list` | `target_list` | Match + project on `respondents`; returns anonymised profiles above an intent threshold |

### `attribute_unwind` modes

| Mode | What it computes | When to use |
|------|-----------------|-------------|
| `gap_vs_field` | focus brand avg vs all-brand field avg per attribute; gap column | `provider_perception` |
| `ratings` | Per-brand avg + pct_positive + pct_negative, optionally pivoted to two-brand gap | `provider_comparison` |
| `uncertainty` | Not-answered count + pct_not_answered per brand × attribute | `white_space` |

### `brand_segment_metric` flags

| Flag | Default | Effect |
|------|---------|--------|
| `market_compare` | false | If true, includes all brands then second-groups to Cognizant vs market avg + gap |
| `current_user_split` | false | If true, splits each segment row by `is_current_user` (S9 code = 1) |

### `segment_by` values for `brand_segment_metric`

`"industry"` · `"emp_count"` · `"seniority"` · `"maturity_band"` · `"decision_involvement"`

`maturity_band` is computed via `$switch` into Low (1–3) / Mid (4–6) / High (7–10) before the group stage.

---

## 5 — Input schema

```json
{
  "intent": "segment_profile",
  "params": {
    "focus_brand":              "Cognizant",
    "competitor_brand":         null,
    "segment_by":               "industry",
    "segment_industry_codes":   null,
    "segment_emp_codes":        null,
    "segment_seniority_codes":  null,
    "maturity_min":             null,
    "maturity_max":             null,
    "high_intent_threshold":    5,
    "keyword":                  null,
    "limit":                    50
  }
}
```

Not all params apply to every intent. Unused params are merged but ignored by the template.
Calling with `params=None` or `params={}` is always valid — intent defaults apply.

---

## 6 — Output envelope

```json
{
  "intent":  "segment_profile",
  "params":  { "focus_brand": "Cognizant", "segment_by": "industry", ... },
  "meta": {
    "generated_at":          "2026-03-26T19:00:00+00:00",
    "n_respondents_in_base": 600,
    "base_note":             "Shown base only. Only answered purchase_intent responses included.",
    "template":              "brand_segment_metric",
    "query_source":          "Q2-A, Q2-C, Q2-D",
    "scale_note":            "avg_intent_code: 1–6 (labels 0–5). High intent = code ≥ 5."
  },
  "data": [
    { "segment": "Financial Services", "n": 42, "avg_intent_code": 4.71, "pct_high_intent": 38.1 }
  ]
}
```

`meta.n_respondents_in_base` is the count of respondents matching the segment pre-filter, before any unwind or brand filter. This is the defensibility number for any downstream claim.

Compound `_id` fields from MongoDB group stages are flattened into the output row. Internal helper fields (prefixed `_`) are stripped.

---

## 7 — Errors

| Error class | When raised |
|-------------|-------------|
| `UnknownIntentError` | `intent_id` not in registry |
| `MissingRequiredParamError` | A required param is null or absent |

Empty results (`data: []`) are not errors — envelope is returned with `meta.warning: "no_results"`.

---

## 8 — File structure

```
ask-layer/
├── docs/
│   └── ASK_LAYER_V1_SPEC.md        ← this file
└── src/
    ├── __init__.py                  ← re-exports ask(), error classes
    ├── intents.json                 ← intent registry (8 entries)
    ├── query_templates.py           ← 5 template functions + build_segment_filter
    ├── ask.py                       ← ask(intent_id, params, db) → envelope
    └── formatters.py                ← build_envelope, _clean_doc
```

### Usage

```python
import sys
sys.path.insert(0, "ask-layer/src")

from pymongo import MongoClient
from ask import ask

db = MongoClient(MONGODB_URI)[MONGODB_DATABASE]

# Cognizant attribute gap vs field — all industries
result = ask("provider_perception", {}, db)

# Head-to-head vs Accenture in Financial Services
result = ask("provider_comparison", {
    "competitor_brand":           "Accenture",
    "segment_industry_codes":     [11]
}, db)

# Unmet needs from high-maturity FS respondents, keyword filter
result = ask("unmet_needs", {
    "segment_industry_codes": [11],
    "maturity_min":           7,
    "keyword":                "AI"
}, db)

# ABM target list: high intent, not current users, enterprise
result = ask("target_list", {
    "high_intent_threshold":  5,
    "segment_emp_codes":      [7, 8, 9]     # enterprise bands
}, db)
```

---

## 9 — Scale reference

| Field | Scale | High value |
|-------|-------|-----------|
| `purchase_intent.code` | 1–6 → labels "0 - No chance" … "5 - Almost certainly" | code ≥ 5 |
| `tsp_rating_now/future.code` | 1–7 → labels "–3 - Worst" … "3 - Best in class" | code ≥ 5 |
| `attribute_ratings[].value` | Direct integer –3..+3 | > 0 |
| `responses.ai_maturity.code` | 1–10 | ≥ 7 |
| S9 familiarity codes | 1=Using, 2=Past, 3=Considering, 4=Familiar, 5=Heard, 6=Never | — |

---

## 10 — What is explicitly out of scope for v1

- Natural-language / LLM intent routing
- NLP-enriched verbatim filtering (`analysis.themes`, `analysis.sentiment`) — fields exist; queries use `null` today
- HTTP API wrapper
- Response caching
- Report generation or narrative text

These are v2 additions. The `ask()` function signature and envelope format are designed to support all of them without structural change.
