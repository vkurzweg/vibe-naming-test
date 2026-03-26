# Survey Intelligence — Starter Queries

Practical MongoDB aggregations for survey and sales intelligence use cases.
All queries are runnable in mongosh and collected in `scripts/sample_queries.js`.

---

## Scale reference

| Field | Scale | High value |
|-------|-------|-----------|
| `brand_scores[].purchase_intent.code` | 1–6 → labels `"0 - No chance"` … `"5 - Almost certainly"` | code ≥ 5 |
| `brand_scores[].tsp_rating_now/2yrs_ago/2yrs_future.code` | 1–7 → labels `"-3 - Worst in class"` … `"3 - Best in class"` | code ≥ 5 |
| `brand_scores[].attribute_ratings[].value` | Integer –3 … +3, direct (no code wrapper) | > 0 |
| `brand_awareness.aided_familiarity[].code` (S9) | 1=Using, 2=Past, 3=Considering, 4=Familiar, 5=Heard of, 6=Never heard | — |
| `responses.ai_maturity.code` (Q4) | 1–10 → `"1 - Just beginning"` … `"10 - Highly advanced"` | ≥ 7 |

**Three-state missingness for `brand_scores`:**

| `response_status` | Meaning |
|-------------------|---------|
| `not_shown` | Brand was not in this respondent's shown rotation — exclude from all brand analysis |
| `not_answered` | Brand was shown; respondent skipped this question — exclude from averages, count toward non-response rate |
| `answered` | Valid response — use in calculations |

**Efficient unwind order:** always `$match` on profile fields *before* `$unwind` on `brand_scores` to minimise intermediate documents.

---

## 1 — Current providers vs. purchase intent

### Q1-A — Does current use predict retention intent?

**Business question:** Among respondents who showed a brand, do current users give higher purchase-intent scores than non-users? Sizes the "renewal at risk" and "new logo" pools per brand.

```js
db.respondents.aggregate([
  { $unwind: "$brand_scores" },
  { $match: {
    "brand_scores.shown": true,
    "brand_scores.purchase_intent.response_status": "answered"
  }},
  { $addFields: {
    is_current_user: { $in: ["$brand_scores.brand", "$brand_awareness.current_brands"] }
  }},
  { $group: {
    _id: { brand: "$brand_scores.brand", is_current_user: "$is_current_user" },
    n:               { $sum: 1 },
    avg_intent_code: { $avg: "$brand_scores.purchase_intent.code" },
    pct_high_intent: {
      $avg: { $cond: [{ $gte: ["$brand_scores.purchase_intent.code", 5] }, 1, 0] }
    }
  }},
  { $addFields: {
    pct_high_intent: { $round: [{ $multiply: ["$pct_high_intent", 100] }, 1] }
  }},
  { $sort: { "_id.brand": 1, "_id.is_current_user": -1 } }
])
```

**What to look for:** large gaps between `is_current_user: true` and `false` rows signal strong incumbency advantage or lock-in risk. Small gaps signal commoditisation.

---

### Q1-B — Brand purchase-intent leaderboard

**Business question:** Across all shown respondents, which TSPs rank highest on likelihood to be retained or selected? One-line answer for an executive summary.

```js
db.respondents.aggregate([
  { $unwind: "$brand_scores" },
  { $match: {
    "brand_scores.shown": true,
    "brand_scores.purchase_intent.response_status": "answered"
  }},
  { $group: {
    _id:             "$brand_scores.brand",
    n_rated:         { $sum: 1 },
    avg_intent_code: { $avg: "$brand_scores.purchase_intent.code" },
    pct_high_intent: {
      $avg: { $cond: [{ $gte: ["$brand_scores.purchase_intent.code", 5] }, 1, 0] }
    }
  }},
  { $addFields: {
    approx_label_avg: { $round: [{ $subtract: ["$avg_intent_code", 1] }, 2] },
    pct_high_intent:  { $round: [{ $multiply: ["$pct_high_intent", 100] }, 1] }
  }},
  { $sort: { avg_intent_code: -1 } }
])
```

**Note:** `approx_label_avg` converts the 1–6 code to the 0–5 label scale so it reads the same as the questionnaire.

---

### Q1-C — Performance trajectory: current rating vs. 2-year-future rating

