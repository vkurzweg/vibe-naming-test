#!/usr/bin/env python3
"""
ETL: Cognizant Survey Intelligence — MongoDB Import Pipeline
============================================================

Reads:   data/raw/Cognizant_Raw_Data.xlsx  (never modified)
Writes:  data/processed/codebook.json
         data/processed/respondents.json
         data/processed/verbatims.json
         data/processed/import_batches.json

Usage:
    python scripts/import_survey_data.py             # full run
    python scripts/import_survey_data.py --dry-run   # transform + validate, no write

Implements all rules from IMPLEMENTATION_PLAN.md (V1–V10 validations).
See also: SAMPLE_DOCUMENT_SHAPES.md, MONGODB_SCHEMA_MISSINGNESS.md.

IMPORTANT:  Source files in data/raw/ are NEVER modified.
"""

import argparse
import hashlib
import json
import re
import sys
import uuid as _uuid_module
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd


# ─────────────────────────────────────────────────────────────────────────────
# PATHS
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR   = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
RAW_DIR      = PROJECT_ROOT / "data" / "raw"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
RAW_FILE     = RAW_DIR / "Cognizant_Raw_Data.xlsx"
SCHEMA_VERSION = "1.0"


# ─────────────────────────────────────────────────────────────────────────────
# REFERENCE TABLES  (IMPLEMENTATION_PLAN.md §3)
# ─────────────────────────────────────────────────────────────────────────────

# r17 is the control brand; included in aided_familiarity only, never in brand_scores.
BRAND_NAMES = {
    1:  "Cognizant",
    2:  "Accenture",
    3:  "IBM Consulting",
    4:  "Infosys",
    5:  "Capgemini",
    6:  "Wipro",
    7:  "Tata Consultancy Services (TCS)",
    8:  "EY",
    9:  "HCL Technologies",
    10: "Deloitte",
    11: "McKinsey & Company",
    12: "Google (Cloud & Gemini)",
    13: "DXC Technology",
    14: "ServiceNow",
    15: "Microsoft (Azure & Copilot)",
    16: "Amazon Web Services (AWS)",
    17: "Supercalifragilisticexpialidocious Incorporated",
}

# Q24 attribute labels (Lr-index → short label).  §3.2 / §8.7
Q24_ATTRS = {
    1:  "Industry domain expertise",
    2:  "Innovation & thought leadership",
    3:  "Proven AI case studies",
    4:  "Pricing",
    5:  "Implementation speed",
    6:  "Institutional knowledge",
    7:  "Ecosystem partnerships",
    8:  "Solution customisation",
    9:  "Collaboration & cultural fit",
    10: "Strategic consulting",
    11: "Geographic presence",
    12: "Talent & quality",
}

# Q20 category labels  (c-index → label).  §3.3 / §8.6
Q20_CATS = {
    1: "Cloud infrastructure company",
    2: "Software-as-a-service (SaaS) provider",
    3: "Management consultancy",
    4: "Technology consultancy",
    5: "IT services firm",
    6: "AI startup",
    7: "AI model company",
}

# ── TRUE binary multi-select (0/1 per option → decoded label array) ──────────
# Confirmed binary during ETL debugging: Q15, Q16, Q42, Q46 only.
# Q11–Q14, Q18–Q19, Q21, Q29–Q34, Q37 were originally listed here but inspection
# showed they contain per-row rated/ranked integers (1–N), not 0/1 flags.
# Q22 contains per-brand free text, not binary flags.
# Q23 contains a -1..3 coded scale per brand, not binary.
MULTI_SELECT_SPECS = [
    # (output_field, col_base, last_r_idx, noanswer_col|None)
    ("tsp_challenges",  "Q15_Challengesr", 14,  None),
    ("tsp_dissuaders",  "Q16_Dissuader",   12,  None),
    ("q42",             "Q42r",            10,  None),
    ("q46",             "Q46r",            18,  None),
]

# ── Per-row rated/ranked grids (1–N integer per row, decoded via codebook) ───
# Includes questions that the implementation plan mis-classified as binary.
# Q11–Q14, Q18–Q19, Q21, Q37: 1–7 importance/agreement rating per row item.
# Q29–Q34: 1–N rank per row item (NaN = item not selected / not ranked).
RATED_GRID_SPECS = [
    # (output_field,              col_base,             max_r, qcode,                   allow_empty)
    ("ai_outcomes",              "Q11r",               13, "Q11",                    True),
    ("vendor_types_current",     "Q12r",               13, "Q12",                    True),
    ("vendor_types_preferred",   "Q13r",               12, "Q13",                    True),
    ("tsp_attributes_rated",     "Q14_Attributesr",    12, "Q14_Attributes",         True),
    ("tsp_criteria",             "Q18r",                7, "Q18",                    True),
    ("vendor_selection_factors", "Q19r",                6, "Q19",                    True),
    ("tsp_confidence_rated",     "Q21_TSPConfidencer", 13, "Q21_TSPConfidence",      True),
    ("sources_of_info",          "Q37_SourcesofInfor", 14, "Q37_SourcesofInfo",      True),
    ("q29",                      "Q29r",                9, "Q29",                    True),
    ("q30",                      "Q30r",                8, "Q30",                    True),
    ("positioning_q31",          "Q31_PositioningQsr",  7, "Q31_PositioningQs",      True),
    ("positioning_q32",          "Q32_PositioningQsr",  7, "Q32_PositioningQs",      True),
    ("positioning_q33",          "Q33_PositioningQsr", 11, "Q33_PositioningQs",      True),
    ("positioning_q34",          "Q34_PositioningQsr",  9, "Q34_PositioningQs",      True),
]

# Other-specify fields stored in verbatims.other_specify  (§5.5)
OTHER_SPECIFY_SPECS = [
    ("industry",       "S4_Industryr28oe"),
    ("function",       "S6_Functionr22oe"),
    ("pricing",        "Q36_Pricingr7oe"),
    ("q13",            "Q13r12oe"),
    ("q15_challenges", "Q15_Challengesr13oe"),
    ("q16_dissuade",   "Q16_Dissuader12oe"),
    ("q21_confidence", "Q21_TSPConfidencer13oe"),
    ("q29",            "Q29r9oe"),
    ("q33",            "Q33_PositioningQsr11oe"),
    ("q37_sources",    "Q37_SourcesofInfor14oe"),
    ("q42",            "Q42r10oe"),
    ("q46",            "Q46r18oe"),
    ("q50",            "Q50r5oe"),
]

# Codebook entries that must be present for ETL to proceed  (V9)
REQUIRED_CODEBOOK_CODES = [
    "S1_HQ", "S2_EmpCount", "S3_Revenue", "S4_Industry", "S5_Seniority",
    "S6_Function", "S7", "S9_Aided", "S10_DecisionInvolvement",
    "S11", "S12", "Q1_TSP_Now", "Q2_TSP_2yrsAgo", "Q3_TSP_2yrsfromnow",
    "Q4", "Q5", "Q6_Area_AIUse", "Q7", "Q8", "Q9", "Q10",
    "Q27_PurchaseIntent", "Q28", "Q35", "Q36_Pricing", "Q52",
]

