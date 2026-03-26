# Dataset Audit — Cognizant Survey Intelligence

**Audit date:** 2026-03-25
**Auditor:** Claude Code (claude-sonnet-4-6)
**Source files (immutable):**
- `data/raw/Cognizant_Raw_Data.xlsx`
- `data/raw/Cognizant_Crosstabs_AllQuestionsWithOpenEnds.xlsx`

---

## 1. File & Sheet Inventory

### `Cognizant_Raw_Data.xlsx` — 2 sheets

| Sheet | Type | Rows | Columns |
|-------|------|------|---------|
| `A1` | Respondent-level raw data | 600 respondents | 813 variables |
| `Datamap` | Variable codebook / label map | 1,768 rows | 3 columns |

### `Cognizant_Crosstabs_AllQuestionsWithOpenEnds.xlsx` — 75 sheets

| Category | Sheets | Description |
|----------|--------|-------------|
| Screening / demographics | `S1_HQ`, `S2_EmpCount`, `S3_Revenue`, `S4_Industry`, `S5_Seniority`, `S6_Function`, `S7`, `S9_Aided`, `familiarBrands`, `currentBrands`, `pipedBrands`, `S10_DecisionInvolvement`, `S11`, `S12` | Quota / firmographic crosstabs |
| Main survey questions | `Q1_TSP_Now` … `Q50` (with gaps) | Crosstab tables for each question |
| Brand attribute detail | `Q24_BrandAttributeRatings_Lr1` … `_Lr12` | One sheet per attribute label (12 total) |
| Rank summary | `BrandAttributes_Ranks` | Mean scores + ordinal rank columns |
| Open-ended verbatims | `S8_Unaided_Awareness`, `Q17_Unment_Needs` | Raw free-text responses, one row per respondent |
| Atypical crosstab | `Q35` | Single-question, appears as a standalone crosstab with no TOC entry |
| Table of contents | `Sheet_Contents` | 277-row index of all crosstab ranges |

---

## 2. Sheet Classification

| Sheet | Classification | Notes |
|-------|---------------|-------|
| `A1` | **Respondent-level raw data** | Primary import target |
| `Datamap` | **Codebook / label map** | Must be parsed to decode all coded values |
| `S8_Unaided_Awareness` (Crosstabs) | **Open-ended responses** | Unaided brand mentions; cols 2–6 per respondent |
| `Q17_Unment_Needs` (Crosstabs) | **Open-ended responses** | Full verbatim: unmet needs; 561 non-null |
| All other Crosstabs sheets | **Pre-aggregated crosstabs** | Percentages + raw counts, banner-column layout; not respondent-level |
| `Sheet_Contents` | **Metadata / index** | Maps sheet names to cell ranges for each table type |

---

## 3. Respondent ID Fields

Two candidate identifiers exist in `A1`:

| Field | Type | Uniqueness | Notes |
|-------|------|-----------|-------|
| `record` | Integer | 600/600 unique | Sequential survey platform record number; not contiguous (gaps observed: 7, 12, 13, 16, 17…) |
| `uuid` | String | 600/600 unique | Platform-generated UUID (e.g. `5wyz442eaecekd4s`); preferred as stable primary key for MongoDB `_id` |

**Recommendation:** Use `uuid` as `_id`. Store `record` as a secondary indexed field for cross-referencing crosstab counts.

---

## 4. Question-Code Patterns

All column names in `A1` follow one of six patterns:

| Pattern | Example columns | Meaning |
|---------|----------------|---------|
| `Qn` | `Q4`, `Q8`, `Q28` | Single-response question |
| `Qn_LabelrX` | `Q1_TSP_Nowr1`, `S5_Seniority` | Grid/matrix row X within question n; `rX` = row item |
| `Qn_LabelrXcY` | `Q20r1c1`, `Q20r3c7` | Two-dimensional grid; `rX` = row, `cY` = column |
| `Qn_Label_LrZrX` | `Q24_BrandAttributeRatings_Lr1r1` | Nested label: attribute dimension Z (`Lr1`–`Lr12`), brand row X |
| `*oe` | `S8_Unaidedr1oe`, `Q17_UnmetNeeds`, `Q36_Pricingr7oe` | Open-text field (verbatim or other-specify) |
| `noanswerQn_*` | `noanswerQ29_r8`, `noanswerQ31_PositioningQs_r8` | Explicit "none of the above" / no-answer flag (0/1 integer) |