**Business question:** Which brands are gaining or losing ground in buyers' minds? Brands with positive `momentum` are strengthening; negative means eroding.

```js
db.respondents.aggregate([
  { $unwind: "$brand_scores" },
  { $match: {
    "brand_scores.shown": true,
    "brand_scores.tsp_rating_now.response_status":         "answered",
    "brand_scores.tsp_rating_2yrs_future.response_status": "answered"
  }},
  { $group: {
    _id:               "$brand_scores.brand",
    n:                 { $sum: 1 },
    avg_rating_now:    { $avg: "$brand_scores.tsp_rating_now.code" },
    avg_rating_future: { $avg: "$brand_scores.tsp_rating_2yrs_future.code" }
  }},
  { $addFields: {
    momentum: { $round: [{ $subtract: ["$avg_rating_future", "$avg_rating_now"] }, 3] }
  }},
  { $sort: { momentum: -1 } }
])
```

**Sales use:** leads sorted by negative momentum are buyers who expect a brand to get worse — Cognizant's sales team can target those accounts for displacement.

---

## 2 — Cognizant performance by segment

### Q2-A — Purchase intent and current rating by industry

**Business question:** In which verticals is Cognizant strongest and weakest on purchase intent? Drives vertical marketing prioritisation.

```js
db.respondents.aggregate([
  { $unwind: "$brand_scores" },
  { $match: {
    "brand_scores.brand": "Cognizant",
    "brand_scores.shown": true,
    "brand_scores.purchase_intent.response_status": "answered"
  }},
  { $group: {
    _id:             "$profile.industry.label",
    n:               { $sum: 1 },
    avg_intent_code: { $avg: "$brand_scores.purchase_intent.code" },
    avg_rating_now:  { $avg: {
      $cond: [
        { $eq: ["$brand_scores.tsp_rating_now.response_status", "answered"] },
        "$brand_scores.tsp_rating_now.code", null
      ]
    }},
    pct_high_intent: {
      $avg: { $cond: [{ $gte: ["$brand_scores.purchase_intent.code", 5] }, 1, 0] }
    }
  }},
  { $addFields: {
    pct_high_intent: { $round: [{ $multiply: ["$pct_high_intent", 100] }, 1] }
  }},
  { $sort: { avg_intent_code: -1 } }
])
```

---

### Q2-B — Cognizant vs. market intent gap by company size

**Business question:** Does Cognizant over- or under-index among enterprise vs. mid-market buyers? A positive `cognizant_gap` means Cognizant outperforms the field in that size band.

```js
db.respondents.aggregate([
  { $unwind: "$brand_scores" },
  { $match: {
    "brand_scores.shown": true,
    "brand_scores.purchase_intent.response_status": "answered"
  }},
  { $group: {
    _id: { emp_band: "$profile.emp_count.label", brand: "$brand_scores.brand" },
    n:          { $sum: 1 },
    avg_intent: { $avg: "$brand_scores.purchase_intent.code" }
  }},
  { $group: {
    _id: "$_id.emp_band",
    cognizant_intent: {
      $max: { $cond: [{ $eq: ["$_id.brand", "Cognizant"] }, "$avg_intent", null] }
    },
    market_avg_intent: { $avg: "$avg_intent" },
    n_cognizant: {
      $max: { $cond: [{ $eq: ["$_id.brand", "Cognizant"] }, "$n", null] }
    }
  }},
  { $addFields: {
    cognizant_gap: { $round: [{ $subtract: ["$cognizant_intent", "$market_avg_intent"] }, 3] }
  }},
  { $sort: { cognizant_gap: -1 } }
])
```

---

### Q2-C — Intent by buyer seniority

**Business question:** How does Cognizant's intent score differ between C-suite, VP, and Director-level respondents? Shapes executive engagement strategy.

```js
db.respondents.aggregate([
  { $unwind: "$brand_scores" },
  { $match: {
    "brand_scores.brand": "Cognizant",
    "brand_scores.shown": true,
    "brand_scores.purchase_intent.response_status": "answered"
  }},
  { $group: {
    _id: {
      seniority:            "$profile.seniority.label",
      decision_involvement: "$profile.decision_involvement.label"
    },
    n:               { $sum: 1 },
    avg_intent_code: { $avg: "$brand_scores.purchase_intent.code" }
  }},
  { $sort: { avg_intent_code: -1 } }
])
```