# Smoke-test targets  (V10)
V10_S1_HQ_CODE1_COUNT    = 259   # Headquartered in U.S. only
V10_COGNIZANT_SHOWN      = 333   # Cognizant piped to N respondents
V10_Q24_COGN_ATTR1_ANS   = 141   # Cognizant attribute 1 answered


# ─────────────────────────────────────────────────────────────────────────────
# UTILITIES
# ─────────────────────────────────────────────────────────────────────────────

def is_nan(v):
    """True if v is None or any pandas/numpy NaN sentinel."""
    if v is None:
        return True
    try:
        return bool(pd.isna(v))
    except (TypeError, ValueError):
        return False


def safe_str(v):
    """Return stripped string or None if NaN/empty."""
    if is_nan(v):
        return None
    s = str(v).strip()
    return s if s else None


def cell(df, col_name, idx):
    """Read df[col_name][idx]; None if column missing or value NaN."""
    if col_name not in df.columns:
        return None
    v = df.at[idx, col_name]
    return None if is_nan(v) else v


def to_int(v, label="value"):
    """Cast to int; raise if fractional.  Used for coded scalars."""
    f = float(v)
    if f != int(f):
        raise ValueError(f"{label} has unexpected fractional part: {v!r}")
    return int(f)


def decode(codebook, var_code, code_int):
    """Decode integer → label via codebook.  KeyError on miss."""
    entry = codebook.get(var_code)
    if not entry:
        raise KeyError(f"Codebook missing entry: {var_code!r}")
    codes = entry.get("answer_codes") or {}
    key = str(int(code_int))
    if key not in codes:
        raise KeyError(
            f"Code {code_int!r} not found in {var_code!r}. "
            f"Available codes: {sorted(codes.keys())}"
        )
    return codes[key]


def build_col_label_index(codebook):
    """Flat {column_code: label} from all sub_items in codebook."""
    idx = {}
    for entry in codebook.values():
        for item in (entry.get("sub_items") or []):
            idx[item["column_code"]] = item["label"]
    return idx


def md5_file(path):
    h = hashlib.md5()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def now_utc_str():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def new_batch_id():
    """Return a URL-safe UUID string to serve as batch_id."""
    return str(_uuid_module.uuid4())


# ─────────────────────────────────────────────────────────────────────────────
# STEP 1 — CODEBOOK PARSER   (IMPLEMENTATION_PLAN.md §4, §8.2)
# ─────────────────────────────────────────────────────────────────────────────

def parse_datamap(dm, batch_id):
    """
    Parse the Datamap sheet (3-column non-tidy format) into a dict of
    codebook documents keyed by variable_code.

    Row-type rules (col indices 0 / 1 / 2):
      1. col[0] = "[varname]: text" or "varname: text"  → start new variable
      2. col[0] = "Values: X-Y"                        → scale_min / scale_max
      3. col[0] = "Open text/numeric response"         → question_type override
      4. col[0] NaN, col[1] = "[varname]"              → sub-item row
      5. col[0] NaN, col[1] = numeric string           → answer-code row
      6. all NaN                                        → spacer; skip
    """
    codebook = {}
    current  = None   # accumulator dict for the variable being parsed

    def finalize(var):
        """Infer question_type, emit completed codebook document."""
        if var is None:
            return
        vc = var["variable_code"]
        qt = var.pop("_type_override", None)
        if qt is None:
            has_codes = bool(var["answer_codes"])
            has_items = bool(var["sub_items"])
            if has_codes and has_items:
                qt = "grid_coded"
            elif has_items and not has_codes:
                qt = "multi_select"
            elif has_codes and not has_items:
                qt = "single_coded"
            else:
                qt = "unknown"
        codebook[vc] = {
            "_id":           vc,
            "variable_code": vc,
            "question_text": var["question_text"],
            "question_type": qt,
            "scale_min":     var["scale_min"],
            "scale_max":     var["scale_max"],
            "answer_codes":  var["answer_codes"] or None,
            "sub_items":     var["sub_items"]    or None,
            "_provenance": {
                "source_file":    "Cognizant_Raw_Data.xlsx",
                "sheet":          "Datamap",
                "import_batch_id": batch_id,
            },
        }

    for ri in range(len(dm)):
        row = dm.iloc[ri]
        c0 = None if is_nan(row.iloc[0]) else str(row.iloc[0]).strip()
        c1 = None if is_nan(row.iloc[1]) else str(row.iloc[1]).strip()
        c2 = None if is_nan(row.iloc[2]) else str(row.iloc[2]).strip()

        # Blank spacer row
        if c0 is None and c1 is None and c2 is None:
            continue

        if c0 is not None:
            # OE type markers
            if c0 in ("Open text response", "Open end response"):
                if current:
                    current["_type_override"] = "open_text"
                continue
            if c0 == "Open numeric response":
                if current:
                    current["_type_override"] = "open_numeric"
                continue

            # Scale range: "Values: X-Y"  (handles negative lower bound e.g. -3-3)
            if c0.startswith("Values:"):
                m = re.match(r"Values:\s*(-?\d+)\s*-\s*(-?\d+)", c0)
                if m and current:
                    current["scale_min"] = int(m.group(1))
                    current["scale_max"] = int(m.group(2))
                continue

            # Variable header: "[varname]: ..." or "varname: ..."
            m_br = re.match(r"^\[([^\]]+)\]:\s*(.*)", c0)
            m_pl = re.match(r"^(\S+?):\s+(.*)",       c0)
            if m_br:
                vc = m_br.group(1).strip()
            elif m_pl:
                vc = m_pl.group(1).strip()
            else:
                continue  # unrecognised non-NaN row in col[0]

            finalize(current)
            current = {
                "variable_code":  vc,
                "question_text":  c0,
                "answer_codes":   {},
                "sub_items":      [],
                "scale_min":      None,
                "scale_max":      None,
                "_type_override": None,
            }

        elif c1 is not None:
            if current is None:
                continue
            c2_val = c2 or ""

            # Sub-item row: c1 matches "[varname]" bracket pattern
            if re.match(r"^\[[^\]]+\]$", c1):
                inner = c1[1:-1]  # strip brackets
                current["sub_items"].append({
                    "idx":         len(current["sub_items"]) + 1,
                    "column_code": inner,
                    "label":       c2_val,
                })
            else:
                # Answer-code row: parse c1 as numeric
                try:
                    cf = float(c1)
                    key = str(int(cf)) if cf == int(cf) else c1
                    current["answer_codes"][key] = c2_val
                except ValueError:
                    pass  # non-numeric c1 in col[1]; skip

    finalize(current)  # emit the last variable
    return codebook


# ─────────────────────────────────────────────────────────────────────────────
# STEP 2 — RESPONDENT TRANSFORMER   (IMPLEMENTATION_PLAN.md §5, §8)
# ─────────────────────────────────────────────────────────────────────────────

