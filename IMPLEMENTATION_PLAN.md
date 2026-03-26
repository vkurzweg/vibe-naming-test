# Implementation Plan — Cognizant Survey Intelligence MongoDB Import

**Date:** 2026-03-25
**Supersedes:** MONGODB_SCHEMA_PROPOSAL.md (field details), MONGODB_SCHEMA_MISSINGNESS.md (missingness rules)
**Source of truth:** `data/raw/Cognizant_Raw_Data.xlsx`
**Do not modify source files.**

---

## Contents

1. [Corrections incorporated](#1-corrections-incorporated)
2. [Build order](#2-build-order)
3. [Reference tables](#3-reference-tables)
4. [Collection: `codebook`](#4-collection-codebook)
5. [Collection: `respondents`](#5-collection-respondents)
6. [Collection: `verbatims`](#6-collection-verbatims)
7. [Collection: `import_batches`](#7-collection-import_batches)
8. [ETL transformation rules by question family](#8-etl-transformation-rules-by-question-family)
9. [Post-import validation rules](#9-post-import-validation-rules)
10. [Index definitions](#10-index-definitions)

---

## 1. Corrections incorporated

From MONGODB_SCHEMA_MISSINGNESS.md (all confirmed by data inspection):

| # | Correction |
|---|-----------|
| C1 | `pipedBrands`, `familiarBrands`, and `S9_Aided` codes 1–4 are equivalent. One gate governs routing for all brand questions (Q1, Q2, Q3, Q20, Q24, Q25, Q26, Q27). |
| C2 | Q1/Q2/Q3/Q25/Q26/Q27 have **zero NaN when piped=1**. Only two states exist for these: `not_shown` and `answered`. |
| C3 | Q20 follows the same routing gate (piped=1 → fully answered; piped=0 → all null). No third state. |
| C4 | Any NaN in Q1/Q2/Q3/Q20/Q25/Q26/Q27 when `piped=1` is a **data error**, not normal missingness. Log and halt ETL. |
| C5 | Q24 is the only brand question family with genuine non-response. Three states exist: `not_shown`, `not_answered`, `answered`. |
| C6 | Q24 stores **direct scale integers** (-3 to +3). No code/label wrapper. `-1` is a valid scale point. |
| C7 | Q25/Q26 store direct integer ranks 1–6. No code/label wrapper. |
| C8 | Q27 is coded 1–6 (scale: "0 – No chance whatsoever" → "5 – Almost certainly"). Decode with codebook. |
| C9 | The `sentinel` / `needs_review` fields proposed in the original schema are **not implemented**. |
| C10 | Q5 is a per-row coded scale (values 1–4), not a binary multi-select. |

---

## 2. Build order

Steps must run in this sequence. Each step depends on the previous.

```
Step 1  Parse Datamap         →  insert codebook documents
Step 2  Import respondents    →  insert respondent documents (reads codebook)
Step 3  Extract verbatims     →  insert verbatim documents (reads respondent _id)
Step 4  Post-import validation →  run all assertions; fail loudly on any error
Step 5  Build indexes          →  after bulk insert for speed
Step 6  Smoke-test queries     →  verify counts against known crosstab totals
```

Step 3 may run as a continuation of Step 2 (same script, second pass) or as a separate script. Step 5 must follow bulk insert; building indexes before insert is slower.

---

## 3. Reference tables

### 3.1 Brand list (all 16, r-index to name)

| r-idx | Brand name |
|-------|-----------|
| r1 | Cognizant |
| r2 | Accenture |
| r3 | IBM Consulting |
| r4 | Infosys |
| r5 | Capgemini |
| r6 | Wipro |
| r7 | Tata Consultancy Services (TCS) |
| r8 | EY |
| r9 | HCL Technologies |
| r10 | Deloitte |
| r11 | McKinsey & Company |
| r12 | Google (Cloud & Gemini) |
| r13 | DXC Technology |
| r14 | ServiceNow |
| r15 | Microsoft (Azure & Copilot) |
| r16 | Amazon Web Services (AWS) |

Note: `S9_Aidedr17` (Supercalifragilisticexpialidocious Incorporated) is a survey control brand. All 600 respondents scored it 6 (never heard of). It is never piped. **Do not include r17 in `brand_scores`.**

### 3.2 Q24 attribute labels (Lr-index to attribute name)

| Lr-idx | Short label | Full question text |
|--------|------------|-------------------|
| Lr1 | Industry domain expertise | "Please rate each brand on their industry domain expertise…" |
| Lr2 | Innovation & thought leadership | "…reputation for innovation & thought leadership in AI space…" |
| Lr3 | Proven AI case studies | "…proven AI case studies and outcomes…" |
| Lr4 | Pricing | "…pricing…" |
| Lr5 | Implementation speed | "…implementation speed/time to value…" |
| Lr6 | Institutional knowledge | "…institutional knowledge of your business/longstanding relationship…" |
| Lr7 | Ecosystem partnerships | "…expertise in/relationships with enterprise technology and cloud/data infrastructure partners…" |
| Lr8 | Solution customisation | "…solution customization & engagement model flexibility…" |
| Lr9 | Collaboration & cultural fit | "…collaboration and cultural fit…" |
| Lr10 | Strategic consulting | "…strategic consulting, change management & training capabilities…" |
| Lr11 | Geographic presence | "…geographic presence and local support…" |
| Lr12 | Talent & quality | "…high quality talent, services and solutions…" |

### 3.3 Q20 column labels (c-index to category type)

| c-idx | Category label |
|-------|---------------|
| c1 | Cloud infrastructure company |
| c2 | Software-as-a-service (SaaS) provider |
| c3 | Management consultancy |
| c4 | Technology consultancy |
| c5 | IT services firm |
| c6 | AI startup |
| c7 | AI model company |

Q20 rows = same 16-brand list as §3.1 (same piping gate).

### 3.4 Brand exposure distribution

Observed counts (600 respondents):

| Brands shown per respondent | N respondents |
|-----------------------------|---------------|
| 3 | 42 |
| 4 | 77 |
| 5 | 17 |
| 6 | 464 |

Most respondents (77%) see exactly 6 brands. Minimum is 3. The 16-brand array is always fully present in `brand_scores`; brands not shown have `shown: false`.

---

## 4. Collection: `codebook`

### Purpose

Machine-readable lookup table parsed from the `Datamap` sheet. Must be inserted before
respondents. Used by the ETL to decode coded integer values to text labels.

### Document schema

```
Field                  MongoDB Type   Notes
─────────────────────────────────────────────────────────────────────
_id                    String         = variable_code (e.g. "S1_HQ")
variable_code          String         Same as _id
question_text          String         Full text from Datamap col[0]
question_type          String         See §4.1
scale_min              Int32          Null for open_text / open_numeric
scale_max              Int32          Null for open_text / open_numeric
answer_codes           Object         Map of "code_str" → "label". Null if OE.
sub_items              Array          Array of sub-item objects. Null if not grid.
  sub_items[].idx            Int32
  sub_items[].column_code    String   e.g. "Q1_TSP_Nowr1"
  sub_items[].label          String   e.g. "Cognizant"
_provenance            Object
  source_file          String         "Cognizant_Raw_Data.xlsx"
  sheet                String         "Datamap"
  import_batch_id      ObjectId
```

### 4.1 `question_type` vocabulary

| Value | Applied to |
|-------|-----------|
| `single_coded` | One integer → one label (S1_HQ, Q4, Q8, Q28, Q35, etc.) |
| `multi_select` | Binary 0/1 per option (S6_Function, Q11–Q16, Q18–Q19, etc.) |
| `grid_coded` | One coded value per row item (Q5, Q6, Q7, Q1/Q2/Q3, Q27) |
| `grid_direct` | One direct-scale value per row item (Q24, Q25, Q26) |
| `two_dim_grid` | Row × column binary matrix (Q20 only) |
| `open_text` | Free text, no coding (Q17_UnmetNeeds, Q51, *oe fields) |
| `open_numeric` | Continuous number, no coding (Q40, Q47) |

### 4.2 Datamap parser rules

The Datamap has no column headers. Parse it row by row using these rules:

| Row pattern | Action |
|-------------|--------|
| `col[0]` matches `[varname]: text` or `varname: text` | Start new variable block. `variable_code` = text before `:`. `question_text` = full string. |
| `col[0]` = `"Open text response"` | Set `question_type = open_text`. No answer_codes. |
| `col[0]` = `"Open numeric response"` | Set `question_type = open_numeric`. No answer_codes. |
| `col[0]` = `"Values: X-Y"` | Record scale_min, scale_max. |
| `col[0]` is NaN, `col[1]` is a numeric string | Answer code row. Add `{col[1]: col[2]}` to `answer_codes`. |
| `col[0]` is NaN, `col[1]` matches `[varname]` | Sub-item row. Add to `sub_items`. |
| All three columns are NaN | Blank spacer row. Skip. |

Note: Some question headers lack brackets (`Q20r1: Cognizant - For each…`). The parser
must handle both `[varname]: text` and `varname: text` patterns.

---

## 5. Collection: `respondents`

### Document schema — top level

```
Field               MongoDB Type   Source          Notes
──────────────────────────────────────────────────────────────────────────
_id                 String         A1.uuid         Canonical ID
record              Int32          A1.record        Platform record number
schema_version      String         ETL constant    "1.0"
profile             Object         See §5.1
brand_awareness     Object         See §5.2
brand_scores        Array[Object]  See §5.3        Always 16 elements
responses           Object         See §5.4
verbatims           Object         See §5.5
_meta               Object         See §5.6
_provenance         Object         See §5.7
```

### 5.1 `profile` field definitions

```
Field                       MongoDB Type   Source col            Decoded?
────────────────────────────────────────────────────────────────────────────
hq_location.code            Int32          S1_HQ                 —
hq_location.label           String         S1_HQ                 via codebook
emp_count.code              Int32          S2_EmpCount           —
emp_count.label             String         S2_EmpCount           via codebook
revenue.code                Int32          S3_Revenue            —
revenue.label               String         S3_Revenue            via codebook
industry.code               Int32          S4_Industry           —
industry.label              String         S4_Industry           via codebook
industry.other_specify      String|Null    S4_Industryr28oe      raw text
seniority.code              Int32          S5_Seniority          —
seniority.label             String         S5_Seniority          via codebook
functions                   Array[String]  S6_Functionr1–r22     labels of checked items
functions_other_specify     String|Null    S6_Functionr22oe      raw text
works_with_provider.code    Int32          S7                    —
works_with_provider.label   String         S7                    via codebook
decision_involvement.code   Int32          S10_DecisionInvolvement —
decision_involvement.label  String         S10_DecisionInvolvement via codebook
ai_adoption_approach.code   Int32          S11                   —
ai_adoption_approach.label  String         S11                   via codebook
tsp_engagement_plan.code    Int32          S12                   —
tsp_engagement_plan.label   String         S12                   via codebook
job_title                   String|Null    Q51                   free text; no decoding
```

### 5.2 `brand_awareness` field definitions

```
Field                   MongoDB Type     Source cols               Notes
──────────────────────────────────────────────────────────────────────────────
unaided_mentions_raw    Array[String]    S8_Unaidedr1oe–r5oe       non-null slots only
unaided_mentions        Array[String]    —                         null at import; filled by normalisation pass
unaided_cant_think      Boolean          S8_Unaidedr6              true if value == 1
aided_familiarity       Array[Object]    S9_Aidedr1–r17            17 objects (r1-r17); see §5.2a
familiar_brands         Array[String]    familiarBrandsr1–r16      brand names where value == 1
current_brands          Array[String]    currentBrandsr1–r16       brand names where value == 1
shown_brands            Array[String]    pipedBrandsr1–r16         brand names where value == 1
```

**§5.2a `aided_familiarity` element schema:**

```
brand           String   e.g. "Cognizant"
brand_idx       Int32    1–17
code            Int32    S9_Aidedr{n} value (1–6)
label           String   decoded via codebook
question_code   String   "S9_Aided"
```

Note: r17 (control brand) is included in `aided_familiarity` for completeness (code always 6, "Never heard of") but is excluded from all brand_scores processing.

### 5.3 `brand_scores` array — element schema

The array always has exactly **16 elements** (r1–r16). Order: r1 first, r16 last.

```
Field                               MongoDB Type   Present when          Notes
───────────────────────────────────────────────────────────────────────────────────
brand                               String         always                Brand name
brand_idx                           Int32          always                1–16
shown                               Boolean        always                from pipedBrandsr{n}

tsp_rating_now                      Object         always                Q1_TSP_Now
  .response_status                  String         always                "not_shown" | "answered"
  .code                             Int32|Null     if answered           1–7
  .label                            String|Null    if answered           decoded via codebook
  .question_code                    String         always                "Q1_TSP_Now"

tsp_rating_2yrs_ago                 Object         always                Q2_TSP_2yrsAgo
  .response_status                  String         always
  .code                             Int32|Null
  .label                            String|Null
  .question_code                    String         always                "Q2_TSP_2yrsAgo"

tsp_rating_2yrs_future              Object         always                Q3_TSP_2yrsfromnow
  .response_status                  String         always
  .code                             Int32|Null
  .label                            String|Null
  .question_code                    String         always                "Q3_TSP_2yrsfromnow"

brand_category_perception           Object         always                Q20
  .response_status                  String         always                "not_shown" | "answered"
  .selected_categories              Array[String]  if answered           category labels where value==1
  .question_code                    String         always                "Q20"

attribute_ratings                   Array[Object]  always                Q24; 12 elements
  [].attribute                      String         always                from §3.2 short label
  [].attribute_idx                  Int32          always                1–12
  [].response_status                String         always                "not_shown"|"not_answered"|"answered"
  [].value                          Int32|Null     if answered           -3 to +3 (direct scale; no code wrap)
  [].question_code                  String         always                "Q24_BrandAttributeRatings_Lr{n}"

rank_2yrs_ago                       Object         always                Q25
  .response_status                  String         always                "not_shown" | "answered"
  .rank                             Int32|Null     if answered           1–6 (direct; no code wrap)
  .question_code                    String         always                "Q25_Rank2yrsAgo"

rank_2yrs_future                    Object         always                Q26
  .response_status                  String         always                "not_shown" | "answered"
  .rank                             Int32|Null     if answered           1–6 (direct; no code wrap)
  .question_code                    String         always                "Q26_Rank2yrsfromNow"

purchase_intent                     Object         always                Q27
  .response_status                  String         always                "not_shown" | "answered"
  .code                             Int32|Null     if answered           1–6 (coded; decode via codebook)
  .label                            String|Null    if answered
  .question_code                    String         always                "Q27_PurchaseIntent"
```

**Allowed `response_status` values by question:**

| Question | `"not_shown"` | `"not_answered"` | `"answered"` |
|---------|:---:|:---:|:---:|
| Q1, Q2, Q3 | ✓ | ✗ | ✓ |
| Q20 | ✓ | ✗ | ✓ |
| Q24 (per attribute) | ✓ | ✓ | ✓ |
| Q25, Q26 | ✓ | ✗ | ✓ |
| Q27 | ✓ | ✗ | ✓ |

**Denominator logic:**

| Analysis | Filter | N |
|---------|--------|---|
| Mean Q1 rating for a brand | `brand_scores[brand=X].tsp_rating_now.response_status = "answered"` | All `shown=true` rows (identical for Q1) |
| Mean Q24 attribute rating | `attribute_ratings[attribute_idx=n].response_status = "answered"` | Subset of `shown=true` |
| % of shown respondents who answered Q24 attr | `shown=true` | Full shown set |
| Q25 rank distribution | `rank_2yrs_ago.response_status = "answered"` | All `shown=true` rows |

**Aggregation note — Q24 requires a double `$unwind`:**
`attribute_ratings` is a nested array inside `brand_scores`. Any MongoDB pipeline that
aggregates Q24 data must unwind twice before matching or grouping:
```js
{ $unwind: "$brand_scores" }
{ $match:  { "brand_scores.brand_idx": N } }
{ $unwind: "$brand_scores.attribute_ratings" }
{ $match:  { "brand_scores.attribute_ratings.attribute_idx": M, ... } }
```
All other brand_scores questions (Q1–Q3, Q25–Q27, Q20) require only a single `$unwind`.

### 5.4 `responses` field definitions

All questions not part of `brand_scores` or `profile`.

**Single-coded scalars:**

```
Field                       MongoDB Type   Source col        Scale
────────────────────────────────────────────────────────────────────
ai_maturity.code            Int32          Q4                1–10
ai_maturity.label           String         Q4                decoded
ai_maturity.question_code   String                           "Q4"

ai_adoption_position.code           Int32          Q8                1–5
ai_adoption_position.label          String         Q8                decoded
ai_adoption_position.question_code  String                           "Q8"

ai_success.code                     Int32          Q9                1–7
ai_success.label                    String         Q9                decoded
ai_success.question_code            String                           "Q9"

q10.code                            Int32          Q10               1–4
q10.label                           String         Q10               decoded
q10.question_code                   String                           "Q10"

preferred_tsp.code                  Int32          Q28               1–16 → brand name
preferred_tsp.label                 String         Q28               decoded (brand name)
preferred_tsp.question_code         String                           "Q28"

geo_preference.code                 Int32          Q35               coded
geo_preference.label                String         Q35               decoded
geo_preference.question_code        String                           "Q35"

pricing_preference.code             Int32          Q36_Pricing       1–7
pricing_preference.label            String         Q36_Pricing       decoded
pricing_preference.other            String|Null    Q36_Pricingr7oe   raw text
pricing_preference.question_code    String                           "Q36_Pricing"

q38.code / q38.label / q38.question_code   Int32/String/String  Q38  1–5
q39.code / q39.label / q39.question_code   Int32/String/String  Q39  1–9
q41.code / q41.label / q41.question_code   Int32/String/String  Q41  1–11
q43.code / q43.label / q43.question_code   Int32/String/String  Q43  1–5
q44.code / q44.label / q44.question_code   Int32/String/String  Q44  1–6
q45.code / q45.label / q45.question_code   Int32/String/String  Q45  1–5
q48.code / q48.label / q48.question_code   Int32/String/String  Q48  2–5
q49.code / q49.label / q49.question_code   Int32/String/String  Q49  1–9
q50.code / q50.label / q50.question_code   Int32/String/String  Q50  1–7
q50.other                                  String|Null           Q50r5oe  raw text
q52.code / q52.label / q52.question_code   Int32/String/String  Q52  1–4 (cast float→int)
```

**Per-row coded grid (Q5, Q6, Q7 — each row gets one 1–N code):**

```
Field              MongoDB Type   Structure
─────────────────────────────────────────────────────────────────────────────
ai_use_by_area     Array[Object]  13 elements (Q5r1–r13)
  [].area           String         decoded row label from codebook
  [].area_idx       Int32          1–13
  [].code           Int32          1–4
  [].label          String         decoded via codebook
  [].question_code  String         "Q5"

ai_priority_importance  Array[Object]  3 elements (Q6r1–r3)
  [].priority       String
  [].priority_idx   Int32          1–3
  [].code           Int32          1–7
  [].label          String         decoded
  [].question_code  String         "Q6_Area_AIUse"

ai_priority_direction   Array[Object]  3 elements (Q7r1–r3)
  [].priority       String
  [].priority_idx   Int32
  [].code           Int32          1–5
  [].label          String         decoded
  [].question_code  String         "Q7"
```

**Multi-select (binary 0/1 per option → array of selected labels):**

```
Field                       MongoDB Type   Source cols             noanswer col
────────────────────────────────────────────────────────────────────────────────────
tsp_attributes_valued       Array[String]  Q14_Attributesr1–r12    —
tsp_challenges              Array[String]  Q15_Challengesr1–r14    —
tsp_dissuaders              Array[String]  Q16_Dissuader1–r12      —
ai_outcomes                 Array[String]  Q11r1–r13               —
vendor_types_current        Array[String]  Q12r1–r13               —
vendor_types_preferred      Array[String]  Q13r1–r12               —
q13_other                   String|Null    Q13r12oe                raw text
tsp_criteria                Array[String]  Q18r1–r7                —
vendor_selection_factors    Array[String]  Q19r1–r6                —
tsp_confidence_brands       Array[String]  Q21_TSPConfidencer1–r13 —
tsp_unaware_brands          Array[String]  Q22r1–r16               —
tsp_perception_brands       Array[String]  Q23_Perceptionr1–r16    —
sources_of_info             Array[String]  Q37_SourcesofInfor1–r14 —
sources_other               String|Null    Q37_SourcesofInfor14oe  raw text
q29                         Array[String]  Q29r1–r9                noanswerQ29_r8
q30                         Array[String]  Q30r1–r8                —
positioning_q31             Array[String]  Q31_PositioningQsr1–r7  noanswerQ31_PositioningQs_r8
positioning_q32             Array[String]  Q32_PositioningQsr1–r7  —
positioning_q33             Array[String]  Q33_PositioningQsr1–r11 noanswerQ33_PositioningQs_r10
positioning_q34             Array[String]  Q34_PositioningQsr1–r9  —
q42                         Array[String]  Q42r1–r10               —
q42_other                   String|Null    Q42r10oe                raw text
q46                         Array[String]  Q46r1–r18               —
q46_other                   String|Null    Q46r18oe                raw text
```

**Continuous numeric:**

```
Field                  MongoDB Type   Source col     Notes
────────────────────────────────────────────────────────────────
ai_spend_current       Double         Q40            Raw dollar float; no decoding; stored as-is
ai_budget_planned      Int32          Q47            Source column is float64 (Audit R3); cast required — see §8.1
```

### 5.5 `verbatims` field definitions (embedded in respondent doc)

```
Field                         MongoDB Type   Source col           Notes
──────────────────────────────────────────────────────────────────────────────────
unmet_needs.text              String|Null    Q17_UnmetNeeds       Also written to verbatims coll
unmet_needs.char_count        Int32|Null     computed             null if text is null
unmet_needs.question_code     String         constant             "Q17_UnmetNeeds"

unaided_raw.slot_1            String|Null    S8_Unaidedr1oe       Also written to verbatims coll
unaided_raw.slot_2            String|Null    S8_Unaidedr2oe
unaided_raw.slot_3            String|Null    S8_Unaidedr3oe
unaided_raw.slot_4            String|Null    S8_Unaidedr4oe
unaided_raw.slot_5            String|Null    S8_Unaidedr5oe
unaided_raw.question_code     String         constant             "S8_Unaided"

other_specify.industry        String|Null    S4_Industryr28oe
other_specify.function        String|Null    S6_Functionr22oe
other_specify.pricing         String|Null    Q36_Pricingr7oe
other_specify.q13             String|Null    Q13r12oe
other_specify.q15_challenges  String|Null    Q15_Challengesr13oe
other_specify.q16_dissuade    String|Null    Q16_Dissuader12oe
other_specify.q21_confidence  String|Null    Q21_TSPConfidencer13oe
other_specify.q29             String|Null    Q29r9oe
other_specify.q33             String|Null    Q33_PositioningQsr11oe
other_specify.q37_sources     String|Null    Q37_SourcesofInfor14oe
other_specify.q42             String|Null    Q42r10oe
other_specify.q46             String|Null    Q46r18oe
other_specify.q50             String|Null    Q50r5oe
```

Null-fill all empty other_specify fields. Do not omit absent fields; null is
preferable to missing keys for consistent document shape.

### 5.6 `_meta` field definitions

```
Field                  MongoDB Type   Source col     Notes
────────────────────────────────────────────────────────────────────────
completion_time_sec    Double         qtime           Survey completion duration
start_date             Date           start_date      Parse from "MM/DD/YYYY HH:MM" string
panel_list             Int32          list            Panel list assignment
vlist                  Int32          vlist           Secondary list field (may = list)
dropout_flag           Int32          vdropout        0 = completed
os                     String|Null    vos
browser                String|Null    vbrowser
mobile_device          String|Null    vmobiledevice
mobile_os              String|Null    vmobileos
quota_markers          String         markers         Raw comma-separated quota token string
respondent_status.code Int32          status          Always 3 (Qualified) in this import
respondent_status.label String        status          "Qualified"
```

Fields `source`, `decLang`, `userAgent`, `dcua`, `url`, `session`, `tk`, `hQ1`,
`EmpSizeCheck`, `vos`, `vbrowser`, `vosr15oe`, `vbrowserr15oe` are low-value paradata.
Include the device/browser strings; omit `userAgent`, `dcua`, `url`, `session`, `tk`,
`hQ1`, `EmpSizeCheck` from the document to avoid bloat.

### 5.7 `_provenance` field definitions

```
Field              MongoDB Type   Value
────────────────────────────────────────────────────────────
source_file        String         "Cognizant_Raw_Data.xlsx"
sheet              String         "A1"
import_batch_id    ObjectId       from import_batches._id
imported_at        Date           ETL run timestamp (UTC)
schema_version     String         "1.0"
```

---

## 6. Collection: `verbatims`

One document per non-null open-ended response. Two question sources in this dataset:
- `Q17_UnmetNeeds` (up to 561 docs)
- `S8_Unaided` slots r1oe–r5oe (up to 1,230 docs; one per non-null slot)

### Document schema

```
Field                          MongoDB Type   Notes
───────────────────────────────────────────────────────────────────────────
_id                            ObjectId       auto-generated
respondent_uuid                String         FK → respondents._id
question_code                  String         "Q17_UnmetNeeds" or "S8_Unaided"
question_label                 String         human-readable name
slot                           Int32|Null     1–5 for S8; null for Q17
text                           String         raw response text
text_normalised                String|Null    null at import; filled by enrichment pass
char_count                     Int32
word_count                     Int32

respondent_snapshot            Object         denormalised; no join needed for filtering
  industry.code                Int32
  industry.label               String
  emp_count.code               Int32
  emp_count.label              String
  revenue.code                 Int32
  revenue.label                String
  seniority.code               Int32
  seniority.label              String
  decision_involvement.code    Int32
  decision_involvement.label   String
  current_brands               Array[String]
  ai_maturity_code             Int32

analysis                       Object         populated by downstream passes
  embedding_model              String|Null    null at import
  embedding                    Array|Null     null at import; populated by embedding pass
  themes                       Array[String]  null at import
  sentiment                    String|Null    null at import
  resolved_brand               String|Null    S8 only; populated by normalisation pass
  resolution_method            String|Null    S8 only
  flagged                      Boolean        false at import
  claim_ids                    Array[ObjectId] empty at import

_provenance                    Object
  source_file                  String
  sheet                        String
  original_column              String         e.g. "Q17_UnmetNeeds", "S8_Unaidedr1oe"
  import_batch_id              ObjectId
  imported_at                  Date
```

---

## 7. Collection: `import_batches`

```
Field               MongoDB Type   Notes
────────────────────────────────────────────────────────────
_id                 ObjectId       auto-generated
batch_label         String         e.g. "initial-load-2026-03-25"
started_at          Date
completed_at        Date|Null      null until finished
status              String         "running" | "completed" | "failed"

source_files        Array[Object]
  filename          String
  sheet             String
  row_count         Int32
  md5               String         file hash for change detection

counts              Object
  codebook_inserted   Int32
  respondents_inserted Int32
  verbatims_inserted  Int32
  errors              Int32

schema_version      String         "1.0"
script_version      String
notes               String
```

---

## 8. ETL transformation rules by question family

### 8.1 Single-coded scalar

**Source:** One integer column (e.g. `S1_HQ`, `Q4`, `Q28`)
**Target:** `{"code": int, "label": str, "question_code": str}`

```
rule:
  read raw_value = df[col]
  assert raw_value is not NaN (all status=3 respondents must have profile answers)
  code = int(raw_value)
  label = codebook.answer_codes[question_code][str(code)]
  write {"code": code, "label": label, "question_code": qcode}

special case Q52:
  raw_value is float64 (e.g. 1.0, 2.0, 3.0, 4.0)
  cast to int before all other processing

special case Q47 (ai_budget_planned):
  raw_value is float64 in source (Audit R3; confirmed same risk as Q52)
  step 1 — read:     raw = df["Q47"]   (will be float64, e.g. 4500.0)
  step 2 — validate: assert raw == int(raw), f"Q47 fractional value {raw} for respondent {uuid} — halt ETL"
  step 3 — cast:     ai_budget_planned = int(raw)
  Q40 (ai_spend_current) is stored as Double with no cast required.
```

### 8.2 Multi-select (binary 0/1 per column)

**Source:** N columns each named `{base}r{idx}` with values 0 or 1
**Target:** `Array[String]` of decoded labels for checked items

```
rule:
  selected = []
  for each sub-item (r1…rN) in order:
    if df["{base}r{idx}"] == 1:
      label = codebook.sub_items[idx].label
      selected.append(label)

  handle noanswer columns:
    # Datamap inspection confirmed: noanswerQ29_r8, noanswerQ31_PositioningQs_r8, and
    # noanswerQ33_PositioningQs_r10 appear as sub-items under a "noanswer: No Answer"
    # variable block in the Datamap (rows 1290–1292). Each has the label
    # "None of the above" (trailing portion of the full question text in col C).
    # These are NOT sub-items of their parent question's codebook entry — they live
    # in a separate noanswer block. Use the hardcoded label "None of the above"
    # for all three; do not attempt a codebook lookup on the parent question.
    if "noanswer{base}_{col}" column exists and value == 1:
      selected.append("None of the above")   # intentional hardcode; confirmed from Datamap

  write selected  (empty list if none checked, never null)
```

### 8.3 Per-row coded grid (Q5, Q6, Q7)

**Source:** N columns each named `{base}r{idx}` with coded integer values 1–N
**Target:** `Array[Object]` with one element per row item

```
rule:
  rows = []
  for each sub-item (r1…rN):
    raw = df["{base}r{idx}"]
    if raw is NaN: skip (question not applicable to this respondent)
    row_label = codebook.sub_items[idx].label
    code = int(raw)
    label = codebook.answer_codes[qcode][str(code)]
    rows.append({
      "area": row_label,          (or "priority" for Q6/Q7)
      "area_idx": idx,
      "code": code,
      "label": label,
      "question_code": qcode
    })

  # Guard: Q5 expects 13 rows, Q6/Q7 expect 3 rows. NaN rows are skipped above.
  # If the resulting list is empty, that is a data error — do not write silently.
  assert len(rows) > 0, f"{qcode} produced zero rows for respondent {uuid} — halt ETL"
  # Optionally warn (not halt) if len(rows) < expected count to surface partial data.
  write rows
```

### 8.4 Brand exposure gate

**Source:** `pipedBrandsr1`–`r16` (integers 0 or 1)
**Used by:** All brand_scores construction (§8.5–§8.9)

```
rule:
  for brand_idx in 1..16:
    shown = bool(df["pipedBrandsr{brand_idx}"] == 1)
    # This single flag gates ALL brand question families
    # pipedBrands ≡ familiarBrands ≡ S9_Aided codes 1-4 (verified equivalence)
```

### 8.5 Q1 / Q2 / Q3 brand ratings (coded 1–7)

**Source:** `Q1_TSP_Nowr{n}`, `Q2_TSP_2yrsAgor{n}`, `Q3_TSP_2yrsfromnowr{n}`
**Target:** `brand_scores[n].tsp_rating_now` etc.

```
rule:
  for each brand (idx 1..16):
    shown = gate[brand_idx]
    for qcode, col_template in [
        ("Q1_TSP_Now",       "Q1_TSP_Nowr{n}"),
        ("Q2_TSP_2yrsAgo",   "Q2_TSP_2yrsAgor{n}"),
        ("Q3_TSP_2yrsfromnow", "Q3_TSP_2yrsfromnowr{n}")
    ]:
      raw = df[col_template.format(n=brand_idx)]

      if not shown:
        assert raw is NaN                       ← validation: piped=0 must have null values
        write {"response_status": "not_shown", "code": null, "label": null, "question_code": qcode}

      else:  # shown = true
        assert raw is not NaN                   ← validation: piped=1 must have value; halt if fails
        code = int(raw)
        assert code in {1,2,3,4,5,6,7}          ← validation: must be valid scale code
        label = codebook.answer_codes[qcode][str(code)]
        write {"response_status": "answered", "code": code, "label": label, "question_code": qcode}
```

### 8.6 Q20 brand category perception (binary 0/1 per column)

**Source:** `Q20r{brand_idx}c{cat_idx}` (values 0 or 1)
**Target:** `brand_scores[n].brand_category_perception`

```
rule:
  for each brand (idx 1..16):
    shown = gate[brand_idx]

    if not shown:
      # Verify all 7 category columns are NaN
      for cat_idx in 1..7:
        assert df["Q20r{brand_idx}c{cat_idx}"] is NaN   ← validation
      write {"response_status": "not_shown", "selected_categories": null, "question_code": "Q20"}

    else:
      # Verify all 7 category columns are non-NaN
      for cat_idx in 1..7:
        assert df["Q20r{brand_idx}c{cat_idx}"] is not NaN  ← validation

      selected = []
      cat_labels = ["Cloud infrastructure company", "Software-as-a-service (SaaS) provider",
                    "Management consultancy", "Technology consultancy",
                    "IT services firm", "AI startup", "AI model company"]
      for cat_idx in 1..7:
        if int(df["Q20r{brand_idx}c{cat_idx}"]) == 1:
          selected.append(cat_labels[cat_idx - 1])

      write {"response_status": "answered", "selected_categories": selected, "question_code": "Q20"}
```

### 8.7 Q24 brand attribute ratings (direct scale -3 to +3)

**Source:** `Q24_BrandAttributeRatings_Lr{attr_idx}r{brand_idx}`
**Target:** `brand_scores[n].attribute_ratings[12 elements]`

```
attr_labels = {
  1: "Industry domain expertise",
  2: "Innovation & thought leadership",
  3: "Proven AI case studies",
  4: "Pricing",
  5: "Implementation speed",
  6: "Institutional knowledge",
  7: "Ecosystem partnerships",
  8: "Solution customisation",
  9: "Collaboration & cultural fit",
  10: "Strategic consulting",
  11: "Geographic presence",
  12: "Talent & quality"
}

rule:
  for each brand (idx 1..16):
    shown = gate[brand_idx]
    attributes = []

    for attr_idx in 1..12:
      col = "Q24_BrandAttributeRatings_Lr{attr_idx}r{brand_idx}"
      raw = df[col]
      qcode = "Q24_BrandAttributeRatings_Lr{attr_idx}"

      if not shown:
        assert raw is NaN                        ← validation: piped=0 must have null
        attributes.append({
          "attribute":       attr_labels[attr_idx],
          "attribute_idx":   attr_idx,
          "response_status": "not_shown",
          "value":           null,
          "question_code":   qcode
        })

      elif raw is NaN:  # shown=true, NaN is normal for Q24
        attributes.append({
          "attribute":       attr_labels[attr_idx],
          "attribute_idx":   attr_idx,
          "response_status": "not_answered",
          "value":           null,
          "question_code":   qcode
        })

      else:  # shown=true, value present
        value = int(raw)
        assert value in {-3, -2, -1, 0, 1, 2, 3}  ← validation: must be valid scale point
        attributes.append({
          "attribute":       attr_labels[attr_idx],
          "attribute_idx":   attr_idx,
          "response_status": "answered",
          "value":           value,
          "question_code":   qcode
        })

    write attributes to brand_scores[n].attribute_ratings
```

### 8.8 Q25 / Q26 ranking (direct integer 1–6)

**Source:** `Q25_Rank2yrsAgor{n}`, `Q26_Rank2yrsfromNowr{n}`
**Target:** `brand_scores[n].rank_2yrs_ago`, `brand_scores[n].rank_2yrs_future`

```
rule:
  for each brand (idx 1..16):
    shown = gate[brand_idx]
    for qcode, col_template in [
        ("Q25_Rank2yrsAgo",     "Q25_Rank2yrsAgor{n}"),
        ("Q26_Rank2yrsfromNow", "Q26_Rank2yrsfromNowr{n}")
    ]:
      raw = df[col_template.format(n=brand_idx)]

      if not shown:
        assert raw is NaN                          ← validation
        write {"response_status": "not_shown", "rank": null, "question_code": qcode}

      else:
        assert raw is not NaN                      ← validation: piped=1 must have rank; halt if fails
        rank = int(raw)                            # cast float64 to int
        assert rank in {1, 2, 3, 4, 5, 6}          ← validation
        write {"response_status": "answered", "rank": rank, "question_code": qcode}
```

### 8.9 Q27 purchase intent (coded 1–6)

Same structure as Q1/Q2/Q3 rules (§8.5) but:
- Column template: `Q27_PurchaseIntentr{n}`
- Scale: 1–6 ("0 – No chance whatsoever" → "5 – Almost certainly")
- Decode via codebook

```
rule:
  identical to §8.5 with:
    col_template = "Q27_PurchaseIntentr{n}"
    qcode = "Q27_PurchaseIntent"
    valid_codes = {1, 2, 3, 4, 5, 6}
    (no "not_answered" state; assert non-null when shown)
```

### 8.10 Brand awareness block

```
unaided_mentions_raw:
  slots = [df["S8_Unaidedr1oe"], df["S8_Unaidedr2oe"], ..., df["S8_Unaidedr5oe"]]
  write [str(v).strip() for v in slots if v is not NaN]
  # NOTE: .strip() is applied here so the collapsed array is clean for brand matching.
  # The verbatims collection (§8.11) stores S8 text WITHOUT stripping — raw, as entered.
  # This is intentional: the verbatims collection preserves the original response for
  # downstream normalisation; brand_awareness.unaided_mentions_raw is the query-ready form.

unaided_cant_think:
  write bool(df["S8_Unaidedr6"] == 1)

aided_familiarity:
  for brand_idx in 1..17:
    code = int(df["S9_Aidedr{brand_idx}"])
    label = codebook.decode("S9_Aided", code)
    append {"brand": brand_name[brand_idx], "brand_idx": brand_idx, "code": code, "label": label, "question_code": "S9_Aided"}

familiar_brands:
  write [brand_name[n] for n in 1..16 if df["familiarBrandsr{n}"] == 1]

current_brands:
  write [brand_name[n] for n in 1..16 if df["currentBrandsr{n}"] == 1]

shown_brands:
  write [brand_name[n] for n in 1..16 if df["pipedBrandsr{n}"] == 1]
```

### 8.11 Verbatim extraction (Step 3)

After all respondent documents are inserted:

```
Q17 verbatims:
  for each respondent doc where verbatims.unmet_needs.text is not null:
    create verbatim doc:
      respondent_uuid = respondent._id
      question_code   = "Q17_UnmetNeeds"
      question_label  = "Unmet needs from technology service providers"
      slot            = null
      text            = verbatims.unmet_needs.text
      char_count      = len(text)
      word_count      = len(text.split())
      respondent_snapshot = {
        industry, emp_count, revenue, seniority, decision_involvement
          ← from respondent.profile (copy codes + labels)
        current_brands  ← from respondent.brand_awareness.current_brands
        ai_maturity_code ← from respondent.responses.ai_maturity.code
      }
      analysis = { all null fields as defined in §6 }
      _provenance.original_column = "Q17_UnmetNeeds"

S8 unaided verbatims:
  for each respondent doc:
    for slot in 1..5:
      text = respondent.verbatims.unaided_raw["slot_{slot}"]
      if text is not null:
        create verbatim doc:
          question_code  = "S8_Unaided"
          question_label = "Unaided brand awareness — technology service providers"
          slot           = slot
          text           = text (raw, uncleaned — NO .strip(); see §8.10 note)
          text_normalised = null
          char_count / word_count = computed
          respondent_snapshot = same fields as Q17
          analysis.resolved_brand     = null
          analysis.resolution_method  = null
          _provenance.original_column = "S8_Unaidedr{slot}oe"
```

---

## 9. Post-import validation rules

Run after Step 2 (respondents) and Step 3 (verbatims). All assertions must pass.
Any failure = **halt and report**. Do not silently continue on data errors.

### V1 — Respondent count

```
assert db.respondents.countDocuments() == 600
```

### V2 — No piped=1 brand with null Q1/Q2/Q3/Q25/Q26/Q27

```
# For each question and each brand position (1..16):
# Find any doc where the brand is shown but the question is unanswered.
# Expected: 0 documents match.

for brand_idx in 1..16:
  assert db.respondents.countDocuments({
    "brand_scores": {
      "$elemMatch": {
        "brand_idx": brand_idx,
        "shown": true,
        "tsp_rating_now.response_status": "not_answered"
      }
    }
  }) == 0

# Repeat for tsp_rating_2yrs_ago, tsp_rating_2yrs_future,
# rank_2yrs_ago, rank_2yrs_future, purchase_intent
```

### V3 — No piped=0 brand with non-null values

```
# For each brand: if shown=false, all numeric scores must be null.
for brand_idx in 1..16:
  assert db.respondents.countDocuments({
    "brand_scores": {
      "$elemMatch": {
        "brand_idx": brand_idx,
        "shown": false,
        "tsp_rating_now.code": { "$ne": null }
      }
    }
  }) == 0
```

### V4 — Q24 values in valid range

```
# No Q24 attribute value outside {-3, -2, -1, 0, 1, 2, 3}
assert db.respondents.countDocuments({
  "brand_scores.attribute_ratings": {
    "$elemMatch": {
      "response_status": "answered",
      "value": { "$not": { "$in": [-3, -2, -1, 0, 1, 2, 3] } }
    }
  }
}) == 0
```

### V5 — Q25/Q26 ranks in valid range

```
assert db.respondents.countDocuments({
  "brand_scores": {
    "$elemMatch": {
      "rank_2yrs_ago.response_status": "answered",
      "rank_2yrs_ago.rank": { "$not": { "$in": [1, 2, 3, 4, 5, 6] } }
    }
  }
}) == 0
# Repeat for rank_2yrs_future
```

### V6 — Shown brand counts match expected distribution

```
# 464 respondents should have exactly 6 brands shown
assert db.respondents.countDocuments({
  "$expr": {
    "$eq": [
      { "$size": { "$filter": { "input": "$brand_scores",
                                "cond": { "$eq": ["$$this.shown", true] } } } },
      6
    ]
  }
}) == 464

# 77 respondents → 4 shown; 42 → 3 shown; 17 → 5 shown
```

### V7 — Verbatim counts

```
assert db.verbatims.countDocuments({ "question_code": "Q17_UnmetNeeds" }) == 561
# S8 unaided: sum of non-null slot counts = 600 + 356 + 185 + 58 + 31 = 1230
assert db.verbatims.countDocuments({ "question_code": "S8_Unaided" }) == 1230
```

### V8 — Unaided cant_think mutual exclusivity

```
# If a respondent checked "can't think of any" (S8_Unaidedr6=1), all text slots must be null.
# A respondent cannot have both cant_think=true and non-null unaided mentions.
assert db.respondents.countDocuments({
  "brand_awareness.unaided_cant_think": true,
  "brand_awareness.unaided_mentions_raw.0": { "$exists": true }
}) == 0
```

### V9 — All codebook entries present

```
# All question families used in ETL must have a codebook entry
required_codes = ["S1_HQ", "S2_EmpCount", "S3_Revenue", "S4_Industry", "S5_Seniority",
                  "S6_Function", "S7", "S9_Aided", "S10_DecisionInvolvement",
                  "S11", "S12", "Q1_TSP_Now", "Q2_TSP_2yrsAgo", "Q3_TSP_2yrsfromnow",
                  "Q4", "Q5", "Q6_Area_AIUse", "Q7", "Q8", "Q9", "Q10",
                  "Q27_PurchaseIntent", "Q28", "Q35", "Q36_Pricing", "Q52"]
for code in required_codes:
  assert db.codebook.countDocuments({"_id": code}) == 1
```

### V10 — Smoke test against known crosstab totals

```
# S1_HQ: 259 respondents = "Headquartered in the U.S. with operations only in the U.S."
# (code 1, verified from crosstab sheet S1_HQ)
assert db.respondents.countDocuments({
  "profile.hq_location.code": 1
}) == 259

# Cognizant shown to 333 respondents
assert db.respondents.countDocuments({
  "brand_scores": { "$elemMatch": { "brand_idx": 1, "shown": true } }
}) == 333

# Q24 Cognizant attr 1 answered: 141 respondents
assert db.respondents.countDocuments({
  "brand_scores": {
    "$elemMatch": {
      "brand_idx": 1,
      "attribute_ratings": {
        "$elemMatch": { "attribute_idx": 1, "response_status": "answered" }
      }
    }
  }
}) == 141
```

---

## 10. Index definitions

Create all indexes **after** bulk insert completes.

### `respondents` collection

```js
// Default unique index (auto-created)
{ "_id": 1 }

// Survey platform cross-reference
{ "record": 1 }

// Primary segment filters — individual field indexes
{ "profile.industry.code":              1 }
{ "profile.emp_count.code":             1 }
{ "profile.revenue.code":               1 }
{ "profile.seniority.code":             1 }
{ "profile.decision_involvement.code":  1 }
{ "profile.ai_adoption_approach.code":  1 }
{ "profile.tsp_engagement_plan.code":   1 }

// Primary compound (matches the two crosstab banner columns)
{ "profile.emp_count.code": 1, "profile.revenue.code": 1 }

// Multi-select profile field
{ "profile.functions": 1 }

// Brand awareness arrays
{ "brand_awareness.current_brands":     1 }
{ "brand_awareness.shown_brands":       1 }
{ "brand_awareness.familiar_brands":    1 }

// Brand scores — enable brand-level $unwind pipelines
{ "brand_scores.brand":       1 }
{ "brand_scores.brand_idx":   1 }

// Brand + shown compound (for denominator filtering)
{ "brand_scores.brand_idx": 1, "brand_scores.shown": 1 }
```

### `verbatims` collection

```js
// Respondent lookup
{ "respondent_uuid": 1 }

// Question-level retrieval
{ "question_code": 1 }

// Segment-filtered verbatim retrieval (most common discourse analysis pattern)
{ "question_code": 1, "respondent_snapshot.industry.code":  1 }
{ "question_code": 1, "respondent_snapshot.emp_count.code": 1 }

// Thematic/flag queries (populated post-import)
{ "analysis.themes":  1 }
{ "analysis.flagged": 1 }

// Note: vector index on "analysis.embedding" is a separate creation step (Atlas Search
// or $vectorSearch); not a standard B-tree index. Create when embeddings are populated.
```

### `codebook` collection

```js
{ "_id":           1 }   // auto
{ "question_type": 1 }
```

### `import_batches` collection

```js
{ "started_at": -1 }
{ "status":      1 }
```

---

## Appendix A — Fields explicitly excluded from import

| Field | Reason |
|-------|--------|
| `S9_Aidedr17` | Control brand; all respondents scored 6 ("never heard of"); no analytical value |
| `hQ1`, `EmpSizeCheck` | Internal survey platform quota validation flags |
| `source`, `decLang` | Empty in this dataset |
| `userAgent`, `dcua`, `url`, `session`, `tk` | Low-value paradata; bloat risk |
| `vosr15oe`, `vbrowserr15oe` | Empty OE paradata fields |
| `Q13r12oe`, `Q15_Challengesr13oe`, `Q16_Dissuader12oe`, `Q21_TSPConfidencer13oe`, `Q29r9oe`, `Q33_PositioningQsr11oe`, `Q37_SourcesofInfor14oe`, `Q42r10oe`, `Q46r18oe` | All empty in this dataset; stored as `null` in `verbatims.other_specify` |

---

## Appendix B — Fields stored as-is (no decoding)

| Field | MongoDB type | Note |
|-------|-------------|------|
| `Q40` | Double | Raw dollar value |
| `Q47` | Int32 | Raw spend integer |
| `Q51` | String | Job title free text |
| `Q17_UnmetNeeds` | String | Verbatim free text |
| `S8_Unaidedr1oe`–`r5oe` | String | Unaided brand names (dirty; normalisation is a separate pass) |
| `markers` | String | Raw quota token string |
| `start_date` | Date | Parsed from string; stored as BSON Date |
| `qtime` | Double | Seconds; stored as-is |
