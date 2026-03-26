# Brand Scores — Missingness Specification

**Addendum to:** MONGODB_SCHEMA_PROPOSAL.md
**Date:** 2026-03-25
**Source:** Direct inspection of `Cognizant_Raw_Data.xlsx → A1`

---

## Key findings from data inspection

These facts were confirmed by querying the real data before writing this spec.
They override assumptions in the original schema proposal.

### Finding 1 — `pipedBrands` and `familiarBrands` are the same gate

`pipedBrandsr{n} = 1` ↔ `familiarBrandsr{n} = 1` for every respondent and every brand.
Zero rows have `piped=1, familiar=0` or `piped=0, familiar=1`.
Both flags derive from `S9_Aidedr{n}`: codes 1–4 (any familiarity) set both to 1;
codes 5–6 (heard name only / never heard of) set both to 0.

**Implication:** There is one routing gate, not two. For the schema, `shown` at the
brand level (from `pipedBrands`) is the single source of truth for routing.

### Finding 2 — Q1/Q2/Q3/Q25/Q26/Q27 have zero non-response when shown

When `pipedBrandsr{n} = 1`, every one of these question columns is non-null. 0 NaN
out of 333 shown respondents for each of these questions (confirmed for brand r1;
pattern holds for the brand array as a whole).

**Implication:** For Q1, Q2, Q3, Q25, Q26, Q27 — there are only **two** valid states,
not three. `not_shown` and `answered`. The `not_answered` state does not exist for
these questions in this dataset.

### Finding 3 — Q24 has genuine non-response at scale

When `pipedBrandsr1 = 1` (N=333), only 141 respondents answered Q24 attribute 1 for
Cognizant. 192 (57.7%) left it null. This is true non-response — the respondents
engaged with Q1/Q25/Q27 for the same brand in the same session. Q24 is an optional
or conditional section within the brand block.

**Implication:** Q24 is the only question type in `brand_scores` that requires all
three states: `not_shown`, `not_answered`, and `answered`.

### Finding 4 — The Q24 value `-1` is a valid scale point, not a sentinel

242 instances of `-1` across 192 Q24 columns, spread across all 16 brands. The 4 rows
with `Q24_Lr1r1 = -1` for Cognizant also contain `-2` for other attributes within the
same row. Respondents who gave `-1` also gave non-null answers to Q1 (codes 3–5) and
Q25 for the same brand. The full distribution (`-3:30, -2:93, -1:242, 0:1229, 1:5538,
2:7845, 3:4841`) is a plausible right-skewed rating distribution.

**Implication:** Audit risk R2 is resolved. `-1` is a valid answer on the -3 to +3
scale. Do not flag it as a sentinel. Store it as a normal `answered` value. The
`needs_review` / `sentinel` fields proposed in MONGODB_SCHEMA_PROPOSAL.md §7.6
are **not needed** and should be dropped.

---

## State definitions

### The three states and their real names

| State | Meaning | In raw data | Applies to |
|-------|---------|------------|-----------|
| `not_shown` | Survey routing did not show this brand to this respondent | `pipedBrandsr{n} = 0` AND value `= NaN` | All brand questions |
| `not_answered` | Brand was shown; respondent did not provide a rating | `pipedBrandsr{n} = 1` AND value `= NaN` | **Q24 only** in this dataset |
| `answered` | Brand was shown; respondent gave a valid rating | `pipedBrandsr{n} = 1` AND value `≠ NaN` | All brand questions |

### State existence by question type

| Question(s) | `not_shown` | `not_answered` | `answered` |
|------------|:-----------:|:--------------:|:----------:|
| Q1, Q2, Q3 (brand ratings) | ✓ | **✗ (zero NaN when shown)** | ✓ |
| Q24 (attribute ratings) | ✓ | ✓ | ✓ |
| Q25, Q26 (rankings) | ✓ | **✗ (zero NaN when shown)** | ✓ |
| Q27 (purchase intent) | ✓ | **✗ (zero NaN when shown)** | ✓ |

---

## Denominator guidance

Different analytic questions require different N denominators. The schema must preserve
enough information to support all of them.