class RespondentTransformer:
    """
    Transforms one row of the A1 sheet into a respondent document.
    Collects errors (halt-worthy) and warnings (logged but non-fatal).
    """

    def __init__(self, df, codebook, col_label_idx, batch_id, import_ts):
        self.df            = df
        self.codebook      = codebook
        self.cli            = col_label_idx   # flat {column_code → label}
        self.batch_id      = batch_id
        self.import_ts     = import_ts
        self.errors        = []   # populated across all rows
        self.warnings      = []

    # ── public entry point ────────────────────────────────────────────────

    def transform_all(self):
        """Transform every row.  Returns list of respondent docs."""
        docs = []
        for row_idx in self.df.index:
            try:
                doc = self._transform_row(row_idx)
                docs.append(doc)
            except Exception as exc:
                uid = safe_str(cell(self.df, "uuid", row_idx)) or f"row_{row_idx}"
                self.errors.append(f"FATAL row {row_idx} ({uid}): {exc}")
        return docs

    # ── per-row transform ─────────────────────────────────────────────────

    def _transform_row(self, ri):
        df = self.df
        uid = str(df.at[ri, "uuid"])

        # Record number (integer)
        rec_raw = cell(df, "record", ri)
        record  = to_int(rec_raw, "record") if rec_raw is not None else None

        return {
            "_id":            uid,
            "record":         record,
            "schema_version": SCHEMA_VERSION,
            "profile":        self._profile(ri, uid),
            "brand_awareness": self._brand_awareness(ri, uid),
            "brand_scores":   self._brand_scores(ri, uid),
            "responses":      self._responses(ri, uid),
            "verbatims":      self._embedded_verbatims(ri),
            "_meta":          self._meta(ri),
            "_provenance": {
                "source_file":    "Cognizant_Raw_Data.xlsx",
                "sheet":          "A1",
                "import_batch_id": self.batch_id,
                "imported_at":    self.import_ts,
                "schema_version": SCHEMA_VERSION,
            },
        }

    # ── profile  (§5.1) ───────────────────────────────────────────────────

    def _profile(self, ri, uid):
        df  = self.df
        cb  = self.codebook
        cli = self.cli

        def sc(var_code):
            """Single-coded scalar → {code, label, question_code}."""
            v = cell(df, var_code, ri)
            if v is None:
                self.errors.append(f"{uid}: Required profile field {var_code!r} is NaN")
                return {"code": None, "label": None, "question_code": var_code}
            code  = to_int(v, var_code)
            label = decode(cb, var_code, code)
            return {"code": code, "label": label, "question_code": var_code}

        # S6 functions: discover columns at runtime (handles non-contiguous indices)
        fn_pattern = re.compile(r"^S6_Functionr(\d+)$")
        fn_cols = sorted(
            [c for c in df.columns if fn_pattern.match(c)],
            key=lambda c: int(fn_pattern.match(c).group(1))
        )
        functions = []
        for fc in fn_cols:
            v = cell(df, fc, ri)
            if v is not None and to_int(v, fc) == 1:
                lbl = cli.get(fc, fc)   # fall back to column name if not in codebook
                functions.append(lbl)

        return {
            "hq_location":     sc("S1_HQ"),
            "emp_count":       sc("S2_EmpCount"),
            "revenue":         sc("S3_Revenue"),
            "industry": {
                **sc("S4_Industry"),
                "other_specify": safe_str(cell(df, "S4_Industryr28oe", ri)),
            },
            "seniority":           sc("S5_Seniority"),
            "functions":           functions,
            "functions_other_specify": safe_str(cell(df, "S6_Functionr22oe", ri)),
            "works_with_provider": sc("S7"),
            "decision_involvement": sc("S10_DecisionInvolvement"),
            "ai_adoption_approach": sc("S11"),
            "tsp_engagement_plan":  sc("S12"),
            "job_title":           safe_str(cell(df, "Q51", ri)),
        }

    # ── brand_awareness  (§5.2, §8.10) ───────────────────────────────────

    def _brand_awareness(self, ri, uid):
        df = self.df
        cb = self.codebook

        # Unaided mentions: strip() for the collapsed array only.
        # Verbatim text is stored raw/uncleaned in the verbatims collection (§8.11).
        unaided_raw = []
        for slot in range(1, 6):
            v = safe_str(cell(df, f"S8_Unaidedr{slot}oe", ri))
            if v:
                unaided_raw.append(v.strip())

        cant_raw   = cell(df, "S8_Unaidedr6", ri)
        cant_think = (cant_raw is not None and to_int(cant_raw, "S8_Unaidedr6") == 1)

        # r1–r17 aided familiarity (r17 = control brand, included here)
        aided_familiarity = []
        for n in range(1, 18):
            v = cell(df, f"S9_Aidedr{n}", ri)
            if v is not None:
                code  = to_int(v, f"S9_Aidedr{n}")
                label = decode(cb, "S9_Aided", code)
            else:
                code, label = None, None
            aided_familiarity.append({
                "brand":         BRAND_NAMES[n],
                "brand_idx":     n,
                "code":          code,
                "label":         label,
                "question_code": "S9_Aided",
            })

        def flag_list(tmpl):
            return [
                BRAND_NAMES[n] for n in range(1, 17)
                if (lambda v: v is not None and to_int(v, tmpl.format(n=n)) == 1)(
                    cell(df, tmpl.format(n=n), ri)
                )
            ]

        return {
            "unaided_mentions_raw": unaided_raw,
            "unaided_mentions":     None,   # populated by downstream normalisation pass
            "unaided_cant_think":   cant_think,
            "aided_familiarity":    aided_familiarity,
            "familiar_brands":      flag_list("familiarBrandsr{n}"),
            "current_brands":       flag_list("currentBrandsr{n}"),
            "shown_brands":         flag_list("pipedBrandsr{n}"),
        }

    # ── brand_scores  (§5.3, §8.4–§8.9) ──────────────────────────────────

    def _brand_scores(self, ri, uid):
        df = self.df

        # Build exposure gate: shown[brand_idx] = True/False
        shown = {}
        for n in range(1, 17):
            v = cell(df, f"pipedBrandsr{n}", ri)
            shown[n] = (v is not None and to_int(v, f"pipedBrandsr{n}") == 1)

        scores = []
        for n in range(1, 17):
            is_shown = shown[n]
            scores.append({
                "brand":      BRAND_NAMES[n],
                "brand_idx":  n,
                "shown":      is_shown,
                # Q1 / Q2 / Q3  (§8.5)
                "tsp_rating_now":       self._q1q2q3(ri, n, is_shown, uid,
                    f"Q1_TSP_Nowr{n}",        "Q1_TSP_Now"),
                "tsp_rating_2yrs_ago":  self._q1q2q3(ri, n, is_shown, uid,
                    f"Q2_TSP_2yrsAgor{n}",    "Q2_TSP_2yrsAgo"),
                "tsp_rating_2yrs_future": self._q1q2q3(ri, n, is_shown, uid,
                    f"Q3_TSP_2yrsfromnowr{n}", "Q3_TSP_2yrsfromnow"),
                # Q20  (§8.6)
                "brand_category_perception": self._q20(ri, n, is_shown, uid),
                # Q24  (§8.7)
                "attribute_ratings":    self._q24(ri, n, is_shown, uid),
                # Q25 / Q26  (§8.8)
                "rank_2yrs_ago":    self._q25q26(ri, n, is_shown, uid,
                    f"Q25_Rank2yrsAgor{n}",    "Q25_Rank2yrsAgo"),
                "rank_2yrs_future": self._q25q26(ri, n, is_shown, uid,
                    f"Q26_Rank2yrsfromNowr{n}", "Q26_Rank2yrsfromNow"),
                # Q27  (§8.9)
                "purchase_intent":  self._q27(ri, n, is_shown, uid),
            })
        return scores

    def _q1q2q3(self, ri, brand_idx, shown, uid, col_name, qcode):
        """Single brand-question rating.  Two states only: not_shown | answered. §8.5"""
        raw = cell(self.df, col_name, ri)
        if not shown:
            if raw is not None:
                self.warnings.append(
                    f"V3: {uid} {qcode} r{brand_idx}: piped=0 but value={raw!r} (expected NaN)"
                )
            return {"response_status": "not_shown", "code": None, "label": None,
                    "question_code": qcode}

        # shown=True: NaN is a data error — log but continue with placeholder
        if raw is None:
            self.errors.append(
                f"V2 HALT: {uid} {qcode} r{brand_idx}: piped=1 but NaN (data error)"
            )
            return {"response_status": "not_shown", "code": None, "label": None,
                    "question_code": qcode}

        code  = to_int(raw, col_name)
        label = decode(self.codebook, qcode, code)
        return {"response_status": "answered", "code": code, "label": label,
                "question_code": qcode}

    def _q20(self, ri, brand_idx, shown, uid):
        """Q20 brand category perception binary grid.  §8.6"""
        if not shown:
            # Validate all 7 columns are NaN when not shown
            for ci in range(1, 8):
                v = cell(self.df, f"Q20r{brand_idx}c{ci}", ri)
                if v is not None:
                    self.warnings.append(
                        f"V3: {uid} Q20 r{brand_idx}c{ci}: piped=0 but has value {v!r}"
                    )
            return {"response_status": "not_shown", "selected_categories": None,
                    "question_code": "Q20"}

        # shown=True: collect selected categories
        selected = []
        for ci in range(1, 8):
            col_name = f"Q20r{brand_idx}c{ci}"
            v = cell(self.df, col_name, ri)
            if v is None:
                self.errors.append(
                    f"V2 HALT: {uid} Q20 r{brand_idx}c{ci}: piped=1 but NaN (data error)"
                )
                continue
            if to_int(v, col_name) == 1:
                selected.append(Q20_CATS[ci])

        return {"response_status": "answered", "selected_categories": selected,
                "question_code": "Q20"}

    def _q24(self, ri, brand_idx, shown, uid):
        """
        Q24 attribute ratings.  Three states: not_shown | not_answered | answered.
        Values are direct integers -3..+3 (no code/label wrapper).  -1 is valid.  §8.7
        """
        attrs = []
        for lr in range(1, 13):
            col_name = f"Q24_BrandAttributeRatings_Lr{lr}r{brand_idx}"
            qcode    = f"Q24_BrandAttributeRatings_Lr{lr}"
            raw      = cell(self.df, col_name, ri)

            if not shown:
                if raw is not None:
                    self.warnings.append(
                        f"V3: {uid} {qcode} r{brand_idx}: piped=0 but value={raw!r}"
                    )
                attrs.append({
                    "attribute":       Q24_ATTRS[lr],
                    "attribute_idx":   lr,
                    "response_status": "not_shown",
                    "value":           None,
                    "question_code":   qcode,
                })
            elif raw is None:
                # shown=True, NaN = normal non-response for Q24  (C5)
                attrs.append({
                    "attribute":       Q24_ATTRS[lr],
                    "attribute_idx":   lr,
                    "response_status": "not_answered",
                    "value":           None,
                    "question_code":   qcode,
                })
            else:
                value = to_int(raw, col_name)
                if value not in range(-3, 4):  # {-3,-2,-1,0,1,2,3}
                    self.errors.append(
                        f"V4: {uid} {qcode} r{brand_idx}: value {value!r} outside -3..+3"
                    )
                attrs.append({
                    "attribute":       Q24_ATTRS[lr],
                    "attribute_idx":   lr,
                    "response_status": "answered",
                    "value":           value,
                    "question_code":   qcode,
                })
        return attrs

    def _q25q26(self, ri, brand_idx, shown, uid, col_name, qcode):
        """Q25/Q26 direct rank 1–6.  Two states: not_shown | answered.  §8.8"""
        raw = cell(self.df, col_name, ri)
        if not shown:
            if raw is not None:
                self.warnings.append(
                    f"V3: {uid} {qcode} r{brand_idx}: piped=0 but value={raw!r}"
                )
            return {"response_status": "not_shown", "rank": None, "question_code": qcode}

        if raw is None:
            self.errors.append(
                f"V2 HALT: {uid} {qcode} r{brand_idx}: piped=1 but NaN (data error)"
            )
            return {"response_status": "not_shown", "rank": None, "question_code": qcode}

        rank = to_int(raw, col_name)
        if rank not in range(1, 7):
            self.errors.append(
                f"V5: {uid} {qcode} r{brand_idx}: rank {rank!r} outside 1–6"
            )
        return {"response_status": "answered", "rank": rank, "question_code": qcode}

    def _q27(self, ri, brand_idx, shown, uid):
        """Q27 purchase intent, coded 1–6.  Two states: not_shown | answered.  §8.9"""
        col_name = f"Q27_PurchaseIntentr{brand_idx}"
        qcode    = "Q27_PurchaseIntent"
        raw      = cell(self.df, col_name, ri)

        if not shown:
            return {"response_status": "not_shown", "code": None, "label": None,
                    "question_code": qcode}
        if raw is None:
            self.errors.append(
                f"V2 HALT: {uid} {qcode} r{brand_idx}: piped=1 but NaN (data error)"
            )
            return {"response_status": "not_shown", "code": None, "label": None,
                    "question_code": qcode}

        code  = to_int(raw, col_name)
        label = decode(self.codebook, qcode, code)
        return {"response_status": "answered", "code": code, "label": label,
                "question_code": qcode}

    # ── responses  (§5.4, §8.1–§8.3) ─────────────────────────────────────

    def _responses(self, ri, uid):
        df  = self.df
        cb  = self.codebook
        cli = self.cli

        def sc(var_code, question_code=None):
            """Single-coded scalar; None-safe."""
            v = cell(df, var_code, ri)
            if v is None:
                return {"code": None, "label": None,
                        "question_code": question_code or var_code}
            code  = to_int(v, var_code)
            label = decode(cb, question_code or var_code, code)
            return {"code": code, "label": label,
                    "question_code": question_code or var_code}

        def sc_other(var_code, other_col, question_code=None):
            base = sc(var_code, question_code)
            base["other"] = safe_str(cell(df, other_col, ri))
            return base

        # ── per-row coded grids (Q5, Q6, Q7 and rated grids)  §8.3 ─────────
        def grid_rows(col_base, max_r, qcode, row_key="area", idx_key="area_idx",
                      allow_empty=False):
            """Build array of {row_key, idx_key, code, label, question_code}.
            allow_empty=True: no error on all-NaN (normal for rated/ranked grids).
            allow_empty=False: raises ETL error on all-NaN (Q5/Q6/Q7 guard, §8.3).
            Decode falls back to str(code) if no codebook entry (graceful for grids).
            """
            rows = []
            for r in range(1, max_r + 1):
                col_name = f"{col_base}{r}"
                v = cell(df, col_name, ri)
                if v is None:
                    continue  # NaN rows skipped (§8.3)
                row_label = cli.get(col_name, col_name)
                code  = to_int(v, col_name)
                try:
                    label = decode(cb, qcode, code)
                except KeyError:
                    label = str(code)   # graceful fallback for grids with no codebook entry
                rows.append({
                    row_key:        row_label,
                    idx_key:        r,
                    "code":         code,
                    "label":        label,
                    "question_code": qcode,
                })
            # Guard: empty array = data error for Q5/Q6/Q7  (§8.3)
            if not rows and not allow_empty:
                self.errors.append(
                    f"{uid}: {qcode} produced zero rows (all NaN) — check source data"
                )
            return rows

        # ── multi-select  §8.2 ───────────────────────────────────────────
        def multi(col_base, max_r, noanswer_col=None):
            selected = []
            for r in range(1, max_r + 1):
                col_name = f"{col_base}{r}"
                v = cell(df, col_name, ri)
                if v is not None and to_int(v, col_name) == 1:
                    lbl = cli.get(col_name, col_name)
                    selected.append(lbl)
            # noanswer column → hardcoded "None of the above"  (§8.2 — confirmed Datamap)
            if noanswer_col:
                v = cell(df, noanswer_col, ri)
                if v is not None and to_int(v, noanswer_col) == 1:
                    selected.append("None of the above")
            return selected

        # ── Q47 explicit cast with fractional guard  (§8.1 special case) ─
        q47_raw = cell(df, "Q47", ri)
        if q47_raw is not None:
            q47_f = float(q47_raw)
            if q47_f != int(q47_f):
                self.errors.append(
                    f"V-Q47: {uid}: Q47 has fractional value {q47_raw!r} — expected integer"
                )
            ai_budget_planned = int(q47_f)
        else:
            ai_budget_planned = None

        # ── Q52 cast (float64 → int)  §8.1 ───────────────────────────────
        q52_raw = cell(df, "Q52", ri)
        if q52_raw is not None:
            q52_raw = to_int(q52_raw, "Q52")

        responses = {
            # Single-coded scalars
            "ai_maturity":        sc("Q4"),
            "ai_adoption_position": sc("Q8"),
            "ai_success":         sc("Q9"),
            "q10":                sc("Q10"),
            "preferred_tsp":      sc("Q28"),
            "geo_preference":     sc("Q35"),
            "pricing_preference": sc_other("Q36_Pricing", "Q36_Pricingr7oe"),
            "q38":                sc("Q38"),
            "q39":                sc("Q39"),
            "q41":                sc("Q41"),
            "q43":                sc("Q43"),
            "q44":                sc("Q44"),
            "q45":                sc("Q45"),
            "q48":                sc("Q48"),
            "q49":                sc("Q49"),
            "q50":                sc_other("Q50", "Q50r5oe"),
            "q52": (
                {"code": q52_raw,
                 "label": decode(cb, "Q52", q52_raw) if q52_raw is not None else None,
                 "question_code": "Q52"}
                if q52_raw is not None
                else {"code": None, "label": None, "question_code": "Q52"}
            ),

            # Continuous numeric (stored as-is, no code/label wrapper)
            "ai_spend_current":  (float(cell(df, "Q40", ri))
                                  if cell(df, "Q40", ri) is not None else None),
            "ai_budget_planned": ai_budget_planned,

            # Per-row coded grids (Q5/Q6/Q7 — empty = ETL halt)
            "ai_use_by_area":           grid_rows("Q5r", 13, "Q5"),
            # Q6 actual column names are Q6_Area_AIUser{1-3}  (confirmed from source)
            "ai_priority_importance":   grid_rows("Q6_Area_AIUser", 3, "Q6_Area_AIUse",
                                                   "priority", "priority_idx"),
            "ai_priority_direction":    grid_rows("Q7r", 3, "Q7",
                                                   "priority", "priority_idx"),
        }

        # Multi-select fields (truly binary 0/1 per option)
        for (field, col_base, max_r, noanswer_col) in MULTI_SELECT_SPECS:
            responses[field] = multi(col_base, max_r, noanswer_col)

        # Per-row rated/ranked grids (allow_empty=True — normal for these questions)
        for (field, col_base, max_r, qcode, allow_empty) in RATED_GRID_SPECS:
            responses[field] = grid_rows(col_base, max_r, qcode,
                                         row_key="item", idx_key="item_idx",
                                         allow_empty=allow_empty)

        # noanswer flags for Q29/Q31/Q33  (separate columns, hardcoded "None of the above")
        # Source: Datamap rows 1290-1292, variable block noanswer: No Answer  (§8.2)
        def noanswer_flag(col_name):
            v = cell(df, col_name, ri)
            return (v is not None and to_int(v, col_name) == 1)

        responses["q29_noanswer"]             = noanswer_flag("noanswerQ29_r8")
        responses["positioning_q31_noanswer"] = noanswer_flag("noanswerQ31_PositioningQs_r8")
        responses["positioning_q33_noanswer"] = noanswer_flag("noanswerQ33_PositioningQs_r10")

        # Q22 — per-brand open text (word associations, one text slot per shown brand)
        # Q22r{n} matches brand r{n}; only non-null slots are stored
        q22_items = []
        for n in range(1, 17):
            text = safe_str(cell(df, f"Q22r{n}", ri))
            if text is not None:
                q22_items.append({
                    "brand_idx":     n,
                    "brand":         BRAND_NAMES[n],
                    "text":          text,
                    "question_code": "Q22",
                })
        responses["q22_brand_associations"] = q22_items

        # Q23 — per-brand coded scale (-1..3); not binary
        # Q23r{n} matches brand r{n}; only non-null slots are stored
        q23_items = []
        for n in range(1, 17):
            v = cell(df, f"Q23r{n}", ri)
            if v is not None:
                code = to_int(v, f"Q23r{n}")
                q23_items.append({
                    "brand_idx":     n,
                    "brand":         BRAND_NAMES[n],
                    "code":          code,
                    "question_code": "Q23",
                })
        responses["q23"] = q23_items

        # q13_other and q42_other (direct from OTHER_SPECIFY_SPECS won't add these;
        # they live in responses, not verbatims.other_specify)
        responses["q13_other"]   = safe_str(cell(df, "Q13r12oe", ri))
        responses["q42_other"]   = safe_str(cell(df, "Q42r10oe", ri))
        responses["q46_other"]   = safe_str(cell(df, "Q46r18oe", ri))
        responses["sources_other"] = safe_str(cell(df, "Q37_SourcesofInfor14oe", ri))

        return responses

    # ── embedded verbatims  (§5.5) ────────────────────────────────────────

    def _embedded_verbatims(self, ri):
        df = self.df

        q17_text = safe_str(cell(df, "Q17_UnmetNeeds", ri))

        unaided_raw = {
            "slot_1": safe_str(cell(df, "S8_Unaidedr1oe", ri)),
            "slot_2": safe_str(cell(df, "S8_Unaidedr2oe", ri)),
            "slot_3": safe_str(cell(df, "S8_Unaidedr3oe", ri)),
            "slot_4": safe_str(cell(df, "S8_Unaidedr4oe", ri)),
            "slot_5": safe_str(cell(df, "S8_Unaidedr5oe", ri)),
            "question_code": "S8_Unaided",
        }

        other_specify = {}
        for key, src_col in OTHER_SPECIFY_SPECS:
            other_specify[key] = safe_str(cell(df, src_col, ri))

        return {
            "unmet_needs": {
                "text":          q17_text,
                "char_count":    len(q17_text) if q17_text else None,
                "question_code": "Q17_UnmetNeeds",
            },
            "unaided_raw":     unaided_raw,
            "other_specify":   other_specify,
        }

    # ── _meta  (§5.6) ─────────────────────────────────────────────────────

    def _meta(self, ri):
        df = self.df

        # Parse start_date: "MM/DD/YYYY HH:MM" → ISO string
        start_raw = safe_str(cell(df, "start_date", ri))
        if start_raw:
            try:
                dt = datetime.strptime(start_raw, "%m/%d/%Y %H:%M")
                start_date = dt.strftime("%Y-%m-%dT%H:%M:%S.000Z")
            except ValueError:
                start_date = start_raw  # store as-is if format unexpected
        else:
            start_date = None

        # completion time
        qtime_raw = cell(df, "qtime", ri)
        qtime     = float(qtime_raw) if qtime_raw is not None else None

        # panel/vlist
        list_raw  = cell(df, "list", ri)
        vlist_raw = cell(df, "vlist", ri)

        # status
        status_raw = cell(df, "status", ri)
        status_code = to_int(status_raw, "status") if status_raw is not None else None

        return {
            "completion_time_sec": qtime,
            "start_date":          start_date,
            "panel_list":          to_int(list_raw,  "list")  if list_raw  is not None else None,
            "vlist":               to_int(vlist_raw, "vlist") if vlist_raw is not None else None,
            "dropout_flag":        to_int(cell(df, "vdropout", ri), "vdropout")
                                   if cell(df, "vdropout", ri) is not None else None,
            "os":                  safe_str(cell(df, "vos", ri)),
            "browser":             safe_str(cell(df, "vbrowser", ri)),
            "mobile_device":       safe_str(cell(df, "vmobiledevice", ri)),
            "mobile_os":           safe_str(cell(df, "vmobileos", ri)),
            "quota_markers":       safe_str(cell(df, "markers", ri)),
            "respondent_status": {
                "code":  status_code,
                "label": "Qualified" if status_code == 3 else str(status_code),
            },
        }