---

### Q2-D — Intent by AI maturity band

**Business question:** Are high-maturity AI buyers more or less likely to retain Cognizant? Answers whether Cognizant is positioned as an advanced-AI partner or a foundational-stage vendor.

Bands: Low (1–3), Mid (4–6), High (7–10).

```js
db.respondents.aggregate([
  { $unwind: "$brand_scores" },
  { $match: {
    "brand_scores.brand": "Cognizant",
    "brand_scores.shown": true,
    "brand_scores.purchase_intent.response_status": "answered"
  }},
  { $addFields: {
    maturity_band: {
      $switch: {
        branches: [
          { case: { $lte: ["$responses.ai_maturity.code", 3] }, then: "Low (1–3)" },
          { case: { $lte: ["$responses.ai_maturity.code", 6] }, then: "Mid (4–6)" }
        ],
        default: "High (7–10)"
      }
    }
  }},
  { $group: {
    _id:             "$maturity_band",
    n:               { $sum: 1 },
    avg_intent_code: { $avg: "$brand_scores.purchase_intent.code" },
    pct_high_intent: {
      $avg: { $cond: [{ $gte: ["$brand_scores.purchase_intent.code", 5] }, 1, 0] }
    }
  }},
  { $addFields: {
    pct_high_intent: { $round: [{ $multiply: ["$pct_high_intent", 100] }, 1] }
  }},
  { $sort: { "_id": 1 } }
])
```

---

## 3 — Q24 attribute comparisons across brands

Q24 asks shown respondents to rate each brand on 12 attributes using a –3 to +3 scale. The pipeline always requires a **double `$unwind`**: first on `brand_scores`, then on `attribute_ratings`. Filter `response_status: "answered"` before grouping.

### Q3-A — Full brand × attribute perceptions grid

**Business question:** The core competitive map. For every brand and every attribute, what is the average rating and the percentage of positive responses among shown respondents?

```js
db.respondents.aggregate([
  { $unwind: "$brand_scores" },
  { $match: { "brand_scores.shown": true } },
  { $unwind: "$brand_scores.attribute_ratings" },
  { $match: { "brand_scores.attribute_ratings.response_status": "answered" } },
  { $group: {
    _id: {
      attribute:     "$brand_scores.attribute_ratings.attribute",
      attribute_idx: "$brand_scores.attribute_ratings.attribute_idx",
      brand:         "$brand_scores.brand"
    },
    n_rated:      { $sum: 1 },
    avg_value:    { $avg: "$brand_scores.attribute_ratings.value" },
    pct_positive: {
      $avg: { $cond: [{ $gt: ["$brand_scores.attribute_ratings.value", 0] }, 1, 0] }
    },
    pct_negative: {
      $avg: { $cond: [{ $lt: ["$brand_scores.attribute_ratings.value", 0] }, 1, 0] }
    }
  }},
  { $addFields: {
    avg_value:    { $round: ["$avg_value", 3] },
    pct_positive: { $round: [{ $multiply: ["$pct_positive", 100] }, 1] },
    pct_negative: { $round: [{ $multiply: ["$pct_negative", 100] }, 1] }
  }},
  { $sort: { "_id.attribute_idx": 1, "avg_value": -1 } }
])
```

---

### Q3-B — Attribute leaders: which brand wins each dimension?

**Business question:** For each of the 12 attributes, which brand comes first? Used to build a rapid "best-in-class" summary across the competitive set.

```js
db.respondents.aggregate([
  { $unwind: "$brand_scores" },
  { $match: { "brand_scores.shown": true } },
  { $unwind: "$brand_scores.attribute_ratings" },
  { $match: { "brand_scores.attribute_ratings.response_status": "answered" } },
  { $group: {
    _id: {
      attribute:     "$brand_scores.attribute_ratings.attribute",
      attribute_idx: "$brand_scores.attribute_ratings.attribute_idx",
      brand:         "$brand_scores.brand"
    },
    n:         { $sum: 1 },
    avg_value: { $avg: "$brand_scores.attribute_ratings.value" }
  }},
  { $sort: { "_id.attribute_idx": 1, "avg_value": -1 } },
  { $group: {
    _id:        "$_id.attribute",
    leader:     { $first: "$_id.brand" },
    leader_avg: { $first: { $round: ["$avg_value", 3] } },
    all_brands: { $push: { brand: "$_id.brand", avg: { $round: ["$avg_value", 3] }, n: "$n" } }
  }},
  { $sort: { "_id": 1 } }
])
```