| Analysis question | Correct denominator | Filter |
|------------------|--------------------|----|
| Mean Q1 rating for Cognizant | Respondents who answered Q1 for Cognizant | `shown = true` (equivalent to `answered` for Q1) |
| Mean Q24 attribute rating | Respondents who answered Q24 for this brand × attribute | `response_status = "answered"` on that attribute |
| % shown Cognizant who answered Q24 | Respondents shown Cognizant | `shown = true` |
| % of all 600 who rate Cognizant in attribute | All respondents | None |
| Q25 rank distribution for Cognizant | Respondents who ranked Cognizant | `shown = true` (same as answered for Q25) |

The single `shown` boolean on the brand object, plus `response_status` on each
question-level field, are sufficient to construct every denominator above.

---

## Exact document shapes

The `brand_scores` array always contains all 16 brands. Every brand object has the same
shape regardless of state. Fields are never omitted.

---

### Q1 / Q2 / Q3 — Brand ratings (coded 1–7, representing -3 to +3)

#### Brand NOT shown (`pipedBrands = 0`)

```json
{
  "brand":     "DXC Technology",
  "brand_idx": 13,
  "shown":     false,

  "tsp_rating_now": {
    "response_status": "not_shown",
    "code":            null,
    "label":           null,
    "question_code":   "Q1_TSP_Now"
  },
  "tsp_rating_2yrs_ago": {
    "response_status": "not_shown",
    "code":            null,
    "label":           null,
    "question_code":   "Q2_TSP_2yrsAgo"
  },
  "tsp_rating_2yrs_future": {
    "response_status": "not_shown",
    "code":            null,
    "label":           null,
    "question_code":   "Q3_TSP_2yrsfromnow"
  }
}
```

#### Brand shown, not answered — **does not occur for Q1/Q2/Q3**

This state has zero instances in the data. It is documented here for completeness only.
If it appears after a future re-field, the shape would be:

```json
{
  "tsp_rating_now": {
    "response_status": "not_answered",
    "code":            null,
    "label":           null,
    "question_code":   "Q1_TSP_Now"
  }
}
```

Do not create this state during ETL for the current dataset. If `pipedBrands = 1` and
the value is NaN for Q1/Q2/Q3, treat it as a data error and log it, do not silently
write `not_answered`.

#### Brand shown and answered (normal case)

```json
{
  "brand":     "Cognizant",
  "brand_idx": 1,
  "shown":     true,

  "tsp_rating_now": {
    "response_status": "answered",
    "code":            6,
    "label":           "2",
    "question_code":   "Q1_TSP_Now"
  },
  "tsp_rating_2yrs_ago": {
    "response_status": "answered",
    "code":            5,
    "label":           "1",
    "question_code":   "Q2_TSP_2yrsAgo"
  },
  "tsp_rating_2yrs_future": {
    "response_status": "answered",
    "code":            7,
    "label":           "3- Best in class",
    "question_code":   "Q3_TSP_2yrsfromnow"
  }
}
```

---

### Q24 — Brand attribute ratings (direct value -3 to +3; not coded 1–7)

**Note:** Q24 values are stored as the actual scale integers (-3 to +3), unlike Q1/Q2/Q3
which use coded 1–7. No label decoding is needed; `value` is the analyst-ready number.

#### Brand NOT shown

```json
{
  "brand":     "DXC Technology",
  "brand_idx": 13,
  "shown":     false,

  "attribute_ratings": [
    {
      "attribute":       "Industry domain expertise",
      "attribute_idx":   1,
      "response_status": "not_shown",
      "value":           null,
      "question_code":   "Q24_BrandAttributeRatings_Lr1"
    },
    {
      "attribute":       "Innovation leadership",
      "attribute_idx":   2,
      "response_status": "not_shown",
      "value":           null,
      "question_code":   "Q24_BrandAttributeRatings_Lr2"
    }
    // ... all 12 attributes, all not_shown
  ]
}
```

#### Brand shown, attribute NOT answered (common — 57.7% of shown respondents)

`shown = true` but this respondent left attribute 1 blank. Other attributes on the same
brand may be answered or also blank independently.

```json
{
  "brand":     "Capgemini",
  "brand_idx": 5,
  "shown":     true,

  "attribute_ratings": [
    {
      "attribute":       "Industry domain expertise",
      "attribute_idx":   1,
      "response_status": "not_answered",
      "value":           null,
      "question_code":   "Q24_BrandAttributeRatings_Lr1"
    },
    {
      "attribute":       "Innovation leadership",
      "attribute_idx":   2,
      "response_status": "answered",
      "value":           1,
      "question_code":   "Q24_BrandAttributeRatings_Lr2"
    }
    // attributes are independently answered/not_answered within the same brand block
  ]
}
```