# ─────────────────────────────────────────────────────────────────────────────
# STEP 3 — VERBATIM EXTRACTOR   (IMPLEMENTATION_PLAN.md §6, §8.11)
# ─────────────────────────────────────────────────────────────────────────────

def extract_verbatims(respondents, batch_id, import_ts):
    """
    Build verbatim documents from transformed respondent docs.
    Two sources: Q17_UnmetNeeds and S8_Unaided slots 1–5.
    Verbatim text is stored without .strip() — raw as entered.  (§8.11)
    """
    verbatims = []

    for resp in respondents:
        uid      = resp["_id"]
        snap     = _build_snapshot(resp)
        base_prov = {
            "source_file":    "Cognizant_Raw_Data.xlsx",
            "sheet":          "A1",
            "import_batch_id": batch_id,
            "imported_at":    import_ts,
        }

        # ── Q17 ──────────────────────────────────────────────────────────
        q17 = resp["verbatims"]["unmet_needs"]
        if q17["text"] is not None:
            text = q17["text"]
            verbatims.append({
                "_id":              str(_uuid_module.uuid4()),
                "respondent_uuid":  uid,
                "question_code":    "Q17_UnmetNeeds",
                "question_label":   "Unmet needs from technology service providers",
                "slot":             None,
                "text":             text,   # raw, no extra strip here
                "text_normalised":  None,
                "char_count":       len(text),
                "word_count":       len(text.split()),
                "respondent_snapshot": snap,
                "analysis": _empty_analysis(),
                "_provenance": {**base_prov, "original_column": "Q17_UnmetNeeds"},
            })

        # ── S8 unaided (slots 1–5) ────────────────────────────────────────
        unaided = resp["verbatims"]["unaided_raw"]
        for slot in range(1, 6):
            text = unaided.get(f"slot_{slot}")
            if text is not None:
                verbatims.append({
                    "_id":              str(_uuid_module.uuid4()),
                    "respondent_uuid":  uid,
                    "question_code":    "S8_Unaided",
                    "question_label":   "Unaided brand awareness — technology service providers",
                    "slot":             slot,
                    "text":             text,   # raw, uncleaned — no .strip()
                    "text_normalised":  None,
                    "char_count":       len(text),
                    "word_count":       len(text.split()),
                    "respondent_snapshot": snap,
                    "analysis": _empty_analysis(),
                    "_provenance": {
                        **base_prov,
                        "original_column": f"S8_Unaidedr{slot}oe",
                    },
                })

    return verbatims