**Admin/paradata columns** at the end of `A1`:
`vlist`, `qtime`, `vos`, `vbrowser`, `vmobiledevice`, `vmobileos`, `start_date`, `vdropout`, `source`, `decLang`, `list`, `userAgent`, `dcua`, `url`, `session`, `tk`, `markers`, `status`

---

## 5. Datamap Structure

The `Datamap` sheet has **3 columns (no header row)**:

| Column | Role | Format |
|--------|------|--------|
| `col[0]` | Variable/question header | `[varname]: question text` when starting a new variable block; otherwise `Open text response`, `Open numeric response`, `Values: X-Y`, or NaN |
| `col[1]` | Answer code **or** sub-item variable code | Numeric string (e.g. `'1'`, `'2'`) for answer codes; bracketed code (e.g. `[S6_Functionr1]`) for grid sub-items; NaN on header rows |
| `col[2]` | Answer label **or** sub-item label | Human-readable text for the code in `col[1]` |

**Parsing rules confirmed from inspection:**
- A row where `col[0]` matches `\[varname\]: …` is a variable header.
- Rows immediately following with `col[0] = "Values: X-Y"` describe the scale range.
- Rows where `col[0]` is NaN and `col[1]` is numeric string → answer code → answer label mapping.
- Rows where `col[0]` is NaN and `col[1]` is `[varname]` format → identifies the sub-item label for grid columns (e.g. brand names for `Q1_TSP_Nowr1`).
- Rows where `col[0]` is `"Open text response"` or `"Open numeric response"` indicate no code mapping needed.

---

## 6. Coded Values Requiring Label Mapping

Every field listed below stores **integer codes** whose meaning is defined in the Datamap. All must be decoded for human-readable display.

| Variable(s) | Scale / Value range | Example labels |
|-------------|--------------------|----|
| `status` | 1–4 | Terminated / Overquota / Qualified / Partial |
| `S1_HQ` | 1–5 | HQ in US only … I'm not sure |
| `S2_EmpCount` | 1–9 | Less than 10 … I'm not sure |
| `S3_Revenue` | 1–13 | Pre-revenue … Over $10 billion |
| `S4_Industry` | 1–28 | Agriculture … Other |
| `S5_Seniority` | 1–6 | C-suite … None of the above |
| `S7` | 1–2 | Yes / No |
| `S9_Aidedr1`–`r17` | 1–6 | Currently using … Never heard of |
| `S10_DecisionInvolvement` | 1–5 | Final decision maker … Not involved |
| `S11` | 1–6 | All in-house … No AI activities |
| `S12` | 1–5 | Currently working with provider … No plans |
| `Q1_TSP_Nowr1`–`r16` | 1–7 | -3 Worst in class … +3 Best in class |
| `Q2_TSP_2yrsAgor1`–`r16` | 1–7 | Same scale as Q1 |
| `Q3_TSP_2yrsfromnowr1`–`r16` | 1–7 | Same scale as Q1 |
| `Q4` | 1–10 | 1 Just beginning … 10 Highly advanced |
| `Q5r1`–`r13` | 1–4 | Currently using AI … Will not use AI |
| `Q6_Area_AIUser1`–`r3` | 1–7 | 1 Not important at all … 7 Extremely important |
| `Q7r1`–`r3` | 1–5 | Decrease significantly … Increase significantly |
| `Q8` | 1–5 | Leader … Significantly behind |
| `Q9` | 1–7 | Highly successful … Not started yet |
| `Q10` | 1–4 | (confirmed coded; labels in Datamap rows 409+) |
| `Q28` | 1–16 | Brand selection (maps to 16 TSP brands) |
| `Q35` | coded | Geographic preference for TSP employees |
| `Q36_Pricing` | 1–7 | Pricing model preference |
| `Q38`–`Q45` | various | All confirmed coded integers 1–N |
| `Q48`–`Q50` | coded | Confirmed integers; labels in Datamap |
| `Q52` | 1–4 | Coded (dtype float64 despite small integer range) |

---

## 7. Multi-Select Questions

These questions use **one binary column per answer option** (`0` = unchecked, `1` = checked). Each group should be modelled as an array of selected option labels in MongoDB.