---

### Q3-C — Cognizant vs. Accenture head-to-head on all attributes

**Business question:** Direct competitor comparison for a sales battlecard. Replace `"Accenture"` with any brand in the study. The `gap` field is Cognizant minus competitor — positive means Cognizant leads.

```js
db.respondents.aggregate([
  { $unwind: "$brand_scores" },
  { $match: {
    "brand_scores.brand": { $in: ["Cognizant", "Accenture"] },
    "brand_scores.shown": true
  }},
  { $unwind: "$brand_scores.attribute_ratings" },
  { $match: { "brand_scores.attribute_ratings.response_status": "answered" } },
  { $group: {
    _id: {
      brand:         "$brand_scores.brand",
      attribute:     "$brand_scores.attribute_ratings.attribute",
      attribute_idx: "$brand_scores.attribute_ratings.attribute_idx"
    },
    n:         { $sum: 1 },
    avg_value: { $avg: "$brand_scores.attribute_ratings.value" }
  }},
  { $group: {
    _id: { attribute: "$_id.attribute", attribute_idx: "$_id.attribute_idx" },
    cognizant_avg: {
      $max: { $cond: [{ $eq: ["$_id.brand", "Cognizant"]  }, { $round: ["$avg_value", 3] }, null] }
    },
    accenture_avg: {
      $max: { $cond: [{ $eq: ["$_id.brand", "Accenture"] }, { $round: ["$avg_value", 3] }, null] }
    }
  }},
  { $addFields: {
    gap: { $round: [{ $subtract: ["$cognizant_avg", "$accenture_avg"] }, 3] }
  }},
  { $sort: { "_id.attribute_idx": 1 } }
])
```

---

### Q3-D — Cognizant attribute profile within a vertical

**Business question:** How do Financial Services buyers perceive Cognizant on each attribute? Change `"profile.industry.code": 11` to any other industry code. Apply the segment `$match` *before* the `$unwind` for efficiency.

```js
db.respondents.aggregate([
  { $match: { "profile.industry.code": 11 } },   // ← pre-filter before unwind
  { $unwind: "$brand_scores" },
  { $match: { "brand_scores.brand": "Cognizant", "brand_scores.shown": true } },
  { $unwind: "$brand_scores.attribute_ratings" },
  { $match: { "brand_scores.attribute_ratings.response_status": "answered" } },
  { $group: {
    _id: {
      attribute:     "$brand_scores.attribute_ratings.attribute",
      attribute_idx: "$brand_scores.attribute_ratings.attribute_idx"
    },
    n:         { $sum: 1 },
    avg_value: { $avg: "$brand_scores.attribute_ratings.value" }
  }},
  { $addFields: { avg_value: { $round: ["$avg_value", 3] } } },
  { $sort: { "avg_value": -1 } }
])
```

---

## 4 — Verbatim retrieval by theme and segment

Verbatims are in a separate `verbatims` collection. The `respondent_snapshot` sub-document is denormalised from the respondent at import time so all segment filters work without a `$lookup`.

`question_code` is either `"Q17_UnmetNeeds"` (one per respondent, unmet needs) or `"S8_Unaided"` (one per mention slot, brand recall). The `analysis.*` fields are populated by the downstream NLP pass.

### Q4-A — Keyword search in unmet-needs verbatims by vertical (pre-NLP)

**Business question:** What are Financial Services respondents saying about AI, automation, or data — before NLP theme tagging is complete?

```js
db.verbatims.find(
  {
    question_code: "Q17_UnmetNeeds",
    "respondent_snapshot.industry": 11,
    text: { $regex: /AI|automation|data/i }
  },
  {
    _id: 0, respondent_uuid: 1, text: 1,
    "respondent_snapshot.seniority_label": 1,
    "respondent_snapshot.emp_count_label": 1
  }
).limit(20)
```

---

### Q4-B — After NLP: unmet-needs theme × industry cross-tab

**Business question:** How many respondents per industry mentioned a specific theme (e.g. `"talent"`, `"ROI"`, `"security"`) as an unmet need? Replace the theme string with any tag produced by your NLP pipeline.