def _build_snapshot(resp):
    """Denormalised respondent_snapshot for join-free verbatim queries."""
    prof = resp.get("profile", {})
    return {
        "industry":            prof.get("industry",  {}).get("code"), # stored as int only for brevity; add label below
        "industry_label":      prof.get("industry",  {}).get("label"),
        "emp_count":           prof.get("emp_count", {}).get("code"),
        "emp_count_label":     prof.get("emp_count", {}).get("label"),
        "revenue":             prof.get("revenue",   {}).get("code"),
        "revenue_label":       prof.get("revenue",   {}).get("label"),
        "seniority":           prof.get("seniority", {}).get("code"),
        "seniority_label":     prof.get("seniority", {}).get("label"),
        "decision_involvement": prof.get("decision_involvement", {}).get("code"),
        "decision_involvement_label": prof.get("decision_involvement", {}).get("label"),
        "current_brands":      resp.get("brand_awareness", {}).get("current_brands", []),
        "ai_maturity_code":    (resp.get("responses", {}).get("ai_maturity") or {}).get("code"),
    }


def _empty_analysis():
    return {
        "embedding_model":   None,
        "embedding":         None,
        "themes":            [],
        "sentiment":         None,
        "resolved_brand":    None,
        "resolution_method": None,
        "flagged":           False,
        "claim_ids":         [],
    }