| Question group | Columns | Options | Sub-item labels from Datamap |
|---------------|---------|---------|------------------------------|
| `S6_Function` | `S6_Functionr1`–`r22` | 22 options | Executive/Senior Leadership … Other |
| `S8_Unaided` | `S8_Unaidedr1`–`r6` | 6 slots | Brand 1–5 + "Can't think of any" (coded 0/1); verbatims in `*oe` cols |
| `familiarBrands` | `familiarBrandsr1`–`r16` | 16 brands | Cognizant … AWS |
| `currentBrands` | `currentBrandsr1`–`r16` | 16 brands | Same brand list |
| `pipedBrands` | `pipedBrandsr1`–`r16` | 16 brands | Same brand list (survey-piped brands) |
| `Q11` | `Q11r1`–`r13` | 13 options | (confirmed 0/1 from Datamap) |
| `Q12` | `Q12r1`–`r13` | 13 options | (confirmed 0/1 from Datamap) |
| `Q13` | `Q13r1`–`r12` + `r12oe` | 12 options | (confirmed 0/1 from Datamap) |
| `Q14_Attributes` | `Q14_Attributesr1`–`r12` | 12 options | (confirmed 0/1 from Datamap) |
| `Q15_Challenges` | `Q15_Challengesr1`–`r14` | 14 options | (confirmed 0/1 from Datamap) |
| `Q16_Dissuade` | `Q16_Dissuader1`–`r12` | 12 options | (confirmed 0/1 from Datamap) |
| `Q18` | `Q18r1`–`r7` | 7 options | |
| `Q19` | `Q19r1`–`r6` | 6 options | |
| `Q21_TSPConfidence` | `Q21_TSPConfidencer1`–`r13` | 13 options | |
| `Q22` | `Q22r1`–`r16` | 16 options | |
| `Q23_Perception` | `Q23_Perceptionr1`–`r16` | 16 options | |
| `Q29` | `Q29r1`–`r9` + `noanswerQ29_r8` | 9 options | |
| `Q30` | `Q30r1`–`r8` | 8 options | |
| `Q31_PositioningQs` | `Q31_PositioningQsr1`–`r7` + `noanswer` | 7 options | |
| `Q32_PositioningQs` | `Q32_PositioningQsr1`–`r7` | 7 options | |
| `Q33_PositioningQs` | `Q33_PositioningQsr1`–`r11` + `noanswer` | 11 options | |
| `Q34_PositioningQs` | `Q34_PositioningQsr1`–`r9` | 9 options | |
| `Q37_SourcesofInfo` | `Q37_SourcesofInfor1`–`r14` | 14 options | |
| `Q42` | `Q42r1`–`r10` | 10 options | |
| `Q46` | `Q46r1`–`r18` | 18 options | |

---

## 8. Grid / Matrix Questions

These use `rXcY` column naming (row × column). Each cell holds a coded response value.

| Question | Column range | Dimensions | Scale |
|----------|-------------|------------|-------|
| `Q20` | `Q20r1c1`–`Q20r16c7` | 16 rows × 7 columns | 0/1 binary per cell |

The `Q20` grid (16 rows × 7 cols = 112 columns) is the only `rXcY` structure confirmed in this dataset.

---

## 9. Brand-Level Rating Grid (Q24)

`Q24_BrandAttributeRatings` uses a combined naming: `Q24_BrandAttributeRatings_LrZrX` where `Z` = attribute dimension (1–12) and `X` = brand (1–16).

- **Dimensions (Lr1–Lr12):** 12 distinct brand attributes (industry domain expertise, etc.; full labels in Datamap)
- **Brands (r1–r16):** Same 16-brand list as the rest of the survey
- **Scale:** -3 to +3 (stored as integers: -3, -2, -1, 0, 1, 2, 3); additionally -1 appears as a sentinel (likely "not qualified to rate" / not shown)
- **Sparsity:** High — each respondent only rates brands they are familiar with; expect 70–85% NaN per cell

This produces **192 columns** (12 attrs × 16 brands). In MongoDB, these should be modelled as a nested object: `brand_ratings[brand_name][attribute_name] = score`.

---

## 10. Ranking Questions

| Question | Columns | Values observed | Notes |
|----------|---------|----------------|-------|
| `Q25_Rank2yrsAgo` | `r1`–`r16` | 1–6 (float) | Rank assigned per brand; sparse |
| `Q26_Rank2yrsfromNow` | `r1`–`r16` | 1–6 (float) | Same structure |
| `Q27_PurchaseIntent` | `r1`–`r16` | Coded (integer) | Per-brand purchase intent rating |