#### Brand shown and attribute answered (including negative values)

Values of -1, -2, and -3 are valid scale points. No special flag needed. The example
below includes a -1 value to confirm it is stored exactly like any other rating.

```json
{
  "brand":     "Cognizant",
  "brand_idx": 1,
  "shown":     true,

  "attribute_ratings": [
    {
      "attribute":       "Industry domain expertise",
      "attribute_idx":   1,
      "response_status": "answered",
      "value":           2,
      "question_code":   "Q24_BrandAttributeRatings_Lr1"
    },
    {
      "attribute":       "Innovation leadership",
      "attribute_idx":   2,
      "response_status": "answered",
      "value":           -1,
      "question_code":   "Q24_BrandAttributeRatings_Lr2"
    },
    {
      "attribute":       "Breadth of service offerings",
      "attribute_idx":   3,
      "response_status": "not_answered",
      "value":           null,
      "question_code":   "Q24_BrandAttributeRatings_Lr3"
    }
  ]
}
```

#### Former "sentinel" case — now resolved as valid

The original schema proposal included `sentinel: true` and `value: null` for -1 values.
This is **incorrect and should not be implemented.** Data inspection confirms -1 is a
valid rating (242 instances; co-occurs with -2 in the same rows; respondents also gave
non-null Q1 ratings of 3–5 for the same brand). Store as `response_status: "answered",
value: -1`. No additional flags.

---

### Q25 / Q26 — Rankings (integer 1–6, representing ordinal rank position)

**Note:** Rankings are stored as direct integers 1–6 in the raw data (as float due to
NaN coercion by pandas; cast to int at import). No label decoding needed.

#### Brand NOT shown

```json
{
  "brand":     "DXC Technology",
  "brand_idx": 13,
  "shown":     false,

  "rank_2yrs_ago": {
    "response_status": "not_shown",
    "rank":            null,
    "question_code":   "Q25_Rank2yrsAgo"
  },
  "rank_2yrs_future": {
    "response_status": "not_shown",
    "rank":            null,
    "question_code":   "Q26_Rank2yrsfromNow"
  }
}
```

#### Brand shown, not ranked — **does not occur in this dataset**

Like Q1/Q2/Q3, Q25 and Q26 have zero NaN values when `pipedBrands = 1`. Every shown
brand receives a rank. Document this shape for reference only:

```json
{
  "rank_2yrs_ago": {
    "response_status": "not_answered",
    "rank":            null,
    "question_code":   "Q25_Rank2yrsAgo"
  }
}
```

If this state appears during ETL, log it as a data anomaly.

#### Brand shown and ranked (normal case)

```json
{
  "brand":     "Cognizant",
  "brand_idx": 1,
  "shown":     true,

  "rank_2yrs_ago": {
    "response_status": "answered",
    "rank":            4,
    "question_code":   "Q25_Rank2yrsAgo"
  },
  "rank_2yrs_future": {
    "response_status": "answered",
    "rank":            6,
    "question_code":   "Q26_Rank2yrsfromNow"
  }
}
```

---

## Complete brand object — one shown brand with mixed Q24 states

This is a realistic example combining all question types on a single brand object
(Cognizant, respondent uuid `5wyz442eaecekd4s`, confirmed from raw data row 0).

```json
{
  "brand":     "Cognizant",
  "brand_idx": 1,
  "shown":     true,

  "tsp_rating_now": {
    "response_status": "answered",
    "code":            6,
    "label":           "2",
    "question_code":   "Q1_TSP_Now"
  },
  "tsp_rating_2yrs_ago": {
    "response_status": "answered",
    "code":            5,
    "label":           "1",
    "question_code":   "Q2_TSP_2yrsAgo"
  },
  "tsp_rating_2yrs_future": {
    "response_status": "answered",
    "code":            6,
    "label":           "2",
    "question_code":   "Q3_TSP_2yrsfromnow"
  },

  "attribute_ratings": [
    {
      "attribute":       "Industry domain expertise",
      "attribute_idx":   1,
      "response_status": "answered",
      "value":           2,
      "question_code":   "Q24_BrandAttributeRatings_Lr1"
    },
    {
      "attribute":       "Innovation leadership",
      "attribute_idx":   2,
      "response_status": "not_answered",
      "value":           null,
      "question_code":   "Q24_BrandAttributeRatings_Lr2"
    }
    // ... 10 more attributes; each independently answered or not_answered
  ],

  "rank_2yrs_ago": {
    "response_status": "answered",
    "rank":            4,
    "question_code":   "Q25_Rank2yrsAgo"
  },
  "rank_2yrs_future": {
    "response_status": "answered",
    "rank":            6,
    "question_code":   "Q26_Rank2yrsfromNow"
  },

  "purchase_intent": {
    "response_status": "answered",
    "code":            4,
    "label":           "...",
    "question_code":   "Q27_PurchaseIntent"
  }
}
```