# ─────────────────────────────────────────────────────────────────────────────
# STEP 4 — IMPORT BATCH DOCUMENT   (IMPLEMENTATION_PLAN.md §7)
# ─────────────────────────────────────────────────────────────────────────────

def build_import_batch(batch_id, started_at, completed_at, counts, script_version="0.1.0"):
    return {
        "_id":         batch_id,
        "batch_label": f"initial-load-{started_at[:10]}",
        "started_at":  started_at,
        "completed_at": completed_at,
        "status":      "completed",
        "source_files": [
            {
                "filename":  "Cognizant_Raw_Data.xlsx",
                "sheet":     "A1",
                "row_count": counts.get("a1_rows", 0),
                "md5":       counts.get("md5", ""),
            },
            {
                "filename":  "Cognizant_Raw_Data.xlsx",
                "sheet":     "Datamap",
                "row_count": counts.get("dm_rows", 0),
                "md5":       counts.get("md5", ""),
            },
        ],
        "counts": {
            "codebook_inserted":    counts.get("codebook", 0),
            "respondents_inserted": counts.get("respondents", 0),
            "verbatims_inserted":   counts.get("verbatims", 0),
            "errors":               counts.get("errors", 0),
        },
        "schema_version": SCHEMA_VERSION,
        "script_version": script_version,
        "notes":          "Initial load from Cognizant survey wave Oct 2025.",
    }


