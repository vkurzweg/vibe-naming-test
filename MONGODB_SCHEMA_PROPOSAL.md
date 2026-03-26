# MongoDB Schema Proposal — Cognizant Survey Intelligence

**Schema date:** 2026-03-25
**Based on:** DATASET_AUDIT.md
**Respondent count:** 600
**Source of truth:** `Cognizant_Raw_Data.xlsx → A1`
**Canonical respondent ID:** `uuid`

---

## Contents

1. [Recommended Collections](#1-recommended-collections)
2. [Collection: `respondents`](#2-collection-respondents)
3. [Collection: `codebook`](#3-collection-codebook)
4. [Collection: `verbatims`](#4-collection-verbatims)
5. [Collection: `import_batches`](#5-collection-import_batches)
6. [Collection: `crosstab_cache`](#6-collection-crosstab_cache-low-priority)
7. [Field-Type Handling Rules](#7-field-type-handling-rules)
8. [Provenance Strategy](#8-provenance-strategy)
9. [Recommended Indexes](#9-recommended-indexes)
10. [Risk Mitigations](#10-risk-mitigations)
11. [MVP Schema](#11-mvp-schema)
12. [Extensible Schema](#12-extensible-schema)
13. [Recommendation](#13-recommendation)

---

## 1. Recommended Collections

| Collection | Priority | Source | One doc = | Primary use |
|-----------|----------|--------|-----------|-------------|
| `respondents` | **MVP** | `A1` | One respondent | Core analysis, segmentation, brand scores |
| `codebook` | **MVP** | `Datamap` | One variable | Label decoding, question metadata |
| `verbatims` | **MVP** | `A1` OE fields | One response to one OE question | Retrieval, discourse analysis, claims |
| `import_batches` | **MVP** | Internal | One import run | Provenance, reproducibility |
| `crosstab_cache` | Later | Crosstabs workbook | One question × one segment | Pre-computed display tables |

**What is not imported:**
- Crosstabs OE sheets (`S8_Unaided_Awareness`, `Q17_Unment_Needs`) — they duplicate `A1` without respondent IDs (R4)
- `hQ1`, `EmpSizeCheck` — internal survey platform validation flags
- `source`, `decLang` — empty in this dataset

---

## 2. Collection: `respondents`

One document per survey respondent. The 813-column flat row from `A1` is restructured
into seven logical sub-documents.

### Top-level document structure

```json
{
  "_id":            "5wyz442eaecekd4s",
  "record":         7,
  "schema_version": "1.0",

  "profile":        { ... },
  "brand_awareness":{ ... },
  "responses":      { ... },
  "brand_scores":   [ ... ],
  "verbatims":      { ... },
  "_meta":          { ... },
  "_provenance":    { ... }
}
```

---

### 2a. `profile` — Respondent / firmographic fields

Decoded coded scalars. Always store both `code` (integer) and `label` (string).

**Why both?** Codes are needed for aggregation math; labels are needed for display and
LLM-facing prompts. Dropping either creates permanent data loss.

```json
"profile": {
  "hq_location": {
    "code": 2,
    "label": "Headquartered in the U.S. with international operations",
    "question_code": "S1_HQ"
  },
  "emp_count": {
    "code": 8,
    "label": "10,000+",
    "question_code": "S2_EmpCount"
  },
  "revenue": {
    "code": 11,
    "label": "$1 billion – $9.99 billion",
    "question_code": "S3_Revenue"
  },
  "industry": {
    "code": 11,
    "label": "Financial Services",
    "question_code": "S4_Industry",
    "other_specify": null
  },
  "seniority": {
    "code": 3,
    "label": "Director or equivalent (managers report to me)",
    "question_code": "S5_Seniority"
  },
  "functions": ["Information Technology (IT)", "AI, Machine Learning & Data Science"],
  "functions_question_code": "S6_Function",
  "functions_other_specify": null,
  "works_with_tech_provider": {
    "code": 1,
    "label": "Yes",
    "question_code": "S7"
  },
  "decision_involvement": {
    "code": 1,
    "label": "Final decision maker",
    "question_code": "S10_DecisionInvolvement"
  },
  "ai_adoption_approach": {
    "code": 3,
    "label": "Balanced level of in-house and external service providers",
    "question_code": "S11"
  },
  "tsp_engagement_plan": {
    "code": 1,
    "label": "Currently working with at least one provider",
    "question_code": "S12"
  },
  "job_title": "Sr Director IT Product Management"
}
```

**Notes:**
- `functions` and all multi-select profile fields → array of decoded labels only (see §7)
- `job_title` comes from `Q51` (free text); stored here rather than in `verbatims` because it is demographic, not a survey opinion
- `industry.other_specify` handles `S4_Industryr28oe` (currently empty, preserved for future data)

---

### 2b. `brand_awareness` — Unaided recall + aided familiarity

```json
"brand_awareness": {

  "unaided_mentions": ["Microsoft", "AWS", "IBM"],
  "unaided_mentions_raw": ["microsoft", "ibm", "Aws"],
  "unaided_cant_think_of_any": false,
  "unaided_question_code": "S8_Unaided",

  "aided_familiarity": [
    {
      "brand":         "Cognizant",
      "brand_idx":     1,
      "code":          1,
      "label":         "Currently using",
      "question_code": "S9_Aided"
    },
    {
      "brand":         "Accenture",
      "brand_idx":     2,
      "code":          3,
      "label":         "Currently considering using",
      "question_code": "S9_Aided"
    }
    // ... all 17 brands
  ],

  "familiar_brands":  ["Cognizant", "Accenture", "IBM Consulting"],
  "current_brands":   ["Cognizant"],
  "shown_brands":     ["Cognizant", "Accenture", "IBM Consulting", "Infosys"]
}
```

**Notes on `unaided_mentions`:**
- `unaided_mentions_raw` preserves the exact user-typed strings (dirty; R5)
- `unaided_mentions` is a normalised version — left empty at import, populated by a
  separate normalisation/fuzzy-match pass (R5 mitigation)
- `familiar_brands`, `current_brands`, `shown_brands` decoded from `familiarBrandsr*`,
  `currentBrandsr*`, `pipedBrandsr*` — stored as brand-name arrays for easy querying
- `shown_brands` (from `pipedBrands`) is critical for correct analysis denominators (R6)

---

### 2c. `brand_scores` — All per-brand numeric data

**Key design decision: array of brand objects, not a keyed object.**

A keyed object (`brand_scores.Cognizant.Q1`) is intuitive but makes cross-brand
aggregation in MongoDB's aggregation pipeline awkward. An array allows `$unwind → $match
{ "brand_scores.brand": "Cognizant" } → $group` in a single pipeline.

```json
"brand_scores": [
  {
    "brand":     "Cognizant",
    "brand_idx": 1,
    "shown":     true,

    "tsp_rating_now": {
      "code": 6, "label": "2", "question_code": "Q1_TSP_Now"
    },
    "tsp_rating_2yrs_ago": {
      "code": 5, "label": "1", "question_code": "Q2_TSP_2yrsAgo"
    },
    "tsp_rating_2yrs_future": {
      "code": 7, "label": "3- Best in class", "question_code": "Q3_TSP_2yrsfromnow"
    },

    "rank_2yrs_ago":    4,
    "rank_2yrs_future": 6,
    "rank_q_codes":     ["Q25_Rank2yrsAgo", "Q26_Rank2yrsfromNow"],

    "purchase_intent": {
      "code": 3, "label": "...", "question_code": "Q27_PurchaseIntent"
    },

    "attribute_ratings": [
      {
        "attribute":      "Industry domain expertise",
        "attribute_idx":  1,
        "code":           2,
        "value":          2,
        "sentinel":       false,
        "question_code":  "Q24_BrandAttributeRatings_Lr1"
      },
      {
        "attribute":      "Innovation leadership",
        "attribute_idx":  2,
        "code":           1,
        "value":          1,
        "sentinel":       false,
        "question_code":  "Q24_BrandAttributeRatings_Lr2"
      }
      // ... up to 12 attributes; only populated if shown=true and respondent rated
    ],

    "perception_selected": true,
    "perception_q_code":   "Q23_Perception",
    "confidence_selected": false,
    "confidence_q_code":   "Q21_TSPConfidence"
  }
  // ... 15 more brand objects (all 16 brands always present; shown=false if not piped)
]
```

**Notes:**
- All 16 brands are always present in the array (even if `shown: false`) — this
  guarantees consistent array length and avoids missing-key bugs in queries
- `shown: false` entries have `null` for all score fields
- `sentinel: true` on an `attribute_rating` means the raw value was `-1` (R2 risk);
  these are stored but flagged, not coerced to the scale
- `rank_2yrs_ago` and `rank_2yrs_future` are stored as raw integers 1–6 or `null`
  (sparse by design; see §7 on ranking questions)

---

### 2d. `responses` — All other question responses

Everything that is not profile, brand awareness, or brand scores. Grouped by question
type for clarity.

```json
"responses": {

  "ai_maturity_self_rating": {
    "code": 7, "label": "7", "question_code": "Q4"
  },

  "ai_use_by_area": [
    {
      "area":          "Customer service & support",
      "area_idx":      1,
      "code":          1,
      "label":         "Currently using AI",
      "question_code": "Q5"
    },
    {
      "area":          "Sales & business development",
      "area_idx":      2,
      "code":          2,
      "label":         "Planning/in the process of using AI",
      "question_code": "Q5"
    }
    // ... 13 rows
  ],

  "ai_priority_importance": [
    {
      "priority":      "Increasing productivity",
      "priority_idx":  1,
      "code":          6,
      "label":         "6",
      "question_code": "Q6_Area_AIUse"
    }
    // ... 3 rows
  ],

  "ai_priority_direction": [
    {
      "priority":      "Increasing productivity",
      "priority_idx":  1,
      "code":          4,
      "label":         "Increase somewhat",
      "question_code": "Q7"
    }
    // ... 3 rows
  ],

  "ai_adoption_position": {
    "code": 2, "label": "Ahead of average", "question_code": "Q8"
  },

  "ai_initiative_success": {
    "code": 2, "label": "Moderately successful - Meeting most expectations",
    "question_code": "Q9"
  },

  "tsp_services_matrix": {
    "rows": ["row_label_1", "row_label_2"],
    "cols": ["col_label_1", "col_label_2", "col_label_3", "col_label_4",
             "col_label_5", "col_label_6", "col_label_7"],
    "cells": [
      { "row_idx": 1, "col_idx": 1, "selected": true },
      { "row_idx": 1, "col_idx": 3, "selected": true }
    ],
    "question_code": "Q20"
  },

  "tsp_preferred_brand": {
    "code": 1, "label": "Cognizant", "question_code": "Q28"
  },

  "geographic_preference": {
    "code": 3, "label": "...", "question_code": "Q35"
  },

  "pricing_preference": {
    "code": 2, "label": "...", "question_code": "Q36_Pricing",
    "other_specify": null
  },

  "sources_of_info": ["Analyst reports", "Peer recommendations"],
  "sources_of_info_q_code": "Q37_SourcesofInfo",
  "sources_of_info_other_specify": null,

  "tsp_attributes_valued":    ["Industry expertise", "AI capabilities"],
  "tsp_challenges":           ["Cost", "Integration complexity"],
  "tsp_dissuaders":           ["Lack of transparency"],
  "tsp_confidence_brands":    ["Cognizant", "Microsoft (Azure & Copilot)"],
  "tsp_perception_brands":    ["Accenture", "IBM Consulting"],

  "ai_spend_current":  1500000.0,
  "ai_spend_q_code":   "Q40",
  "ai_budget_planned": 50000,
  "ai_budget_q_code":  "Q47",

  "positioning_pref_q31": ["option_a", "option_c"],
  "positioning_pref_q32": ["option_b"],
  "positioning_pref_q33": ["option_a", "option_d"],
  "positioning_pref_q34": ["option_e"],

  "q10":  { "code": 2, "label": "...", "question_code": "Q10" },
  "q38":  { "code": 1, "label": "...", "question_code": "Q38" },
  "q39":  { "code": 3, "label": "...", "question_code": "Q39" },
  "q41":  { "code": 4, "label": "...", "question_code": "Q41" },
  "q43":  { "code": 2, "label": "...", "question_code": "Q43" },
  "q44":  { "code": 1, "label": "...", "question_code": "Q44" },
  "q45":  { "code": 5, "label": "...", "question_code": "Q45" },
  "q48":  { "code": 3, "label": "...", "question_code": "Q48" },
  "q49":  { "code": 2, "label": "...", "question_code": "Q49" },
  "q50":  { "code": 4, "label": "...", "question_code": "Q50" },
  "q52":  { "code": 1, "label": "...", "question_code": "Q52" }
}
```

**Notes on Q20 (`tsp_services_matrix`):**
- The `cells` array stores only `selected: true` cells (sparse); absent = `selected: false`
- Row and column labels are resolved from the codebook at import time
- The full label arrays are stored on the document so queries don't require a join to codebook

**Notes on multi-selects in `responses`:**
- Stored as arrays of decoded labels (strings), not arrays of `{code, label}` objects
- Rationale: multi-select items are binary (in or out); the code adds no analytical value
  beyond the label; arrays of strings are faster to query with `$in` / `$elemMatch`
- The question code is stored as a sibling field (`*_q_code`) for provenance

---

### 2e. `verbatims` — Open-text fields embedded in respondent doc

**Note:** Short verbatims (other-specify) live here. Long-form verbatims (Q17) are
*also* written to the separate `verbatims` collection for retrieval/embedding purposes.

```json
"verbatims": {
  "unmet_needs": {
    "text":          "We are yet to realize the full potential of AI",
    "question_code": "Q17_UnmetNeeds",
    "char_count":    47,
    "is_null":       false
  },
  "unaided_brand_mentions_raw": {
    "slot_1": "microsoft",
    "slot_2": "ibm",
    "slot_3": null,
    "slot_4": null,
    "slot_5": null,
    "question_code": "S8_Unaided"
  },
  "other_specify": {
    "S6_Function":    null,
    "Q36_Pricing":    null,
    "Q50":            null
  }
}
```

---

### 2f. `_meta` — Paradata

```json
"_meta": {
  "completion_time_sec": 2995.634,
  "start_date":          "2025-10-31T18:02:00",
  "panel_list":          6,
  "dropout_flag":        0,
  "os":                  "Windows 10",
  "browser":             "Chrome 130",
  "mobile_device":       null,
  "mobile_os":           null,
  "quota_markers":       "qualified,/Industry Quota/MCKKK,/Revenue Quota/GnJIC",
  "respondent_status":   { "code": 3, "label": "Qualified" }
}
```

---

### 2g. `_provenance` — Import provenance

```json
"_provenance": {
  "source_file":      "Cognizant_Raw_Data.xlsx",
  "sheet":            "A1",
  "import_batch_id":  "ObjectId(…)",
  "imported_at":      "2026-03-25T00:00:00Z",
  "schema_version":   "1.0"
}
```

---

## 3. Collection: `codebook`

One document per variable. Parsed from `Datamap`. This is a prerequisite for the ETL
pipeline — it must be built and inserted before respondents are imported.

### Codebook document structure

```json
{
  "_id": "S1_HQ",

  "variable_code":   "S1_HQ",
  "question_text":   "Which of the following best describes your organization's presence in the United States?",
  "question_type":   "single_coded",
  "scale_min":       1,
  "scale_max":       5,

  "answer_codes": {
    "1": "Headquartered in the U.S. with operations only in the U.S.",
    "2": "Headquartered in the U.S. with international operations",
    "3": "Headquartered outside the U.S., with international operations including in the U.S.",
    "4": "No headquarters or operations in the U.S.",
    "5": "I'm not sure"
  },

  "sub_items": null,

  "_provenance": {
    "source_file": "Cognizant_Raw_Data.xlsx",
    "sheet":       "Datamap",
    "original_column": "col[0]",
    "import_batch_id": "ObjectId(…)"
  }
}
```

**For a grid question (e.g. Q1_TSP_Now):**

```json
{
  "_id": "Q1_TSP_Now",

  "variable_code":   "Q1_TSP_Now",
  "question_text":   "How would you rate these Technology Services Providers based on their capabilities today?",
  "question_type":   "brand_rating_grid",
  "scale_min":       1,
  "scale_max":       7,

  "answer_codes": {
    "1": "-3- Worst in class",
    "2": "-2",
    "3": "-1",
    "4": "0",
    "5": "1",
    "6": "2",
    "7": "3- Best in class"
  },

  "sub_items": [
    { "idx": 1,  "column_code": "Q1_TSP_Nowr1",  "label": "Cognizant" },
    { "idx": 2,  "column_code": "Q1_TSP_Nowr2",  "label": "Accenture" },
    { "idx": 3,  "column_code": "Q1_TSP_Nowr3",  "label": "IBM Consulting" },
    { "idx": 16, "column_code": "Q1_TSP_Nowr16", "label": "Amazon Web Services (AWS)" }
  ],

  "_provenance": { ... }
}
```

**For a multi-select question (e.g. S6_Function):**

```json
{
  "_id": "S6_Function",

  "variable_code":  "S6_Function",
  "question_text":  "Which of the following describe the functions of your team within the organization?",
  "question_type":  "multi_select",
  "scale_min":      0,
  "scale_max":      1,

  "answer_codes": {
    "0": "Unchecked",
    "1": "Checked"
  },

  "sub_items": [
    { "idx": 1,  "column_code": "S6_Functionr1",  "label": "Executive or Senior Leadership" },
    { "idx": 2,  "column_code": "S6_Functionr2",  "label": "Information Technology (IT)" },
    { "idx": 22, "column_code": "S6_Functionr22", "label": "Other (please specify)" }
  ],

  "_provenance": { ... }
}
```

**Question type vocabulary (for `question_type` field):**

| Value | Description |
|-------|-------------|
| `single_coded` | Single-response coded scale |
| `multi_select` | Binary 0/1 per option |
| `brand_rating_grid` | One coded value per brand row |
| `brand_attribute_grid` | Q24 nested brand × attribute |
| `rank_per_brand` | Integer rank assigned per brand |
| `two_dim_grid` | Q20 row × column binary matrix |
| `open_text` | Free text, no coding |
| `open_numeric` | Continuous numeric (Q40, Q47) |

---

## 4. Collection: `verbatims`

One document per open-ended response. Long-form OE questions only (Q17, S8 unaided
mentions). Other-specify fields stay embedded in `respondents`.

**Why a separate collection?**
- Enables vector embedding without bloating `respondents` documents
- Allows tagging, thematic coding, and claim attribution independent of the full profile
- Required for discourse intelligence and claims/proof generation workflows

```json
{
  "_id": "ObjectId(…)",

  "respondent_uuid":  "5wyz442eaecekd4s",
  "respondent_record": 7,

  "question_code":    "Q17_UnmetNeeds",
  "question_text":    "What are the main gaps or unmet needs your organization has experienced with Technology Services Providers for your AI initiatives?",
  "question_label":   "Unmet needs in AI services",

  "text":             "We are yet to realize the full potential of AI",
  "char_count":       47,
  "word_count":       11,
  "is_empty":         false,

  "respondent_snapshot": {
    "industry":           { "code": 11, "label": "Financial Services" },
    "emp_count":          { "code": 8,  "label": "10,000+" },
    "revenue":            { "code": 11, "label": "$1 billion – $9.99 billion" },
    "seniority":          { "code": 3,  "label": "Director or equivalent" },
    "decision_involvement": { "code": 1, "label": "Final decision maker" },
    "current_brands":     ["Cognizant"],
    "ai_maturity_code":   7
  },

  "analysis": {
    "embedding_model":  null,
    "embedding":        null,
    "themes":           [],
    "sentiment":        null,
    "flagged":          false,
    "notes":            null
  },

  "_provenance": {
    "source_file":      "Cognizant_Raw_Data.xlsx",
    "sheet":            "A1",
    "original_column":  "Q17_UnmetNeeds",
    "import_batch_id":  "ObjectId(…)",
    "imported_at":      "2026-03-25T00:00:00Z"
  }
}
```

**Unaided brand mention verbatim (one doc per slot with text):**

```json
{
  "_id": "ObjectId(…)",

  "respondent_uuid":  "5wyz442eaecekd4s",
  "question_code":    "S8_Unaided",
  "question_label":   "Unaided brand awareness",
  "slot":             1,

  "text":             "microsoft",
  "text_normalised":  "Microsoft",
  "is_empty":         false,

  "respondent_snapshot": { ... },

  "analysis": {
    "resolved_brand":  null,
    "resolution_method": null,
    "embedding":       null,
    "flagged":         false
  },

  "_provenance": {
    "source_file":     "Cognizant_Raw_Data.xlsx",
    "sheet":           "A1",
    "original_column": "S8_Unaidedr1oe",
    "import_batch_id": "ObjectId(…)"
  }
}
```

**Notes:**
- `respondent_snapshot` is intentionally denormalised — it contains the most common
  segment fields so verbatim queries never need a join back to `respondents`
- `analysis` fields start null; populated by downstream agent workflows
- For Q17, create one doc per respondent who answered (up to 561 docs)
- For S8 unaided, create one doc per non-null slot (up to 1,230 docs across 5 slots)

---

## 5. Collection: `import_batches`

Lightweight audit log for every import run.

```json
{
  "_id": "ObjectId(…)",

  "batch_label":      "initial-load-2026-03-25",
  "started_at":       "2026-03-25T00:00:00Z",
  "completed_at":     "2026-03-25T00:05:12Z",
  "status":           "completed",

  "source_files": [
    {
      "filename":   "Cognizant_Raw_Data.xlsx",
      "sheet":      "A1",
      "row_count":  600,
      "md5":        "abc123..."
    },
    {
      "filename":   "Cognizant_Raw_Data.xlsx",
      "sheet":      "Datamap",
      "row_count":  1768,
      "md5":        "def456..."
    }
  ],

  "counts": {
    "respondents_inserted":  600,
    "codebook_inserted":     113,
    "verbatims_inserted":    1792,
    "errors":                0
  },

  "schema_version": "1.0",
  "script_version": "0.1.0",
  "notes":          ""
}
```

---

## 6. Collection: `crosstab_cache` (Low Priority)

Pre-computed aggregation results for quick retrieval, avoiding re-aggregation on every
dashboard request. Defer until the `respondents` aggregation pipeline is validated.

```json
{
  "_id": "ObjectId(…)",

  "question_code":   "S1_HQ",
  "segment":         "Total",
  "segment_n":       600,
  "table_type":      "percentage",

  "rows": [
    {
      "label":       "Headquartered in the U.S. with operations only in the U.S.",
      "code":        1,
      "pct":         0.4317,
      "n":           259
    }
  ],

  "computed_at":     "2026-03-25T00:05:00Z",
  "source_sheet":    "S1_HQ",
  "source_file":     "Cognizant_Crosstabs_AllQuestionsWithOpenEnds.xlsx",
  "import_batch_id": "ObjectId(…)"
}
```

---

## 7. Field-Type Handling Rules

### 7.1 Respondent profile fields (single-coded scalars)

Store as `{ "code": <int>, "label": <string> }`. Always decode at import using codebook.
Never drop the code. Example: `"S1_HQ"` → `"hq_location": { "code": 2, "label": "…" }`.

### 7.2 Single-coded scalar questions (Q4, Q8, Q9, Q10, Q28, Q35, Q38–Q45, Q48–Q52)

Same pattern as profile fields. Grouped under `responses` with snake_case keys where
the question has a meaningful name; keyed by `q{n}` for unmapped questions.

**Q52 float64 cast:** Cast to `int` before storing (R8 mitigation).

### 7.3 Multi-select questions

Store as **array of decoded label strings** (not `{code, label}` objects):

```json
"functions": ["Information Technology (IT)", "AI, Machine Learning & Data Science"]
```

Rationale: The binary code (0/1) for each option is meaningless once decoded. Arrays of
strings support `$in` / `$elemMatch` queries natively. The question code is stored as a
sibling field.

**`noanswer` flags** (R7 mitigation): Treat as an additional option in the array.
If `noanswerQ29_r8 = 1`, add `"None of the above"` to the `Q29` array.

### 7.4 Brand rating grids (Q1, Q2, Q3)

Store inside `brand_scores[n]` as `{ "code": <int>, "label": <str>, "question_code": <str> }`.
A `null` value means either not shown (`shown: false`) or shown but not answered.

**Shown vs. not-answered distinction** (R6 mitigation):
- If `pipedBrands{n} = 0` → `shown: false`, all score fields `null`
- If `pipedBrands{n} = 1` and rating is `NaN` → `shown: true`, score field `null`
  (true non-response; excluded from means but counted in denominators)

### 7.5 Q20 two-dimensional grid

Stored as a sparse cells array under `responses.tsp_services_matrix`:

```json
"cells": [
  { "row_idx": 1, "col_idx": 1, "selected": true },
  { "row_idx": 1, "col_idx": 3, "selected": true }
]
```

Only `selected: true` cells are written (absent = false). Row and column labels are
resolved at import from the codebook and stored in `rows` / `cols` arrays on the same
object so the document is self-describing.

### 7.6 Q24 nested brand × attribute ratings

Stored as `brand_scores[n].attribute_ratings` — an array of attribute objects per brand.
This avoids a 12-level deep nested key structure.

**Sentinel value `-1`** (R2 mitigation): Do not coerce to the `-3…+3` scale. Store with
`"sentinel": true` and `"value": null`. This preserves the raw signal while clearly
flagging it as unresolvable without further clarification from the data owner.

```json
{
  "attribute":     "Industry domain expertise",
  "attribute_idx": 1,
  "code":          -1,
  "value":         null,
  "sentinel":      true,
  "question_code": "Q24_BrandAttributeRatings_Lr1"
}
```

### 7.7 Q25/Q26 ranking questions

Stored as `brand_scores[n].rank_2yrs_ago` and `brand_scores[n].rank_2yrs_future`.
Values are integers 1–6 or `null`. No label decoding needed (ranks are self-labelling).

### 7.8 Continuous numeric fields (Q40, Q47)

Stored as raw numbers, not decoded:

```json
"ai_spend_current":  1500000.0,
"ai_budget_planned": 50000
```

No `{ code, label }` wrapper. The codebook entry for these will have `question_type:
"open_numeric"` and no `answer_codes`. (R3 mitigation).

### 7.9 Verbatims and other-specify text

| Field type | Storage |
|-----------|---------|
| Long-form OE (Q17, S8 slots) | Both `respondents.verbatims` (embedded) AND `verbatims` collection |
| Short other-specify (Q36oe, Q50oe) | `respondents.verbatims.other_specify` only |
| Job title (Q51) | `respondents.profile.job_title` only |

**S8 unaided mentions** (R5 mitigation): Always preserve `_raw` strings. Add a
`_normalised` field (initially null) for the cleaned version, and `_resolved_brand` for
the post-hoc fuzzy-match result. These fields are populated by a separate enrichment
step, not at import time.

### 7.10 Parsed Datamap / codebook records

The Datamap requires a custom parser (R1 mitigation). The parser must handle:
1. Variable header rows (`[varname]: question text` in col[0])
2. Scale range rows (`Values: X-Y`)
3. Answer code rows (numeric col[1] + label col[2])
4. Sub-item rows (bracketed code in col[1] + label col[2])
5. OE marker rows (`Open text response` / `Open numeric response`)

Output: one `codebook` document per unique `variable_code`. The codebook must be
inserted **before** respondents so the ETL can look up labels during import.

### 7.11 Crosstab outputs

Treated as read-only reference data (R11 mitigation). Do not use crosstab sheets as a
source for respondent-level data. Optionally load into `crosstab_cache` collection for
display caching. Crosstab OE sheets (`S8_Unaided_Awareness`, `Q17_Unment_Needs`) are
**ignored** in favour of `A1` (R4 mitigation).

---

## 8. Provenance Strategy

Every document in every collection carries `_provenance`. The fields vary by collection:

| Field | `respondents` | `codebook` | `verbatims` | `import_batches` |
|-------|:---:|:---:|:---:|:---:|
| `source_file` | ✓ | ✓ | ✓ | via `source_files[]` |
| `sheet` | ✓ | ✓ | ✓ | via `source_files[]` |
| `original_column` | — | ✓ (`col[0]`) | ✓ | — |
| `question_code` | — | — | ✓ | — |
| `import_batch_id` | ✓ | ✓ | ✓ | (`_id` is the batch) |
| `imported_at` | ✓ | ✓ | ✓ | ✓ |
| `schema_version` | ✓ | — | — | ✓ |

`original_column` on `codebook` records preserves the raw column header name from the
Datamap (e.g. `S6_Functionr1`) so a document can always be traced back to its exact
spreadsheet cell.

---

## 9. Recommended Indexes

### `respondents` collection

```js
// Unique primary key (automatic on _id)
{ "_id": 1 }

// Cross-reference to survey platform record number
{ "record": 1 }

// Common segment filters — each individually
{ "profile.industry.code":             1 }
{ "profile.emp_count.code":            1 }
{ "profile.revenue.code":              1 }
{ "profile.seniority.code":            1 }
{ "profile.decision_involvement.code": 1 }
{ "profile.ai_adoption_approach.code": 1 }
{ "profile.tsp_engagement_plan.code":  1 }

// Most common compound (size + revenue = the two primary segments in crosstabs)
{ "profile.emp_count.code": 1, "profile.revenue.code": 1 }

// Multi-select array queries
{ "profile.functions":                 1 }
{ "brand_awareness.current_brands":    1 }
{ "brand_awareness.shown_brands":      1 }
{ "brand_awareness.familiar_brands":   1 }

// Brand scores array — for $unwind-based brand analysis
{ "brand_scores.brand": 1 }

// Compound: filter by brand, then by shown status
{ "brand_scores.brand": 1, "brand_scores.shown": 1 }
```

### `verbatims` collection

```js
{ "respondent_uuid":  1 }
{ "question_code":    1 }

// Segment-filtered verbatim retrieval (most common pattern for discourse analysis)
{ "question_code": 1, "respondent_snapshot.industry.code":  1 }
{ "question_code": 1, "respondent_snapshot.emp_count.code": 1 }

// Thematic/embedding queries (add when analysis fields are populated)
{ "analysis.themes":   1 }
{ "analysis.flagged":  1 }

// Future: vector index on "analysis.embedding" (not a standard B-tree index)
```

### `codebook` collection

```js
{ "_id":           1 }
{ "question_type": 1 }
```

### `import_batches` collection

```js
{ "started_at": -1 }
{ "status":      1 }
```

---

## 10. Risk Mitigations (from DATASET_AUDIT.md §14)

| Risk | Mitigation in schema |
|------|---------------------|
| **R1** Datamap not tidy | `codebook` is built by a custom parser before ETL runs; parser handles all 5 row types explicitly |
| **R2** Q24 sentinel `-1` | Stored with `"sentinel": true, "value": null` in `attribute_ratings`; never coerced to scale |
| **R3** Q40/Q47 are raw numeric | `question_type: "open_numeric"` in codebook; stored as plain numbers, no `{code, label}` wrapper |
| **R4** Crosstab OE sheets duplicate A1 | Crosstab OE sheets ignored; `A1` is sole source for all respondent and verbatim data |
| **R5** S8 unaided text is dirty | `text` (raw) + `text_normalised` (null at import) + `resolved_brand` (null at import); enrichment is a separate step |
| **R6** NaN ambiguity in brand fields | `shown` flag on each `brand_scores` entry derived from `pipedBrandsr{n}`; `null` score with `shown: true` = true non-response |
| **R7** `noanswer` flags separate from group | `noanswerQ*` values merged into multi-select arrays as a labelled option at import time |
| **R8** Q52 float64 | Cast to `int` in ETL; documented in codebook `notes` field |
| **R9** `record` not contiguous | `record` stored as data field, never used as positional index; `uuid` is `_id` |
| **R10** `vlist`/`list` ambiguity | Both stored as-is in `_meta` (`panel_list` uses `list`; `vlist` also preserved); schema notes the ambiguity |
| **R11** Crosstabs are pre-aggregated | Crosstab collection is optional and clearly labelled as `crosstab_cache`; all analysis runs against `respondents` |

---

## 11. MVP Schema

The MVP targets: **fast setup, immediate analysis, no over-engineering**.

### MVP collections (3 total)

| Collection | Docs | Estimated size |
|-----------|------|----------------|
| `codebook` | ~113 | < 1 MB |
| `respondents` | 600 | ~10 MB |
| `verbatims` | ~1,800 | ~2 MB |

### MVP document shape — `respondents`

Simplifications vs. the full extensible schema:
- **`responses` is flat** — each question is a direct sub-field, not nested by type
- **Multi-selects are label arrays** — same as extensible
- **Brand scores is still an array** — non-negotiable; changing this later is costly
- **No `crosstab_cache` collection** — compute on demand
- **No `analysis.*` fields in verbatims** — add later
- **`_meta` contains all paradata** — no filtering

```json
{
  "_id":   "5wyz442eaecekd4s",
  "record": 7,
  "schema_version": "1.0.0-mvp",

  "profile": {
    "hq_location":          { "code": 2, "label": "Headquartered in the U.S. with international operations" },
    "emp_count":            { "code": 8, "label": "10,000+" },
    "revenue":              { "code": 11, "label": "$1 billion – $9.99 billion" },
    "industry":             { "code": 11, "label": "Financial Services" },
    "seniority":            { "code": 3,  "label": "Director or equivalent" },
    "functions":            ["Information Technology (IT)", "AI, Machine Learning & Data Science"],
    "decision_involvement": { "code": 1,  "label": "Final decision maker" },
    "ai_adoption_approach": { "code": 3,  "label": "Balanced level of in-house and external service providers" },
    "tsp_engagement_plan":  { "code": 1,  "label": "Currently working with at least one provider" },
    "job_title":            "Sr Director IT Product Management"
  },

  "brand_awareness": {
    "unaided_raw":      ["microsoft", "ibm"],
    "unaided_normalised": [],
    "familiar_brands":  ["Cognizant", "Accenture"],
    "current_brands":   ["Cognizant"],
    "shown_brands":     ["Cognizant", "Accenture", "IBM Consulting"]
  },

  "brand_scores": [
    {
      "brand":       "Cognizant",
      "brand_idx":   1,
      "shown":       true,
      "tsp_rating_now":        { "code": 6, "label": "2" },
      "tsp_rating_2yrs_ago":   { "code": 5, "label": "1" },
      "tsp_rating_2yrs_future":{ "code": 7, "label": "3- Best in class" },
      "rank_2yrs_ago":   4,
      "rank_2yrs_future":6,
      "purchase_intent": { "code": 3, "label": "..." },
      "attribute_ratings": [
        { "attribute": "Industry domain expertise", "attribute_idx": 1,
          "code": 2, "value": 2, "sentinel": false }
      ]
    }
  ],

  "responses": {
    "Q4":  { "code": 7,  "label": "7" },
    "Q8":  { "code": 2,  "label": "Ahead of average" },
    "Q9":  { "code": 2,  "label": "Moderately successful" },
    "Q5":  [
      { "area_idx": 1, "area": "Customer service & support", "code": 1, "label": "Currently using AI" }
    ],
    "Q20_cells": [
      { "row_idx": 1, "col_idx": 1, "selected": true }
    ],
    "Q40": 1500000.0,
    "Q47": 50000,
    "Q11": ["Technology partnerships", "Innovation"],
    "Q17_unmet_needs": "We are yet to realize the full potential of AI"
  },

  "_meta": {
    "completion_time_sec": 2995.634,
    "start_date":          "2025-10-31T18:02:00",
    "panel_list":          6,
    "quota_markers":       "qualified,/Industry Quota/MCKKK"
  },

  "_provenance": {
    "source_file":     "Cognizant_Raw_Data.xlsx",
    "sheet":           "A1",
    "import_batch_id": "ObjectId(…)",
    "imported_at":     "2026-03-25T00:00:00Z",
    "schema_version":  "1.0.0-mvp"
  }
}
```

**MVP `verbatims` document (simplified):**

```json
{
  "_id":              "ObjectId(…)",
  "respondent_uuid":  "5wyz442eaecekd4s",
  "question_code":    "Q17_UnmetNeeds",
  "text":             "We are yet to realize the full potential of AI",
  "char_count":       47,
  "respondent_snapshot": {
    "industry":    { "code": 11, "label": "Financial Services" },
    "emp_count":   { "code": 8,  "label": "10,000+" },
    "revenue":     { "code": 11, "label": "$1 billion – $9.99 billion" },
    "seniority":   { "code": 3,  "label": "Director or equivalent" }
  },
  "_provenance": {
    "source_file":      "Cognizant_Raw_Data.xlsx",
    "sheet":            "A1",
    "original_column":  "Q17_UnmetNeeds",
    "import_batch_id":  "ObjectId(…)"
  }
}
```

---

## 12. Extensible Schema

Adds to the MVP without breaking it. Implement after the MVP is validated.

### Additional fields on `respondents`

```json
{
  "_tags": [],
  "_segments": {
    "is_enterprise":    true,
    "is_high_revenue":  true,
    "is_decision_maker":true,
    "cohort":           "current-user"
  },
  "responses": {
    "...": "...",
    "Q20_rows": ["row_label_1", ...],
    "Q20_cols": ["col_label_1", ...],
    "Q20_cells": [...]
  }
}
```

### Additional fields on `verbatims`

```json
{
  "word_count": 11,
  "analysis": {
    "embedding_model":   "text-embedding-3-small",
    "embedding":         [0.123, -0.456, ...],
    "themes":            ["budget", "internal resistance"],
    "sentiment":         "neutral",
    "flagged":           false,
    "reviewed_at":       null,
    "claim_ids":         []
  }
}
```

### New collection: `claims`

For the claims/proof generation use case:

```json
{
  "_id":        "ObjectId(…)",
  "claim_text": "Financial services respondents rate Cognizant highest for domain expertise",
  "claim_type": "brand_performance",
  "status":     "draft",

  "supporting_verbatim_ids": ["ObjectId(…)", "ObjectId(…)"],
  "supporting_query": {
    "collection":  "respondents",
    "filter":      { "profile.industry.code": 11 },
    "aggregation": "mean(brand_scores[brand=Cognizant].attribute_ratings[attribute_idx=1].value)"
  },
  "n_respondents":  47,
  "mean_score":     2.3,

  "created_at":    "2026-03-25T00:00:00Z",
  "created_by":    "agent:survey-intelligence-v1",
  "reviewed_by":   null,
  "approved":      false
}
```

### New collection: `segments`

For reusable segment definitions:

```json
{
  "_id":          "enterprise-current-users",
  "label":        "Enterprise Current Users",
  "description":  "10,000+ employees, currently working with a TSP",
  "filter": {
    "profile.emp_count.code":           { "$gte": 8 },
    "profile.tsp_engagement_plan.code": 1
  },
  "n_matched":    148,
  "last_run":     "2026-03-25T00:00:00Z"
}
```

---

## 13. Recommendation

### Implement the MVP schema first.

**Rationale:**

1. **All the hard structural decisions are already locked in.** The MVP and extensible
   schemas share the same `brand_scores` array layout, `codebook` structure, `verbatims`
   collection, and provenance fields. The extensible schema adds fields; it does not
   change the shape of existing ones. There is no costly migration later.

2. **600 respondents is a small dataset.** Even with a flat `responses` sub-document,
   query performance will be instant without compound indexes. The MVP indexes are
   sufficient for every analysis pattern this survey supports.

3. **The `codebook` and `verbatims` collections are the hardest parts.** Get those right
   in the MVP pass. The `codebook` parser (Datamap is not a tidy table — R1) and the
   unaided brand normalisation (R5) are the real engineering work; they are the same
   regardless of which schema you ship.

4. **Extensible fields can be added to existing docs with zero downtime.** MongoDB's
   schema-less design means `_tags`, `_segments`, `analysis.embedding`, and `claims`
   can be added to individual documents or written as new collections at any point
   without altering existing documents or rebuilding indexes.

5. **Validate before committing to deeper nesting.** The `Q20` grid, `Q24` attribute
   ratings, and `Q25/Q26` rankings need to be queried against real analysis questions
   before you know whether the array layout vs. keyed-object layout is right for your
   specific aggregations. The MVP gives you real data to test against.

### What to build first (in order)

```
1. codebook parser      → inserts ~113 codebook docs
2. respondent ETL       → inserts 600 respondent docs (uses codebook for decoding)
3. verbatims ETL        → inserts ~1,800 verbatim docs (uses respondent docs for snapshots)
4. indexes              → applied after bulk insert for speed
5. QA queries           → validate brand_scores counts, multi-select totals vs. crosstabs
6. unaided normalisation → enrichment pass on verbatims (S8 slots)
7. extensible additions → _segments, embeddings, claims (when needed)
```