---

## Complete brand object — brand not shown

All question fields carry `response_status: "not_shown"` and `null` values. The shape
is identical to shown brands; only the values differ.

```json
{
  "brand":     "DXC Technology",
  "brand_idx": 13,
  "shown":     false,

  "tsp_rating_now": {
    "response_status": "not_shown",
    "code":            null,
    "label":           null,
    "question_code":   "Q1_TSP_Now"
  },
  "tsp_rating_2yrs_ago": {
    "response_status": "not_shown",
    "code":            null,
    "label":           null,
    "question_code":   "Q2_TSP_2yrsAgo"
  },
  "tsp_rating_2yrs_future": {
    "response_status": "not_shown",
    "code":            null,
    "label":           null,
    "question_code":   "Q3_TSP_2yrsfromnow"
  },

  "attribute_ratings": [
    {
      "attribute":       "Industry domain expertise",
      "attribute_idx":   1,
      "response_status": "not_shown",
      "value":           null,
      "question_code":   "Q24_BrandAttributeRatings_Lr1"
    }
    // ... all 12 attributes, all not_shown
  ],

  "rank_2yrs_ago": {
    "response_status": "not_shown",
    "rank":            null,
    "question_code":   "Q25_Rank2yrsAgo"
  },
  "rank_2yrs_future": {
    "response_status": "not_shown",
    "rank":            null,
    "question_code":   "Q26_Rank2yrsfromNow"
  },

  "purchase_intent": {
    "response_status": "not_shown",
    "code":            null,
    "label":           null,
    "question_code":   "Q27_PurchaseIntent"
  }
}
```

---

## Schema changes vs. MONGODB_SCHEMA_PROPOSAL.md

The following changes supersede the original proposal:

| Original proposal | Corrected specification |
|------------------|------------------------|
| Three states for Q1/Q2/Q3 including `not_answered` | Two states only: `not_shown` and `answered`. Log any NaN-when-shown as a data error. |
| `sentinel: true, value: null` for Q24 `-1` values | Not needed. Store `-1` as `response_status: "answered", value: -1`. |
| Q24 routing attributed to `familiarBrands` separately from `pipedBrands` | `pipedBrands` and `familiarBrands` are identical in this dataset. One gate. |
| `shown` flag described as derived from `pipedBrands` only | Confirmed: both `pipedBrands` and `familiarBrands` flags are equivalent; `pipedBrands` is the canonical source. |
| Q24 `value` field described with `code` + `value` | Q24 stores direct scale integers (-3 to +3); only `value` is needed. No `code` field for Q24 attributes. |
| Q25/Q26 values described as "may need decoding" | Confirmed: stored as direct rank integers 1–6. No decoding. No `code`/`label` wrapper. Store as plain `"rank": <int>`. |

---

## ETL validation rules derived from this spec

These rules should be asserted during import:

1. For every brand where `pipedBrands{n} = 0`: all of `tsp_rating_now.code`,
   `rank_2yrs_ago.rank`, `attribute_ratings[*].value` must be `null`.
2. For every brand where `pipedBrands{n} = 1`: `tsp_rating_now.code`,
   `rank_2yrs_ago.rank`, `purchase_intent.code` must be non-null. Log and halt if not.
3. Q24 `attribute_ratings[*].value` may be null even when `shown = true`. This is
   expected. Non-null values must be integers in `{-3, -2, -1, 0, 1, 2, 3}`.
4. Q25/Q26 rank values, when non-null, must be integers in `{1, 2, 3, 4, 5, 6}`.
5. Q1/Q2/Q3 codes, when non-null, must be integers in `{1, 2, 3, 4, 5, 6, 7}`.