# ─────────────────────────────────────────────────────────────────────────────
# VALIDATION  V1–V10   (IMPLEMENTATION_PLAN.md §9)
# ─────────────────────────────────────────────────────────────────────────────

class ValidationResult:
    def __init__(self, name):
        self.name       = name
        self.passed     = True
        self.message    = "OK"
        self.violations = []

    def fail(self, msg, violations=None):
        self.passed     = False
        self.message    = msg
        self.violations = violations or []


def validate_all(codebook, respondents, verbatims):
    """Run V1–V10. Returns list of ValidationResult."""
    results = []

    # V1 — Respondent count
    r = ValidationResult("V1  Respondent count")
    n = len(respondents)
    if n != 600:
        r.fail(f"Expected 600, got {n}")
    else:
        r.message = f"{n} respondents ✓"
    results.append(r)

    # V2 — No shown brand with not_answered on Q1/Q2/Q3/Q25/Q26/Q27
    r = ValidationResult("V2  No shown-brand null Q1/Q2/Q3/Q25/Q26/Q27")
    fields = ["tsp_rating_now", "tsp_rating_2yrs_ago", "tsp_rating_2yrs_future",
              "rank_2yrs_ago", "rank_2yrs_future", "purchase_intent"]
    v2_viols = []
    for resp in respondents:
        for bs in resp.get("brand_scores", []):
            if bs["shown"]:
                for f in fields:
                    if bs[f]["response_status"] == "not_answered":
                        v2_viols.append(f"{resp['_id']} brand={bs['brand']} field={f}")
    if v2_viols:
        r.fail(f"{len(v2_viols)} violations", v2_viols[:10])
    else:
        r.message = "0 violations ✓"
    results.append(r)

    # V3 — No not-shown brand with non-null code values
    r = ValidationResult("V3  No not-shown brand with non-null values")
    v3_viols = []
    for resp in respondents:
        for bs in resp.get("brand_scores", []):
            if not bs["shown"]:
                for f in ["tsp_rating_now", "tsp_rating_2yrs_ago", "tsp_rating_2yrs_future",
                          "purchase_intent"]:
                    if bs[f].get("code") is not None:
                        v3_viols.append(f"{resp['_id']} brand={bs['brand']} field={f}")
                for f in ["rank_2yrs_ago", "rank_2yrs_future"]:
                    if bs[f].get("rank") is not None:
                        v3_viols.append(f"{resp['_id']} brand={bs['brand']} field={f}")
    if v3_viols:
        r.fail(f"{len(v3_viols)} violations", v3_viols[:10])
    else:
        r.message = "0 violations ✓"
    results.append(r)

    # V4 — Q24 values in {-3..+3}
    r = ValidationResult("V4  Q24 value range (-3 to +3)")
    v4_viols = []
    for resp in respondents:
        for bs in resp.get("brand_scores", []):
            for attr in bs.get("attribute_ratings", []):
                if attr["response_status"] == "answered":
                    v = attr["value"]
                    if v not in range(-3, 4):
                        v4_viols.append(
                            f"{resp['_id']} brand={bs['brand']} attr={attr['attribute_idx']} v={v}"
                        )
    if v4_viols:
        r.fail(f"{len(v4_viols)} out-of-range values", v4_viols[:10])
    else:
        r.message = "0 out-of-range values ✓"
    results.append(r)

    # V5 — Q25/Q26 ranks in {1..6}
    r = ValidationResult("V5  Q25/Q26 rank range (1–6)")
    v5_viols = []
    for resp in respondents:
        for bs in resp.get("brand_scores", []):
            for fld in ["rank_2yrs_ago", "rank_2yrs_future"]:
                if bs[fld]["response_status"] == "answered":
                    rk = bs[fld]["rank"]
                    if rk not in range(1, 7):
                        v5_viols.append(
                            f"{resp['_id']} brand={bs['brand']} {fld}={rk}"
                        )
    if v5_viols:
        r.fail(f"{len(v5_viols)} out-of-range ranks", v5_viols[:10])
    else:
        r.message = "0 out-of-range ranks ✓"
    results.append(r)

    # V6 — Brand exposure distribution (3→42, 4→77, 5→17, 6→464)
    r = ValidationResult("V6  Brand exposure distribution")
    dist = defaultdict(int)
    for resp in respondents:
        n_shown = sum(1 for bs in resp.get("brand_scores", []) if bs["shown"])
        dist[n_shown] += 1
    expected = {3: 42, 4: 77, 5: 17, 6: 464}
    mismatches = [f"{k} shown: expected {expected[k]}, got {dist[k]}"
                  for k in expected if dist[k] != expected[k]]
    if mismatches:
        r.fail(f"{len(mismatches)} distribution mismatches", mismatches)
    else:
        r.message = f"3→{dist[3]}, 4→{dist[4]}, 5→{dist[5]}, 6→{dist[6]} ✓"
    results.append(r)

    # V7 — Verbatim counts (Q17=561, S8=1230)
    r = ValidationResult("V7  Verbatim counts")
    q17_n = sum(1 for v in verbatims if v["question_code"] == "Q17_UnmetNeeds")
    s8_n  = sum(1 for v in verbatims if v["question_code"] == "S8_Unaided")
    msgs  = []
    if q17_n != 561:
        msgs.append(f"Q17: expected 561, got {q17_n}")
    if s8_n != 1230:
        msgs.append(f"S8: expected 1230, got {s8_n}")
    if msgs:
        r.fail("; ".join(msgs))
    else:
        r.message = f"Q17={q17_n}, S8={s8_n} ✓"
    results.append(r)

    # V8 — cant_think=True implies all unaided text slots are null  (§9 V8)
    r = ValidationResult("V8  cant_think ↔ empty unaided_mentions_raw")
    v8_viols = []
    for resp in respondents:
        ba = resp.get("brand_awareness", {})
        if ba.get("unaided_cant_think") and ba.get("unaided_mentions_raw"):
            v8_viols.append(resp["_id"])
    if v8_viols:
        r.fail(f"{len(v8_viols)} respondents have cant_think=True but non-empty mentions",
               v8_viols[:10])
    else:
        r.message = "0 violations ✓"
    results.append(r)

    # V9 — All required codebook entries present
    r = ValidationResult("V9  Codebook completeness")
    missing = [c for c in REQUIRED_CODEBOOK_CODES if c not in codebook]
    if missing:
        r.fail(f"{len(missing)} required entries missing", missing)
    else:
        r.message = f"All {len(REQUIRED_CODEBOOK_CODES)} required entries present ✓"
    results.append(r)

    # V10 — Smoke tests against known crosstab totals
    r = ValidationResult("V10 Smoke tests (crosstab cross-checks)")
    v10 = []
    # S1_HQ code=1 → 259 respondents
    n_s1hq1 = sum(1 for resp in respondents
                  if (resp.get("profile", {}).get("hq_location") or {}).get("code") == 1)
    if n_s1hq1 != V10_S1_HQ_CODE1_COUNT:
        v10.append(f"S1_HQ=1: expected {V10_S1_HQ_CODE1_COUNT}, got {n_s1hq1}")

    # Cognizant (brand_idx=1) shown to 333
    n_cogn_shown = sum(
        1 for resp in respondents
        if any(bs["brand_idx"] == 1 and bs["shown"] for bs in resp.get("brand_scores", []))
    )
    if n_cogn_shown != V10_COGNIZANT_SHOWN:
        v10.append(f"Cognizant shown: expected {V10_COGNIZANT_SHOWN}, got {n_cogn_shown}")

    # Q24 Cognizant attr 1 answered → 141
    n_q24_ans = sum(
        1 for resp in respondents
        if any(
            bs["brand_idx"] == 1 and any(
                a["attribute_idx"] == 1 and a["response_status"] == "answered"
                for a in bs.get("attribute_ratings", [])
            )
            for bs in resp.get("brand_scores", [])
        )
    )
    if n_q24_ans != V10_Q24_COGN_ATTR1_ANS:
        v10.append(f"Q24 Cognizant attr1 answered: expected {V10_Q24_COGN_ATTR1_ANS}, got {n_q24_ans}")

    if v10:
        r.fail(f"{len(v10)} smoke-test failures", v10)
    else:
        r.message = (
            f"S1_HQ=1→{n_s1hq1}, Cognizant shown→{n_cogn_shown}, "
            f"Q24 attr1 answered→{n_q24_ans} ✓"
        )
    results.append(r)

    return results