Values 1–6 in rank questions likely mean rank position; NaN means brand was not ranked by this respondent.

---

## 11. Open-Text Fields

| Field | Location | Response count | Content type |
|-------|----------|---------------|--------------|
| `S8_Unaidedr1oe`–`r5oe` | `A1` cols 041–045 | 600 / 356 / 185 / 58 / 31 | Unaided brand mentions (free text, user-typed brand names) |
| `Q17_UnmetNeeds` | `A1` col 264 | 561 | Full verbatim: unmet needs in AI services |
| `Q51` | `A1` col 811 | 559 | Job title (free text) |
| `S6_Functionr22oe` | `A1` col 033 | 1 | "Other" function specify |
| `Q36_Pricingr7oe` | `A1` col 733 | 1 | "Other" pricing model specify |
| `Q50r5oe` | `A1` col 792 | 5 | "Other" specify |
| `S4_Industryr28oe` | `A1` col 009 | 0 | "Other" industry specify (empty) |
| `Q13r12oe`, `Q15_Challengesr13oe`, `Q16_Dissuader12oe`, `Q21_TSPConfidencer13oe`, `Q29r9oe`, `Q33_PositioningQsr11oe`, `Q37_SourcesofInfor14oe`, `Q42r10oe`, `Q46r18oe`, `vosr15oe`, `vbrowserr15oe` | `A1` | 0 each | "Other" specify fields — all empty in this dataset |

**Open-end sheets in Crosstabs (verbatim dumps, not aggregated):**
- `S8_Unaided_Awareness`: 600 rows × 5 OE columns; cols 2–6 map to `S8_Unaidedr1oe`–`r5oe`; cols 0–1 are empty. This duplicates data already in `A1`.
- `Q17_Unment_Needs`: 601 rows × 1 OE column (col 2 = `Q17_UnmetNeeds`); row 0 is a header. Duplicates `A1`.

---

## 12. Anomalous / Special Fields

| Field | Values | Interpretation |
|-------|--------|---------------|
| `Q40` | Raw floats: 100,000 – multi-million | Likely annual spend in dollars (continuous numeric, not coded) |
| `Q47` | Integers: 1,000 – 180,000 | Likely annual spend or budget in thousands; not a code scale |
| `qtime` | Float (seconds) | Survey completion time; 600 unique values; paradata |
| `vlist` / `list` | Integer 1–10 | Survey panel/list assignment; 8 values each |
| `hQ1`, `EmpSizeCheck` | Internal flags | Quota/validation checks; likely not needed in respondent docs |
| `markers` | Long string | Comma-separated quota bucket tokens; e.g. `qualified,/Industry Quota/MCKKK,/Total/Total` |
| `Q52` | Float 1.0–4.0 | Stored as float64 despite being 4-value coded scale; will need casting |
| `Q28` | 1–16 | Single-response but 16 values = one of 16 brands; maps to brand list |

---

## 13. Crosstab Structure (for reference)

Each crosstab sheet follows this layout (confirmed on `S1_HQ`, `Q1_TSP_Now`, `Q24_BrandAttributeRatings_Lr1`):

- **Row 0:** Question text (col 0 and col 23 — left block = percentages/means, right block = counts)
- **Row 3:** Banner column headers: `Total`, `WAM`, `5,000+ employees`, `$1B+ Revenue` (and brand-specific banners for Q24)
- **Row 4:** Sample sizes (N=600, N=154, N=300, N=148)
- **Rows 5+:** Answer stubs (col 0) with percentage/mean values in cols 1–4, repeated as raw counts in cols 24–27
- **`WAM`** = Weighted Arithmetic Mean (or Weighted Average Mean) — a computed summary measure, not a segment filter
- **`Sheet_Contents`** maps each sheet+table-type combination to its exact Excel cell ranges (useful for selective extraction if needed)

---

## 14. Risks and Ambiguities

### R1 — Datamap is not a tidy table
The `Datamap` is a human-readable codebook in a mixed-format layout (3 cols, no headers, implicit block structure). It must be **custom-parsed** to build a machine-readable lookup. It cannot be read with a simple `read_excel(..., header=0)`.

### R2 — Q24 brand rating scale includes a sentinel value
`Q24_BrandAttributeRatings_Lr1r1` has observed value `-1.0` in addition to the declared scale of `-3` to `+3`. The declared scale in the Datamap is `Values: -3 to +3`; the `-1` may be a valid scale point but could also indicate "skipped / not shown." Requires clarification before normalising.

