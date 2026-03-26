# Pre-code Review Checklist

**Date:** 2026-03-26
**Inputs reviewed:** `IMPLEMENTATION_PLAN.md`, `SAMPLE_DOCUMENT_SHAPES.md`
**Purpose:** Catch blockers before ETL code is written.

---

## 1. Field-name inconsistencies

### ❌ Issue 1-A — `question_code` vs `q` in `responses` scalars

In `IMPLEMENTATION_PLAN.md §5.4`, the field that stores the question code is named
**`.question_code`** for `ai_maturity` but **`.q`** for every other single-coded scalar
(`ai_adoption_position.q`, `ai_success.q`, `q10.q`, `preferred_tsp.q`, `geo_preference.q`,
all q38–q52, and per-row grid items in Q5/Q6/Q7).

`SAMPLE_DOCUMENT_SHAPES.md` faithfully reproduces the inconsistency.

**Risk:** Any query or API layer that reads `responses.ai_maturity.question_code` vs
`responses.ai_adoption_position.q` will need two different key names for the same concept.

**Resolution required before coding:** Pick one name and apply it uniformly across all
`responses` scalars and per-row grid items. Recommendation: use `.question_code` everywhere
to match brand_scores and verbatim documents.

---

### ❌ Issue 1-B — `question_label` string mismatch in verbatims

`IMPLEMENTATION_PLAN.md §8.11` (ETL rule) defines:
- Q17: `question_label = "Unmet needs in AI services"`
- S8: `question_label = "Unaided brand awareness"`

`SAMPLE_DOCUMENT_SHAPES.md §3–§4` shows:
- Q17: `"Unmet needs from technology service providers"`
- S8: `"Unaided brand awareness — technology service providers"`

The ETL will follow §8.11 unless changed. The sample document will not match the produced
documents.

**Resolution required before coding:** Decide on the canonical strings and update §8.11
(or the sample). These are stored as-is and will appear in downstream verbatim queries.

---

## 2. Ambiguous data types

### ❌ Issue 2-A — Q47 float-to-int cast not specified

`IMPLEMENTATION_PLAN.md §5.4` types `ai_budget_planned` as `Int32` and source column Q47 as
"Raw integer; no decoding." However, `DATASET_AUDIT.md Risk R3` flags *both* Q40 and Q47 as
raw numerics that may be stored as float64 in the source file. The ETL rules (§8.1) only
call out Q52 for explicit `float → int` casting.

The sample document shows `"ai_budget_planned": 4500` — an integer — but the source value
may be `4500.0`.

**Resolution required before coding:** Add an explicit cast rule for Q47 matching the Q52
treatment: `int(float(df["Q47"]))`, with a guard that the float has no fractional part.

---

### ✅ No other type ambiguities

`Q40` (Double, no cast needed), `Q52` (float64 → Int32, already called out), all brand
question fields (Int32 or direct int) are unambiguous. `response_status` String enum is
fully specified.

---

## 3. Raw value preservation

### ✅ No gaps identified

All cases where a coded value has a parallel raw value are correctly handled:

| Raw field | Coded companion | Status |
|-----------|----------------|--------|
| `ai_spend_current` (Q40, Double) | `q39` (coded band) | Both captured |
| `ai_budget_planned` (Q47, Int32) | `q45` (coded headcount band) | Both captured |
| `verbatims.unaided_raw.slot_N` (raw slot text) | `brand_awareness.unaided_mentions_raw` (collapsed array) | Both captured |

No additional raw-value capture is needed.

---

## 4. Shapes awkward for MongoDB aggregation

### ⚠️ Note 4-A — Double `$unwind` required for Q24 attribute analysis

`brand_scores` is an array of 16 brand objects. Each brand object contains `attribute_ratings`,
itself an array of 12 attribute objects. Any cross-brand attribute analysis pipeline requires:

```js
{ $unwind: "$brand_scores" }
{ $match:  { "brand_scores.brand": "Cognizant" } }
{ $unwind: "$brand_scores.attribute_ratings" }
{ $match:  { "brand_scores.attribute_ratings.attribute_idx": 1 } }
{ $group:  { ... } }
```

This is a **known and intentional** design (see MONGODB_SCHEMA_PROPOSAL.md §array-vs-dict
decision). It has no query-correctness risk but the ETL author should document it in code
comments so pipeline authors know to always double-unwind for Q24.

No schema change recommended.

---

### ✅ All other shapes are aggregation-friendly

- Brand-level `$unwind → $match → $group` on Q1/Q2/Q3/Q25/Q26/Q27 requires only a single
  unwind.
- `profile.*` fields are flat dot-path queries — no unwind needed.
- `verbatims` collection has `respondent_snapshot` denormalised — no `$lookup` needed for
  standard segment filters.

---

## 5. ETL edge cases not covered by validation rules

### ❌ Edge case 5-A — `noanswerQ*` label source undefined

`IMPLEMENTATION_PLAN.md §8.2` says: if a noanswer column equals 1, "append label from
`codebook.sub_items`." The noanswer columns (`noanswerQ29_r8`, `noanswerQ31_PositioningQs_r8`,
`noanswerQ33_PositioningQs_r10`) are separate columns in the source, not part of the main
grid rows. The Datamap may not list them as sub-items of Q29/Q31/Q33.

**Risk:** Codebook lookup fails at runtime; ETL crashes or silently drops the selection.

**Resolution required before coding:** Inspect whether noanswer items appear in the Datamap.
If not, hardcode their labels (e.g., `"None of the above"`) in the ETL for the affected
questions, and document the hardcode.

---

### ❌ Edge case 5-B — Q47 float cast (see also Issue 2-A)

No validation rule asserts `ai_budget_planned` is a whole number before cast. Add:
```
assert Q47_raw == int(Q47_raw), f"Q47 has fractional value for record {uuid}"
```

---

### ⚠️ Edge case 5-C — `unaided_cant_think` mutual exclusivity not validated

If `S8_Unaidedr6 == 1` (respondent "can't think of any"), slots r1oe–r5oe should all be
null. No validation rule asserts this. A data error here would produce a respondent with
`unaided_cant_think: true` and non-empty `unaided_mentions_raw`.

**Severity:** Low (would not break the ETL), but would corrupt downstream unaided analysis.

**Recommendation:** Add to §9 validation rules:
```
assert db.respondents.countDocuments({
  "brand_awareness.unaided_cant_think": true,
  "brand_awareness.unaided_mentions_raw.0": { "$exists": true }
}) == 0
```

---

### ⚠️ Edge case 5-D — Q5 empty array on all-NaN row

`IMPLEMENTATION_PLAN.md §8.3` silently skips NaN rows in Q5/Q6/Q7. If all 13 Q5 columns
are NaN for a respondent, `ai_use_by_area` writes an empty array `[]` with no error. No
minimum-row-count assertion exists.

**Severity:** Low (unlikely given data is status=3/Qualified), but would silently produce
malformed documents.

**Recommendation:** Add assertion `len(rows) > 0` during ETL row building for Q5, or add a
post-import count: `assert no respondent has len(ai_use_by_area) == 0`.

---

### ⚠️ Edge case 5-E — Whitespace strip applied inconsistently to S8 text

`IMPLEMENTATION_PLAN.md §8.10` strips whitespace from `brand_awareness.unaided_mentions_raw`
(`.strip()` is explicit in the pseudocode). `IMPLEMENTATION_PLAN.md §8.11` stores verbatim
`text` as "raw, uncleaned."

This means the same underlying string could appear stripped in `brand_awareness.unaided_mentions_raw`
but with trailing whitespace in `verbatims.unaided_raw.slot_N` (the respondent-embedded version)
and the `verbatims` collection.