# ─────────────────────────────────────────────────────────────────────────────
# OUTPUT
# ─────────────────────────────────────────────────────────────────────────────

def write_json(path, data, label):
    """Write list or dict as pretty-printed JSON array/object."""
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2, default=str)
    size_kb = path.stat().st_size / 1024
    print(f"  ✓ {label:25s} → {path.name}  ({len(data) if isinstance(data, list) else 1} docs, {size_kb:.1f} KB)")


def print_validation_report(results, etl_errors, etl_warnings):
    print("\n" + "═" * 60)
    print("VALIDATION SUMMARY")
    print("═" * 60)
    all_passed = True
    for r in results:
        icon = "✓" if r.passed else "✗"
        print(f"  {icon}  {r.name:<42}  {r.message}")
        if r.violations:
            for v in r.violations[:5]:
                print(f"         ↳ {v}")
            if len(r.violations) > 5:
                print(f"         ↳ … and {len(r.violations)-5} more")
        if not r.passed:
            all_passed = False

    if etl_errors:
        print(f"\n  ✗  ETL errors during transformation: {len(etl_errors)}")
        for e in etl_errors[:10]:
            print(f"       {e}")
    if etl_warnings:
        print(f"\n  ⚠  ETL warnings: {len(etl_warnings)}")
        for w in etl_warnings[:5]:
            print(f"       {w}")

    print("═" * 60)
    if all_passed and not etl_errors:
        print("  RESULT: ALL CHECKS PASSED — ready for mongoimport")
    else:
        print("  RESULT: ONE OR MORE CHECKS FAILED — review errors above")
    print("═" * 60 + "\n")
    return all_passed and not etl_errors


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Cognizant Survey Intelligence ETL — import to JSON for mongoimport"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Transform and validate without writing output files"
    )
    parser.add_argument(
        "--sheet-a1", default="A1",
        help="Name of the respondent data sheet (default: A1)"
    )
    parser.add_argument(
        "--sheet-dm", default="Datamap",
        help="Name of the Datamap sheet (default: Datamap)"
    )
    args = parser.parse_args()

    print(f"\n{'─'*60}")
    print(f"  Cognizant Survey Intelligence — ETL")
    print(f"  {'[DRY RUN — no files written]' if args.dry_run else '[FULL RUN]'}")
    print(f"{'─'*60}")

    # ── Verify source file ────────────────────────────────────────────────
    if not RAW_FILE.exists():
        print(f"\nERROR: source file not found: {RAW_FILE}\n")
        sys.exit(1)

    started_at = now_utc_str()
    batch_id   = new_batch_id()
    import_ts  = started_at
    file_md5   = md5_file(RAW_FILE)
    print(f"\n  Source : {RAW_FILE}")
    print(f"  MD5    : {file_md5}")
    print(f"  Batch  : {batch_id}\n")

    # ── Load sheets ───────────────────────────────────────────────────────
    print(f"  Loading sheets …")
    dm = pd.read_excel(RAW_FILE, sheet_name=args.sheet_dm, header=None)
    a1 = pd.read_excel(RAW_FILE, sheet_name=args.sheet_a1, header=0)
    print(f"  Datamap : {len(dm)} rows × {dm.shape[1]} cols")
    print(f"  A1      : {len(a1)} rows × {a1.shape[1]} cols")

    # ── Step 1: Parse codebook ────────────────────────────────────────────
    print(f"\n  Step 1 — Parsing Datamap …")
    codebook = parse_datamap(dm, batch_id)
    col_label_idx = build_col_label_index(codebook)
    print(f"  Codebook entries: {len(codebook)}")

    # ── Step 2: Transform respondents ─────────────────────────────────────
    print(f"\n  Step 2 — Transforming {len(a1)} respondents …")
    transformer = RespondentTransformer(a1, codebook, col_label_idx, batch_id, import_ts)
    respondents = transformer.transform_all()
    print(f"  Respondents built : {len(respondents)}")
    if transformer.errors:
        print(f"  ETL errors        : {len(transformer.errors)}")
    if transformer.warnings:
        print(f"  ETL warnings      : {len(transformer.warnings)}")

    # ── Step 3: Extract verbatims ─────────────────────────────────────────
    print(f"\n  Step 3 — Extracting verbatims …")
    verbatims = extract_verbatims(respondents, batch_id, import_ts)
    q17_n = sum(1 for v in verbatims if v["question_code"] == "Q17_UnmetNeeds")
    s8_n  = sum(1 for v in verbatims if v["question_code"] == "S8_Unaided")
    print(f"  Q17 verbatims : {q17_n}")
    print(f"  S8 verbatims  : {s8_n}")

    # ── Step 4: Build import batch ─────────────────────────────────────────
    completed_at = now_utc_str()
    counts = {
        "a1_rows":    len(a1),
        "dm_rows":    len(dm),
        "md5":        file_md5,
        "codebook":   len(codebook),
        "respondents": len(respondents),
        "verbatims":  len(verbatims),
        "errors":     len(transformer.errors),
    }
    import_batch_doc = build_import_batch(batch_id, started_at, completed_at, counts)

    # ── Step 5: Validate V1–V10 ───────────────────────────────────────────
    print(f"\n  Step 5 — Running V1–V10 validations …")
    val_results = validate_all(codebook, respondents, verbatims)
    ok = print_validation_report(val_results, transformer.errors, transformer.warnings)

    # ── Step 6: Write output ───────────────────────────────────────────────
    if args.dry_run:
        print("  [DRY RUN] Output files not written.\n")
    else:
        print("  Step 6 — Writing output files …")
        cb_list = list(codebook.values())
        write_json(PROCESSED_DIR / "codebook.json",      cb_list,           "codebook")
        write_json(PROCESSED_DIR / "respondents.json",   respondents,       "respondents")
        write_json(PROCESSED_DIR / "verbatims.json",     verbatims,         "verbatims")
        write_json(PROCESSED_DIR / "import_batches.json",[import_batch_doc],"import_batches")
        print()

    # Exit with error code if validations failed
    if not ok:
        print("  Run exited with validation failures.\n")
        sys.exit(2)

    print(f"  Done.\n")


if __name__ == "__main__":
    main()