```js
db.verbatims.aggregate([
  { $match: {
    question_code:    "Q17_UnmetNeeds",
    "analysis.themes": "talent"        // ← replace with any theme tag
  }},
  { $group: {
    _id:     "$respondent_snapshot.industry_label",
    count:   { $sum: 1 },
    samples: { $push: { $substrCP: ["$text", 0, 120] } }
  }},
  { $sort: { count: -1 } }
])
```

---

### Q4-C — Unaided S8 mentions resolved to Cognizant, by segment

**Business question:** Among respondents who named Cognizant unprompted (slot 1 or later in S8), which industries and company sizes are most likely to recall them? Unaided recall is a leading indicator of salience.

```js
db.verbatims.aggregate([
  { $match: {
    question_code:           "S8_Unaided",
    "analysis.resolved_brand": "Cognizant"
  }},
  { $group: {
    _id: {
      industry:  "$respondent_snapshot.industry_label",
      emp_count: "$respondent_snapshot.emp_count_label"
    },
    n:        { $sum: 1 },
    mentions: { $push: "$text" }
  }},
  { $sort: { n: -1 } }
])
```

---

### Q4-D — Unmet-needs from high-AI-maturity respondents

**Business question:** What do the most sophisticated AI buyers say they still can't get from providers? These are Cognizant's most valuable prospects — their unmet needs should directly inform the product/service roadmap.

```js
db.verbatims.find(
  {
    question_code: "Q17_UnmetNeeds",
    "respondent_snapshot.ai_maturity_code": { $gte: 7 }
  },
  {
    _id: 0, respondent_uuid: 1, text: 1, char_count: 1,
    "respondent_snapshot.ai_maturity_code": 1,
    "respondent_snapshot.industry_label": 1
  }
).sort({ "respondent_snapshot.ai_maturity_code": -1, char_count: -1 })
 .limit(30)
```

---

### Q4-E — Verbatim volume and engagement by segment

**Business question:** Which segments wrote the longest, most detailed open-text responses? Long responses signal strong opinions — positive or negative — and are higher-value for NLP analysis.

```js
db.verbatims.aggregate([
  { $match: { question_code: "Q17_UnmetNeeds" } },
  { $group: {
    _id: {
      industry:  "$respondent_snapshot.industry_label",
      seniority: "$respondent_snapshot.seniority_label"
    },
    n:              { $sum: 1 },
    avg_word_count: { $avg: "$word_count" },
    avg_char_count: { $avg: "$char_count" }
  }},
  { $addFields: {
    avg_word_count: { $round: ["$avg_word_count", 1] },
    avg_char_count: { $round: ["$avg_char_count", 0] }
  }},
  { $sort: { n: -1 } }
])
```

---

## 5 — White-space analysis