**Severity:** Low; the downstream normalisation pass handles S8 cleaning. But the discrepancy
should be documented as intentional in the ETL code to prevent future "fixes."

---

## Summary

| # | Severity | Must resolve before coding? | Action |
|---|----------|----------------------------|--------|
| 1-A | High | **Yes** | Standardize `.question_code` vs `.q` — pick one |
| 1-B | Medium | **Yes** | Decide canonical `question_label` strings in §8.11 |
| 2-A | Medium | **Yes** | Add explicit float-to-int cast + guard for Q47 |
| 4-A | Info | No | Document double-unwind requirement in ETL comments |
| 5-A | High | **Yes** | Check Datamap for noanswer sub-items; add fallback label |
| 5-B | Medium | **Yes** | Add Q47 fractional-value guard |
| 5-C | Low | No, but add validation rule | Add V-cant_think assertion to §9 |
| 5-D | Low | No, but add assertion | Add min-row-count guard for Q5 array |
| 5-E | Low | No | Document intentional strip inconsistency in ETL comments |

**Blockers before coding: Issues 1-A, 1-B, 2-A, 5-A.**
All four require a one-line decision or a single Datamap check. None require schema changes.

---

## Resolution log — 2026-03-26

All 4 blockers and all 5 lower-severity items resolved. No schema changes were required.

| # | Status | Resolution |
|---|--------|-----------|
| **1-A** | ✅ Resolved | Standardized to `.question_code` throughout. Updated `IMPLEMENTATION_PLAN.md §5.4` (all named scalars and per-row grid fields) and `SAMPLE_DOCUMENT_SHAPES.md` (all `"q": "Q..."` occurrences replaced with `"question_code": "Q..."`). |
| **1-B** | ✅ Resolved | Canonical strings are those in `SAMPLE_DOCUMENT_SHAPES.md`. Updated `IMPLEMENTATION_PLAN.md §8.11` to match: `"Unmet needs from technology service providers"` (Q17) and `"Unaided brand awareness — technology service providers"` (S8). |
| **2-A** | ✅ Resolved | Added explicit 3-step Q47 cast rule to `IMPLEMENTATION_PLAN.md §8.1`: read as float64 → assert no fractional component → cast with `int(raw)`. ETL halts on fractional value. `IMPLEMENTATION_PLAN.md §5.4` continuous numeric block updated to reference §8.1. |
| **4-A** | ✅ Documented | Added double-unwind aggregation note to `IMPLEMENTATION_PLAN.md §5.3` Denominator logic block with example pipeline. |
| **5-A** | ✅ Resolved | Datamap inspection confirmed all three noanswer columns appear as sub-items under a `noanswer: No Answer` variable block (rows 1290–1292), each with label "None of the above." Updated `IMPLEMENTATION_PLAN.md §8.2` to: (a) document the Datamap finding, (b) explicitly hardcode `"None of the above"` rather than attempting a parent-question codebook lookup. |
| **5-B** | ✅ Resolved | Covered by the Q47 cast rule added under 2-A (fractional-value guard is step 2 of the same rule). |
| **5-C** | ✅ Resolved | Added validation rule `V8` to `IMPLEMENTATION_PLAN.md §9`: asserts `cant_think=true` implies `unaided_mentions_raw` is empty. Previous V8/V9 renumbered to V9/V10. |
| **5-D** | ✅ Resolved | Added `assert len(rows) > 0` guard to `IMPLEMENTATION_PLAN.md §8.3` Q5/Q6/Q7 ETL rule with a halt-on-zero-rows error message. |
| **5-E** | ✅ Documented | Added explicit intent comment to `IMPLEMENTATION_PLAN.md §8.10`: `.strip()` is applied to `unaided_mentions_raw` (query-ready form) but S8 verbatim text is stored raw/uncleaned (normalisation-pass form). Cross-reference added in §8.11. |

**All blockers cleared. ETL code may now be written.**
