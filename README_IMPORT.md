# Survey Intelligence — ETL Import Guide

Transforms `data/raw/Cognizant_Raw_Data.xlsx` into four JSON files ready for
`mongoimport`. Source files are **never modified**.

---

## Quick start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Dry-run: transform + validate, no files written
python scripts/import_survey_data.py --dry-run

# 3. Full run: write output to data/processed/
python scripts/import_survey_data.py
```

---

## Output files

| File | Collection | Docs | Notes |
|------|-----------|------|-------|
| `data/processed/codebook.json` | `codebook` | ~180 | Parsed from Datamap sheet |
| `data/processed/respondents.json` | `respondents` | 600 | One doc per respondent |
| `data/processed/verbatims.json` | `verbatims` | ~1,791 | Q17 + S8 unaided slots |
| `data/processed/import_batches.json` | `import_batches` | 1 | Audit/provenance record |

---

## Importing to MongoDB

```bash
# Replace <uri> with your MongoDB connection string.
# --jsonArray is required because each file is a JSON array.

mongoimport --uri "<uri>" --db survey_intelligence \
  --collection codebook     --jsonArray --file data/processed/codebook.json
mongoimport --uri "<uri>" --db survey_intelligence \
  --collection respondents  --jsonArray --file data/processed/respondents.json
mongoimport --uri "<uri>" --db survey_intelligence \
  --collection verbatims    --jsonArray --file data/processed/verbatims.json
mongoimport --uri "<uri>" --db survey_intelligence \
  --collection import_batches --jsonArray --file data/processed/import_batches.json
```

Import order matters: `codebook` first (respondent ETL reads it), then the rest.

---

## Validation rules (V1–V10)

The script runs all 10 validation checks automatically and prints a summary.

| Rule | Check | Expected |
|------|-------|---------|
| V1 | Respondent count | 600 |
| V2 | No shown brand with null Q1/Q2/Q3/Q25/Q26/Q27 | 0 violations |
| V3 | No not-shown brand with non-null values | 0 violations |
| V4 | Q24 attribute values in −3 to +3 | 0 out-of-range |
| V5 | Q25/Q26 ranks in 1–6 | 0 out-of-range |
| V6 | Brand exposure distribution (3→42, 4→77, 5→17, 6→464) | exact match |
| V7 | Verbatim counts (Q17=561, S8=1230) | exact match |
| V8 | `unaided_cant_think=true` → no unaided text slots | 0 violations |
| V9 | All 25 required codebook entries present | all present |
| V10 | Smoke tests vs. crosstab totals | see below |

V10 smoke tests: `S1_HQ=1 → 259 respondents`, `Cognizant shown → 333`,
`Q24 Cognizant attribute 1 answered → 141`.

Exit code 2 if any validation fails.

---

## Key schema decisions

- `brand_scores` is always **16 elements** (r1–r16). Not-shown brands have
  `shown: false` and all sub-fields null — never omitted.
- Q24 uses **three states** per attribute: `not_shown` / `not_answered` / `answered`.
  All other brand questions use two states: `not_shown` / `answered`.
- Q24 values are direct integers `−3..+3`. **`−1` is a valid scale point**, not a sentinel.
- Q25/Q26 values are direct ranks `1–6`. Q27 is coded `1–6` and decoded via codebook.
- Multi-select noanswer columns (`noanswerQ29_r8` etc.) map to the hardcoded label
  `"None of the above"` (confirmed from Datamap rows 1290–1292).
- `unaided_mentions_raw` in `brand_awareness` applies `.strip()` for query cleanliness.
  S8 verbatim `text` in the `verbatims` collection is stored raw/uncleaned for the
  downstream normalisation pass.
- Q47 (`ai_budget_planned`) is cast `float → int` with a fractional-value guard; ETL
  halts if a non-whole-number value is encountered.

For full detail see `IMPLEMENTATION_PLAN.md`, `MONGODB_SCHEMA_MISSINGNESS.md`,
and `SAMPLE_DOCUMENT_SHAPES.md`.

---

## Dry-run output example

```
────────────────────────────────────────────────────────────
  Cognizant Survey Intelligence — ETL
  [DRY RUN — no files written]
────────────────────────────────────────────────────────────

  Source : data/raw/Cognizant_Raw_Data.xlsx
  MD5    : a3f8c2d1e4b70916...
  Batch  : 3e4f1a2b-...

  Loading sheets …
  Datamap : 1768 rows × 3 cols
  A1      : 600 rows × 813 cols

  Step 1 — Parsing Datamap …
  Codebook entries: 187

  Step 2 — Transforming 600 respondents …
  Respondents built : 600

  Step 3 — Extracting verbatims …
  Q17 verbatims : 561
  S8 verbatims  : 1230

  Step 5 — Running V1–V10 validations …

════════════════════════════════════════════════════════════
VALIDATION SUMMARY
════════════════════════════════════════════════════════════
  ✓  V1  Respondent count                    600 respondents ✓
  ✓  V2  No shown-brand null Q1/Q2/Q3/…      0 violations ✓
  ✓  V3  No not-shown brand with non-null…   0 violations ✓
  ✓  V4  Q24 value range (-3 to +3)          0 out-of-range values ✓
  ✓  V5  Q25/Q26 rank range (1–6)            0 out-of-range ranks ✓
  ✓  V6  Brand exposure distribution         3→42, 4→77, 5→17, 6→464 ✓
  ✓  V7  Verbatim counts                     Q17=561, S8=1230 ✓
  ✓  V8  cant_think ↔ empty unaided_…       0 violations ✓
  ✓  V9  Codebook completeness               All 25 required entries present ✓
  ✓  V10 Smoke tests (crosstab cross-checks) S1_HQ=1→259, Cognizant→333, Q24→141 ✓
════════════════════════════════════════════════════════════
  RESULT: ALL CHECKS PASSED — ready for mongoimport
════════════════════════════════════════════════════════════
```

---

## Design references

| Document | Role |
|----------|------|
| `IMPLEMENTATION_PLAN.md` | Canonical ETL rules, field definitions, validation specs |
| `SAMPLE_DOCUMENT_SHAPES.md` | Concrete example JSON for each collection |
| `MONGODB_SCHEMA_MISSINGNESS.md` | Three-state missingness model for brand data |
| `DATASET_AUDIT.md` | Source file inventory, risks, anomalies |
| `PRECODE_CHECKLIST.md` | Pre-code review; all 4 blockers resolved before coding |