White space = attributes where a brand underperforms (avg Q24 value ≤ 0) relative to competitors or to its own potential. Two distinct signals: *negative ratings* (buyers disagree with the attribute claim) and *high not-answered rates* (buyers can't form a view — uncertainty is itself a white space).

### Q5-A — Cognizant's weakest attributes

**Business question:** Which of the 12 Q24 attributes are buyers least convinced about for Cognizant? These are the messaging gaps most urgently needing attention.

```js
db.respondents.aggregate([
  { $unwind: "$brand_scores" },
  { $match: { "brand_scores.brand": "Cognizant", "brand_scores.shown": true } },
  { $unwind: "$brand_scores.attribute_ratings" },
  { $match: { "brand_scores.attribute_ratings.response_status": "answered" } },
  { $group: {
    _id: {
      attribute:     "$brand_scores.attribute_ratings.attribute",
      attribute_idx: "$brand_scores.attribute_ratings.attribute_idx"
    },
    n:            { $sum: 1 },
    avg_value:    { $avg: "$brand_scores.attribute_ratings.value" },
    pct_negative: {
      $avg: { $cond: [{ $lt: ["$brand_scores.attribute_ratings.value", 0] }, 1, 0] }
    }
  }},
  { $match: { avg_value: { $lte: 0 } } },
  { $addFields: {
    avg_value:    { $round: ["$avg_value", 3] },
    pct_negative: { $round: [{ $multiply: ["$pct_negative", 100] }, 1] }
  }},
  { $sort: { avg_value: 1 } }
])
```

---

### Q5-B — Cognizant perceptions gap vs. field average per attribute

**Business question:** On which attributes does Cognizant trail the field most severely? Sorted by largest gap (most negative first) to prioritise remediation efforts.

```js
db.respondents.aggregate([
  { $unwind: "$brand_scores" },
  { $match: { "brand_scores.shown": true } },
  { $unwind: "$brand_scores.attribute_ratings" },
  { $match: { "brand_scores.attribute_ratings.response_status": "answered" } },
  { $group: {
    _id: {
      brand:         "$brand_scores.brand",
      attribute:     "$brand_scores.attribute_ratings.attribute",
      attribute_idx: "$brand_scores.attribute_ratings.attribute_idx"
    },
    n:         { $sum: 1 },
    avg_value: { $avg: "$brand_scores.attribute_ratings.value" }
  }},
  { $group: {
    _id: { attribute: "$_id.attribute", attribute_idx: "$_id.attribute_idx" },
    cognizant_avg: {
      $max: { $cond: [{ $eq: ["$_id.brand", "Cognizant"] }, "$avg_value", null] }
    },
    field_avg: { $avg: "$avg_value" }
  }},
  { $addFields: {
    gap_vs_field:  { $round: [{ $subtract: ["$cognizant_avg", "$field_avg"] }, 3] },
    cognizant_avg: { $round: ["$cognizant_avg", 3] },
    field_avg:     { $round: ["$field_avg", 3] }
  }},
  { $sort: { gap_vs_field: 1 } }          // most negative gaps first
])
```

---

### Q5-C — Vertical battlecard: Cognizant vs. Accenture in Financial Services

**Business question:** Specific to FS buyers, where does Cognizant lead and trail Accenture? Input for a vertical pitch deck or sales call preparation brief.

```js
db.respondents.aggregate([
  { $match: { "profile.industry.code": 11 } },        // pre-filter
  { $unwind: "$brand_scores" },
  { $match: {
    "brand_scores.brand": { $in: ["Cognizant", "Accenture"] },
    "brand_scores.shown": true
  }},
  { $unwind: "$brand_scores.attribute_ratings" },
  { $match: { "brand_scores.attribute_ratings.response_status": "answered" } },
  { $group: {
    _id: {
      brand:         "$brand_scores.brand",
      attribute:     "$brand_scores.attribute_ratings.attribute",
      attribute_idx: "$brand_scores.attribute_ratings.attribute_idx"
    },
    n:         { $sum: 1 },
    avg_value: { $avg: "$brand_scores.attribute_ratings.value" }
  }},
  { $group: {
    _id: { attribute: "$_id.attribute", attribute_idx: "$_id.attribute_idx" },
    cognizant_avg: {
      $max: { $cond: [{ $eq: ["$_id.brand", "Cognizant"]  }, { $round: ["$avg_value", 3] }, null] }
    },
    accenture_avg: {
      $max: { $cond: [{ $eq: ["$_id.brand", "Accenture"] }, { $round: ["$avg_value", 3] }, null] }
    }
  }},
  { $addFields: {
    gap: { $round: [{ $subtract: ["$cognizant_avg", "$accenture_avg"] }, 3] }
  }},
  { $sort: { "_id.attribute_idx": 1 } }
])
```

---

### Q5-D — Not-answered rate by brand and attribute (uncertainty white space)

**Business question:** High `pct_no_answer` means buyers couldn't form a view — they saw the brand but had nothing to say about this attribute. Uncertainty is a selling opportunity: Cognizant can own an attribute that competitors haven't yet claimed in buyers' minds.

```js
db.respondents.aggregate([
  { $unwind: "$brand_scores" },
  { $match: { "brand_scores.shown": true } },
  { $unwind: "$brand_scores.attribute_ratings" },
  { $group: {
    _id: {
      brand:         "$brand_scores.brand",
      attribute:     "$brand_scores.attribute_ratings.attribute",
      attribute_idx: "$brand_scores.attribute_ratings.attribute_idx"
    },
    total:        { $sum: 1 },
    not_answered: {
      $sum: { $cond: [
        { $eq: ["$brand_scores.attribute_ratings.response_status", "not_answered"] }, 1, 0
      ]}
    }
  }},
  { $addFields: {
    pct_no_answer: { $round: [
      { $multiply: [{ $divide: ["$not_answered", "$total"] }, 100] }, 1
    ]}
  }},
  { $sort: { pct_no_answer: -1 } },
  { $limit: 40 }                          // top 40 highest-uncertainty slots
])
```

---

## 6 — Reusable aggregation patterns

### Pattern A — Shown-brand base expansion

Paste at the top of any brand-level aggregation. Expands 600 respondent documents into `n × shown_brands` rows. Always filter `shown: true` — do not analyse not-shown brands.

```js
{ $unwind: "$brand_scores" },
{ $match:  { "brand_scores.shown": true } }
```

---

### Pattern B — Double-unwind for Q24

Required for any per-attribute analysis. The second `$match` on `response_status` excludes skipped attributes from averages (they remain valid as a count denominator for non-response rate — see Q5-D).

```js
{ $unwind: "$brand_scores" },
{ $match:  { "brand_scores.shown": true } },
{ $unwind: "$brand_scores.attribute_ratings" },
{ $match:  { "brand_scores.attribute_ratings.response_status": "answered" } }
```

---

### Pattern C — Segment pre-filter (efficiency)

When filtering to a single segment, put the `$match` on profile fields *before* the `$unwind`. MongoDB processes the smaller set of documents rather than unwinding all 600 first.

```js
{ $match:  { "profile.industry.code": 11 } },   // ← before unwind
{ $unwind: "$brand_scores" },
{ $match:  { "brand_scores.shown": true } }
```

---

### Pattern D — Cognizant vs. market pivot (single aggregation)

Groups by `(brand, segment)` then re-groups to place Cognizant and the field average side-by-side in one row per segment. Works for any numeric brand metric.

```js
// Stage 1: brand × segment averages
{ $group: {
  _id:        { brand: "$brand_scores.brand", seg: "$profile.FIELD.label" },
  avg_metric: { $avg: "$brand_scores.METRIC.code" }
}},
// Stage 2: pivot into Cognizant vs market columns
{ $group: {
  _id: "$_id.seg",
  cognizant_metric: {
    $max: { $cond: [{ $eq: ["$_id.brand", "Cognizant"] }, "$avg_metric", null] }
  },
  market_avg: { $avg: "$avg_metric" }
}}
```

---

### Pattern E — Verbatim segment cross-tab

Works identically pre-NLP (with a `$regex` filter on `text`) or post-NLP (with a theme/brand/sentiment filter on `analysis.*` fields).

```js
db.verbatims.aggregate([
  { $match: {
    question_code:    "Q17_UnmetNeeds",
    "analysis.themes": "YOUR_THEME"      // or: text: { $regex: /keyword/i }
  }},
  { $group: {
    _id:   "$respondent_snapshot.SEGMENT_FIELD",
    count: { $sum: 1 },
    avg_word_count: { $avg: "$word_count" }
  }},
  { $sort: { count: -1 } }
])
```

---

### Pattern F — S8 unaided raw mention frequency

Pre-NLP frequency table for auditing brand resolution rules or finding common misspellings. Feed this into the NLP pass to build the `resolved_brand` lookup dictionary.

```js
db.verbatims.aggregate([
  { $match: { question_code: "S8_Unaided" } },
  { $group: {
    _id:   { $toLower: { $trim: { input: "$text" } } },
    count: { $sum: 1 }
  }},
  { $sort: { count: -1 } },
  { $limit: 40 }
])
```

---

### Pattern G — Q22 brand association extraction

Q22 stores one free-text association per shown brand per respondent. Use this to build word-cloud or sentiment inputs for any brand.

```js
db.respondents.aggregate([
  { $unwind: "$responses.q22_brand_associations" },
  { $match: { "responses.q22_brand_associations.brand": "Cognizant" } },
  { $project: {
    _id: 0,
    text:      "$responses.q22_brand_associations.text",
    industry:  "$profile.industry.label",
    seniority: "$profile.seniority.label"
  }}
])
```

---

## Running all queries at once

```bash
mongosh "${MONGODB_URI}/${MONGODB_DATABASE}" \
  --file scripts/sample_queries.js \
  | tee query_output.txt
```

To run a single named block, copy it into mongosh interactively or wrap it in a standalone `.js` file.