### R3 — Q40 and Q47 are raw numeric, not coded
Unlike all other question fields, `Q40` and `Q47` store continuous numeric values (dollar amounts). They have no Datamap label mapping and must be stored as numerics, not decoded.

### R4 — Open-end verbatims in Crosstabs duplicate A1
`S8_Unaided_Awareness` and `Q17_Unment_Needs` in the Crosstabs file are verbatim dumps from the same responses already in `A1`. The Crosstabs versions have no respondent ID column (cols 0–1 are empty), making them unlinkable on their own. Import should use `A1` as the source of truth.

### R5 — S8_Unaided verbatim is user-typed brand names (dirty)
`S8_Unaidedr1oe`–`r5oe` contain raw user input: inconsistent capitalisation, typos, and partial names (e.g. `magneto`, `byte technolap`, `Mucrisoft`, `Goigle`, `Deolitte`). These are **not** coded brand IDs and will require normalisation / fuzzy matching if used for brand tracking.

### R6 — Sparse NaN vs. "not asked" vs. "not answered"
NaN appears throughout `A1` for brand-level ratings and rankings. NaN can mean: (a) respondent was not routed to this brand (survey skip logic), (b) respondent chose not to answer, or (c) brand was not in their `pipedBrands` set. The `pipedBrandsr1`–`r16` flags (0/1) indicate which brands each respondent was shown. Any NaN in a rating column for a brand with `pipedBrandsr{n}=1` is a true non-response; NaN for `pipedBrandsr{n}=0` is a routing skip. This distinction matters for correct denominators in analysis.

### R7 — `noanswerQ*` columns are separate from the multi-select group
Three questions have explicit `noanswer` flag columns (`noanswerQ29_r8`, `noanswerQ31_PositioningQs_r8`, `noanswerQ33_PositioningQs_r10`). These are binary flags and should be treated as an additional member of their respective multi-select arrays, not as a separate field.

### R8 — `Q52` stored as float64 despite being a 4-point coded scale
Values are `1.0`, `2.0`, `3.0`, `4.0`. Will require integer casting on import.

### R9 — `record` has gaps (not contiguous)
`record` values are not sequential from 1 to 600 (observed: 7, 12, 13, 16, 17 in first 5 rows). This is normal for survey platforms (disqualified/partial respondents are removed) but means `record` cannot be used as a positional index.

### R10 — `vlist`/`list` duplication
Both `vlist` and `list` contain the same 8-value panel assignment codes. Their difference is unclear without additional documentation. Both may be paradata and can likely be stored as-is without decoding.

### R11 — Crosstabs are pre-aggregated; not a substitute for raw data
All 73 non-OE, non-TOC sheets are percentage/count tables across 4 banner columns. They are useful for QA and segment analysis display but cannot substitute for the respondent-level `A1` data. Import of crosstabs as a separate `crosstabs` collection is possible but lower priority.

---

## 15. Summary of Collections Implied

Based on this audit, the following MongoDB collections are recommended:

| Collection | Source | Primary Key | Notes |
|-----------|--------|-------------|-------|
| `respondents` | `A1` | `uuid` | One document per respondent; all 813 fields decoded + restructured |
| `codebook` | `Datamap` | `variable_code` | Parsed label map; one doc per variable/answer code |
| `crosstabs` | Crosstabs sheets | composite | Pre-aggregated tables; lower priority; useful for caching |

---

## 16. Recommended Next Step

**Do not write import code yet.** Before any ETL, two decisions need to be made:

1. **Agree on the MongoDB document schema for a respondent.** The 813-column flat row should be restructured. Key design choices:
   - Multi-select groups → arrays of selected labels or arrays of `{code, label}` objects
   - Brand grids (Q1/Q2/Q3/Q24/Q25/Q26/Q27) → nested objects keyed by brand name
   - Open-text fields → preserved as-is in a `verbatims` sub-document
   - Paradata (qtime, vlist, markers, etc.) → separate `_meta` sub-document
   - All coded scalars → decoded to their label, with the original code stored alongside

2. **Parse the Datamap into a machine-readable lookup table.** A `codebook` document per variable (including scale, value→label mapping, sub-item labels for grids) is a prerequisite for any decoding step in the import pipeline.

Once the schema is agreed and the codebook is parsed, a single-pass import script can be written to transform `A1` → `respondents` collection.
