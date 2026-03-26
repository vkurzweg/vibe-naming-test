# Survey Intelligence — Import & Verify Guide

End-to-end steps: set environment → import data → create indexes → verify.

---

## Prerequisites

| Tool | Minimum version | Install |
|------|----------------|---------|
| `mongoimport` | 100.5.0 | [MongoDB Database Tools](https://www.mongodb.com/try/download/database-tools) |
| `mongosh` | 1.6.0 | [MongoDB Shell](https://www.mongodb.com/try/download/shell) |

Check versions:
```bash
mongoimport --version
mongosh --version
```

---

## Step 1 — Set environment variables

```bash
export MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/"
export MONGODB_DATABASE="survey_intelligence"
```

> **Atlas users:** copy the connection string from Atlas → Connect → Drivers.
> Append a trailing `/` if your string doesn't already end with one.

---

## Step 2 — Run the ETL (if not already done)

Only required if `data/processed/` files are missing or stale.

```bash
# Dry-run first (no files written, validations printed)
python3 scripts/import_survey_data.py --dry-run

# Full run — writes four JSON files to data/processed/
python3 scripts/import_survey_data.py
```

Expected output files:

| File | Docs |
|------|------|
| `data/processed/codebook.json` | 133 |
| `data/processed/respondents.json` | 600 |
| `data/processed/verbatims.json` | 1,791 |
| `data/processed/import_batches.json` | 1 |

---

## Step 3 — Import to MongoDB

```bash
bash scripts/mongoimport_all.sh
```

The script:
- Validates `MONGODB_URI` and `MONGODB_DATABASE` are set (exits 1 if not)
- Validates all four source files exist (exits 1 if any missing)
- Imports in the required order: **codebook → respondents → verbatims → import_batches**

To re-import (drop existing collections first):

```bash
mongosh "${MONGODB_URI}/${MONGODB_DATABASE}" --eval "
  db.codebook.drop();
  db.respondents.drop();
  db.verbatims.drop();
  db.import_batches.drop();
"
bash scripts/mongoimport_all.sh
```

---

## Step 4 — Create indexes

```bash
mongosh "${MONGODB_URI}/${MONGODB_DATABASE}" \
  --file scripts/create_indexes.js
```

This creates B-tree indexes on:

**codebook** — `variable_code` (unique), `question_type`

**respondents** — `profile.hq_location.code`, `profile.emp_count.code`,
`profile.revenue.code`, `profile.industry.code`, `profile.seniority.code`,
`profile.decision_involvement.code`, `brand_awareness.shown_brands`,
`brand_awareness.current_brands`, `responses.ai_maturity.code`,
`_provenance.import_batch_id`

**verbatims** — `respondent_uuid`, `question_code`,
`question_code + slot` (compound), `respondent_snapshot.industry`,
`respondent_snapshot.seniority`, `respondent_snapshot.emp_count`,
`analysis.resolved_brand`, `analysis.flagged`, `_provenance.import_batch_id`

**import_batches** — `status`, `started_at` (descending)

> **Deferred:** the vector index on `verbatims.analysis.embedding` must be
> created via Atlas UI or Atlas CLI *after* the downstream normalisation pass
> populates embeddings. See Atlas → Search → Create Index → Vector Search.

---

## Step 5 — Verify

```bash
mongosh "${MONGODB_URI}/${MONGODB_DATABASE}" \
  --file scripts/verify_import.js
```

### Expected output

```
════════════════════════════════════════════════════════════
  Cognizant Survey Intelligence — Import Verification
  Database: survey_intelligence
════════════════════════════════════════════════════════════

── Collection counts ────────────────────────────────────────
  ✓  respondents count   →  600
  ✓  import_batches count  →  1
  ✓  verbatims count     →  1791 (≥ 1791)
  ✓  codebook count      →  133 (≥ 25)

── V10 smoke tests (crosstab cross-checks) ──────────────────
  ✓  S1_HQ=1 (US HQ) count               →  259
  ✓  Cognizant shown count                →  333
  ✓  Q24 Cognizant attr_1 answered        →  141

── Verbatim question split ──────────────────────────────────
  ✓  Q17 verbatims count  →  561
  ✓  S8 verbatims count   →  1230

── Duplicate respondent UUIDs ───────────────────────────────
  ✓  Duplicate respondent UUIDs  →  0

── Brand_scores structure ───────────────────────────────────
  ✓  Respondents with brand_scores ≠ 16 entries       →  0
  ✓  Brand_scores entries with attribute_ratings ≠ 12  →  0
  ✓  Shown brands with not_shown attribute rating       →  0
  ✓  Not-shown brands with answered attribute rating    →  0

── Import batch record ──────────────────────────────────────
  ✓  batch status                →  completed
  ✓  batch respondents_inserted  →  600
  ✓  batch verbatims_inserted    →  1791
  ✓  batch errors                →  0

════════════════════════════════════════════════════════════
  RESULT: ALL CHECKS PASSED
════════════════════════════════════════════════════════════
```

### Using verify in CI

`mongosh` does not propagate a JS-level exit code, so check the summary line:

```bash
mongosh "${MONGODB_URI}/${MONGODB_DATABASE}" \
  --file scripts/verify_import.js \
  | tee /dev/stderr \
  | grep -q "ALL CHECKS PASSED"
```

---

## Quick reference — all commands in order

```bash
# 1. Environment
export MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/"
export MONGODB_DATABASE="survey_intelligence"

# 2. ETL (skip if data/processed/ files are current)
python3 scripts/import_survey_data.py

# 3. Import
bash scripts/mongoimport_all.sh

# 4. Indexes
mongosh "${MONGODB_URI}/${MONGODB_DATABASE}" --file scripts/create_indexes.js

# 5. Verify
mongosh "${MONGODB_URI}/${MONGODB_DATABASE}" --file scripts/verify_import.js
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `MONGODB_URI is not set` | Env var missing | `export MONGODB_URI="..."` |
| `Required file not found` | ETL not run | `python3 scripts/import_survey_data.py` |
| `mongoimport not found` | Tools not installed | Install [Database Tools](https://www.mongodb.com/try/download/database-tools) |
| `mongosh not found` | Shell not installed | Install [mongosh](https://www.mongodb.com/try/download/shell) |
| Cognizant shown count ≠ 333 | Partial import or re-import without drop | Drop collections and re-run import |
| Duplicate UUID check fails | Import run twice without drop | Drop `respondents` and re-run import |
| Atlas auth error | Wrong credentials or IP not allowlisted | Check Atlas Network Access + credentials |
