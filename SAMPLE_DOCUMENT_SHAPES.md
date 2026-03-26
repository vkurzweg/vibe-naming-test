# Sample Document Shapes — Cognizant Survey Intelligence

**Date:** 2026-03-26
**Purpose:** Verify final document shapes and field names against IMPLEMENTATION_PLAN.md before ETL code is written.
**Source respondent:** uuid `5wyz442eaecekd4s`, record 7, row 0 of sheet A1 (first row of data).
**Notes on format:** JSON blocks use `// comment` annotations for readability. These are not valid JSON;
the ETL will produce clean JSON. Null fields are shown explicitly — absent keys are not acceptable.

---

## Contents

1. [Respondent document](#1-respondent-document)
2. [Codebook document](#2-codebook-document)
3. [Q17 verbatim document](#3-q17-verbatim-document)
4. [S8 unaided verbatim document](#4-s8-unaided-verbatim-document)
5. [import_batches document](#5-import_batches-document)

---

## 1. Respondent document

Full document for uuid `5wyz442eaecekd4s`. `brand_scores` shows two brands in full:
Cognizant (r1, shown=true) and Capgemini (r5, shown=false). The remaining 14 brands follow
the same element shape; they are abbreviated with `// ...` to keep the example readable.

```json
{
  "_id": "5wyz442eaecekd4s",
  "record": 7,
  "schema_version": "1.0",

  // ─────────────────────────────────────────────────────────────────────────
  // PROFILE
  // ─────────────────────────────────────────────────────────────────────────
  "profile": {
    "hq_location": {
      "code": 2,
      "label": "Headquartered in the U.S. with international operations"
    },
    "emp_count": {
      "code": 6,
      "label": "2,500-4,999"
    },
    "revenue": {
      "code": 9,
      "label": "$250 million – $499.99 million"
    },
    "industry": {
      "code": 11,
      "label": "Financial Services",
      "other_specify": null
    },
    "seniority": {
      "code": 3,
      "label": "Director or equivalent"
    },
    "functions": [
      "IT",
      "Cloud Infrastructure",
      "AI/ML & Data Science",
      "Software Engineering",
      "Cybersecurity",
      "Human Resources"
    ],
    "functions_other_specify": null,
    "works_with_provider": {
      "code": 1,
      "label": "Yes, currently working with external technology service providers"
    },
    "decision_involvement": {
      "code": 1,
      "label": "Final decision maker"
    },
    "ai_adoption_approach": {
      "code": 3,
      "label": "Balanced level of in-house and external service providers"
    },
    "tsp_engagement_plan": {
      "code": 1,
      "label": "Currently working with at least one provider"
    },
    "job_title": null
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BRAND AWARENESS
  // ─────────────────────────────────────────────────────────────────────────
  "brand_awareness": {
    "unaided_mentions_raw": ["magneto", "byte technolap"],
    "unaided_mentions": null,                            // null at import; filled by normalisation pass
    "unaided_cant_think": false,
    "aided_familiarity": [
      {
        "brand": "Cognizant",
        "brand_idx": 1,
        "code": 2,
        "label": "Familiar with but have not used",
        "question_code": "S9_Aided"
      },
      {
        "brand": "Accenture",
        "brand_idx": 2,
        "code": 1,
        "label": "Currently use or have used",
        "question_code": "S9_Aided"
      },
      // ... r3–r16 follow same shape ...
      {
        "brand": "Supercalifragilisticexpialidocious Incorporated",
        "brand_idx": 17,
        "code": 6,
        "label": "Never heard of",
        "question_code": "S9_Aided"
      }
    ],
    "familiar_brands": [
      "Cognizant",
      "Accenture",
      "Infosys",
      "EY",
      "Deloitte",
      "Microsoft (Azure & Copilot)"
    ],
    "current_brands": [
      "Accenture",
      "Deloitte"
    ],
    "shown_brands": [
      "Cognizant",
      "Accenture",
      "Infosys",
      "EY",
      "Deloitte",
      "Microsoft (Azure & Copilot)"
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BRAND SCORES — always 16 elements, r1 first, r16 last
  // ─────────────────────────────────────────────────────────────────────────
  "brand_scores": [

    // ── r1: Cognizant — shown=true, all brand questions answered ──────────
    {
      "brand": "Cognizant",
      "brand_idx": 1,
      "shown": true,

      "tsp_rating_now": {
        "response_status": "answered",
        "code": 6,
        "label": "2",
        "question_code": "Q1_TSP_Now"
      },

      "tsp_rating_2yrs_ago": {
        "response_status": "answered",
        "code": 7,
        "label": "3-Best in class",
        "question_code": "Q2_TSP_2yrsAgo"
      },

      "tsp_rating_2yrs_future": {
        "response_status": "answered",
        "code": 7,
        "label": "3-Best in class",
        "question_code": "Q3_TSP_2yrsfromnow"
      },

      "brand_category_perception": {
        "response_status": "answered",
        "selected_categories": [
          "Cloud infrastructure company",
          "Software-as-a-service (SaaS) provider",
          "Management consultancy",
          "Technology consultancy",
          "IT services firm",
          "AI model company"
        ],
        "question_code": "Q20"
      },

      // Q24: 12 attribute ratings. Direct integers -3 to +3.
      // Three states per attribute: not_shown | not_answered | answered.
      "attribute_ratings": [
        {
          "attribute": "Industry domain expertise",
          "attribute_idx": 1,
          "response_status": "answered",
          "value": 2,
          "question_code": "Q24_BrandAttributeRatings_Lr1"
        },
        {
          "attribute": "Innovation & thought leadership",
          "attribute_idx": 2,
          "response_status": "answered",
          "value": 2,
          "question_code": "Q24_BrandAttributeRatings_Lr2"
        },
        {
          "attribute": "Proven AI case studies",
          "attribute_idx": 3,
          "response_status": "not_answered",        // shown, skipped by respondent
          "value": null,
          "question_code": "Q24_BrandAttributeRatings_Lr3"
        },
        {
          "attribute": "Pricing",
          "attribute_idx": 4,
          "response_status": "answered",
          "value": 3,
          "question_code": "Q24_BrandAttributeRatings_Lr4"
        },
        {
          "attribute": "Implementation speed",
          "attribute_idx": 5,
          "response_status": "answered",
          "value": 2,
          "question_code": "Q24_BrandAttributeRatings_Lr5"
        },
        {
          "attribute": "Institutional knowledge",
          "attribute_idx": 6,
          "response_status": "answered",
          "value": 2,
          "question_code": "Q24_BrandAttributeRatings_Lr6"
        },
        {
          "attribute": "Ecosystem partnerships",
          "attribute_idx": 7,
          "response_status": "not_answered",
          "value": null,
          "question_code": "Q24_BrandAttributeRatings_Lr7"
        },
        {
          "attribute": "Solution customisation",
          "attribute_idx": 8,
          "response_status": "not_answered",
          "value": null,
          "question_code": "Q24_BrandAttributeRatings_Lr8"
        },
        {
          "attribute": "Collaboration & cultural fit",
          "attribute_idx": 9,
          "response_status": "not_answered",
          "value": null,
          "question_code": "Q24_BrandAttributeRatings_Lr9"
        },
        {
          "attribute": "Strategic consulting",
          "attribute_idx": 10,
          "response_status": "answered",
          "value": 2,
          "question_code": "Q24_BrandAttributeRatings_Lr10"
        },
        {
          "attribute": "Geographic presence",
          "attribute_idx": 11,
          "response_status": "not_answered",
          "value": null,
          "question_code": "Q24_BrandAttributeRatings_Lr11"
        },
        {
          "attribute": "Talent & quality",
          "attribute_idx": 12,
          "response_status": "not_answered",
          "value": null,
          "question_code": "Q24_BrandAttributeRatings_Lr12"
        }
      ],

      "rank_2yrs_ago": {
        "response_status": "answered",
        "rank": 4,
        "question_code": "Q25_Rank2yrsAgo"
      },

      "rank_2yrs_future": {
        "response_status": "answered",
        "rank": 6,
        "question_code": "Q26_Rank2yrsfromNow"
      },

      "purchase_intent": {
        "response_status": "answered",
        "code": 4,
        "label": "3",
        "question_code": "Q27_PurchaseIntent"
      }
    },

    // ── r2: Accenture — shown=true (abbreviated; same shape as r1) ─────────
    {
      "brand": "Accenture",
      "brand_idx": 2,
      "shown": true
      // ... tsp_rating_now, tsp_rating_2yrs_ago, tsp_rating_2yrs_future,
      //     brand_category_perception, attribute_ratings, rank_2yrs_ago,
      //     rank_2yrs_future, purchase_intent — all response_status: "answered" ...
    },

    // ── r3: IBM Consulting — not shown: all fields null ────────────────────
    {
      "brand": "IBM Consulting",
      "brand_idx": 3,
      "shown": false,
      "tsp_rating_now": {
        "response_status": "not_shown",
        "code": null,
        "label": null,
        "question_code": "Q1_TSP_Now"
      },
      "tsp_rating_2yrs_ago": {
        "response_status": "not_shown",
        "code": null,
        "label": null,
        "question_code": "Q2_TSP_2yrsAgo"
      },
      "tsp_rating_2yrs_future": {
        "response_status": "not_shown",
        "code": null,
        "label": null,
        "question_code": "Q3_TSP_2yrsfromnow"
      },
      "brand_category_perception": {
        "response_status": "not_shown",
        "selected_categories": null,
        "question_code": "Q20"
      },
      "attribute_ratings": [
        {
          "attribute": "Industry domain expertise",
          "attribute_idx": 1,
          "response_status": "not_shown",
          "value": null,
          "question_code": "Q24_BrandAttributeRatings_Lr1"
        }
        // ... attributes Lr2–Lr12 all response_status: "not_shown", value: null ...
      ],
      "rank_2yrs_ago": {
        "response_status": "not_shown",
        "rank": null,
        "question_code": "Q25_Rank2yrsAgo"
      },
      "rank_2yrs_future": {
        "response_status": "not_shown",
        "rank": null,
        "question_code": "Q26_Rank2yrsfromNow"
      },
      "purchase_intent": {
        "response_status": "not_shown",
        "code": null,
        "label": null,
        "question_code": "Q27_PurchaseIntent"
      }
    },

    // ── r4: Infosys — shown=true (abbreviated) ────────────────────────────
    { "brand": "Infosys", "brand_idx": 4, "shown": true },

    // ── r5: Capgemini — not shown: full example of a not-shown brand ───────
    {
      "brand": "Capgemini",
      "brand_idx": 5,
      "shown": false,
      "tsp_rating_now": {
        "response_status": "not_shown",
        "code": null,
        "label": null,
        "question_code": "Q1_TSP_Now"
      },
      "tsp_rating_2yrs_ago": {
        "response_status": "not_shown",
        "code": null,
        "label": null,
        "question_code": "Q2_TSP_2yrsAgo"
      },
      "tsp_rating_2yrs_future": {
        "response_status": "not_shown",
        "code": null,
        "label": null,
        "question_code": "Q3_TSP_2yrsfromnow"
      },
      "brand_category_perception": {
        "response_status": "not_shown",
        "selected_categories": null,
        "question_code": "Q20"
      },
      "attribute_ratings": [
        { "attribute": "Industry domain expertise", "attribute_idx": 1, "response_status": "not_shown", "value": null, "question_code": "Q24_BrandAttributeRatings_Lr1" },
        { "attribute": "Innovation & thought leadership", "attribute_idx": 2, "response_status": "not_shown", "value": null, "question_code": "Q24_BrandAttributeRatings_Lr2" },
        { "attribute": "Proven AI case studies", "attribute_idx": 3, "response_status": "not_shown", "value": null, "question_code": "Q24_BrandAttributeRatings_Lr3" },
        { "attribute": "Pricing", "attribute_idx": 4, "response_status": "not_shown", "value": null, "question_code": "Q24_BrandAttributeRatings_Lr4" },
        { "attribute": "Implementation speed", "attribute_idx": 5, "response_status": "not_shown", "value": null, "question_code": "Q24_BrandAttributeRatings_Lr5" },
        { "attribute": "Institutional knowledge", "attribute_idx": 6, "response_status": "not_shown", "value": null, "question_code": "Q24_BrandAttributeRatings_Lr6" },
        { "attribute": "Ecosystem partnerships", "attribute_idx": 7, "response_status": "not_shown", "value": null, "question_code": "Q24_BrandAttributeRatings_Lr7" },
        { "attribute": "Solution customisation", "attribute_idx": 8, "response_status": "not_shown", "value": null, "question_code": "Q24_BrandAttributeRatings_Lr8" },
        { "attribute": "Collaboration & cultural fit", "attribute_idx": 9, "response_status": "not_shown", "value": null, "question_code": "Q24_BrandAttributeRatings_Lr9" },
        { "attribute": "Strategic consulting", "attribute_idx": 10, "response_status": "not_shown", "value": null, "question_code": "Q24_BrandAttributeRatings_Lr10" },
        { "attribute": "Geographic presence", "attribute_idx": 11, "response_status": "not_shown", "value": null, "question_code": "Q24_BrandAttributeRatings_Lr11" },
        { "attribute": "Talent & quality", "attribute_idx": 12, "response_status": "not_shown", "value": null, "question_code": "Q24_BrandAttributeRatings_Lr12" }
      ],
      "rank_2yrs_ago": {
        "response_status": "not_shown",
        "rank": null,
        "question_code": "Q25_Rank2yrsAgo"
      },
      "rank_2yrs_future": {
        "response_status": "not_shown",
        "rank": null,
        "question_code": "Q26_Rank2yrsfromNow"
      },
      "purchase_intent": {
        "response_status": "not_shown",
        "code": null,
        "label": null,
        "question_code": "Q27_PurchaseIntent"
      }
    },

    // ── r6–r16: remaining brands abbreviated ─────────────────────────────
    { "brand": "Wipro", "brand_idx": 6, "shown": false },
    { "brand": "Tata Consultancy Services (TCS)", "brand_idx": 7, "shown": false },
    { "brand": "EY", "brand_idx": 8, "shown": true },
    { "brand": "HCL Technologies", "brand_idx": 9, "shown": false },
    { "brand": "Deloitte", "brand_idx": 10, "shown": true },
    { "brand": "McKinsey & Company", "brand_idx": 11, "shown": false },
    { "brand": "Google (Cloud & Gemini)", "brand_idx": 12, "shown": false },
    { "brand": "DXC Technology", "brand_idx": 13, "shown": false },
    { "brand": "ServiceNow", "brand_idx": 14, "shown": false },
    { "brand": "Microsoft (Azure & Copilot)", "brand_idx": 15, "shown": true },
    { "brand": "Amazon Web Services (AWS)", "brand_idx": 16, "shown": false }
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // RESPONSES
  // ─────────────────────────────────────────────────────────────────────────
  "responses": {

    // Single-coded scalars
    "ai_maturity": {
      "code": 7,
      "label": "7",
      "question_code": "Q4"
    },
    "ai_adoption_position": {
      "code": 1,
      "label": "Leader",
      "question_code": "Q8"
    },
    "ai_success": {
      "code": 1,
      "label": "Highly successful",
      "question_code": "Q9"
    },
    "q10": {
      "code": 2,
      "label": "Moderate expansion",
      "question_code": "Q10"
    },
    "preferred_tsp": {
      "code": 15,
      "label": "Microsoft (Azure & Copilot)",
      "question_code": "Q28"
    },
    "geo_preference": {
      "code": 3,
      "label": "Indifferent onshore/offshore",
      "question_code": "Q35"
    },
    "pricing_preference": {
      "code": 2,
      "label": "Monthly or annual subscription",
      "other": null,
      "question_code": "Q36_Pricing"
    },
    "q38": {
      "code": 1,
      "label": "Yes, dedicated AI budget",
      "question_code": "Q38"
    },
    "q39": {
      "code": 6,
      "label": "$15m-$19.9m",
      "question_code": "Q39"
    },
    "q41": {
      "code": 2,
      "label": "Grow 5-9.99%",
      "question_code": "Q41"
    },
    "q43": {
      "code": 2,
      "label": "Small gap",
      "question_code": "Q43"
    },
    "q44": {
      "code": 4,
      "label": "Incremental change",
      "question_code": "Q44"
    },
    "q45": {
      "code": 3,
      "label": "4-6",
      "question_code": "Q45"
    },
    "q48": {
      "code": 3,
      "label": "16-24 years",
      "question_code": "Q48"
    },
    "q49": {
      "code": 2,
      "label": "Grew 5-9.99%",
      "question_code": "Q49"
    },
    "q50": {
      "code": 1,
      "label": "Microsoft Azure",
      "other": null,
      "question_code": "Q50"
    },
    "q52": {
      "code": 1,
      "label": "High Budget High Rank",
      "question_code": "Q52"
    },

    // Continuous numeric (stored as-is; no code/label wrapper)
    "ai_spend_current": 17000000.0,
    "ai_budget_planned": 4500,

    // Per-row coded grid: Q5 — AI use by functional area (13 rows, codes 1–4)
    "ai_use_by_area": [
      { "area": "Customer service & support operations", "area_idx": 1, "code": 4, "label": "Extensively", "question_code": "Q5" },
      { "area": "IT operations & infrastructure management", "area_idx": 2, "code": 4, "label": "Extensively", "question_code": "Q5" },
      { "area": "Data analytics & business intelligence", "area_idx": 3, "code": 3, "label": "Moderately", "question_code": "Q5" },
      { "area": "Software development & testing", "area_idx": 4, "code": 3, "label": "Moderately", "question_code": "Q5" },
      { "area": "HR & talent management", "area_idx": 5, "code": 2, "label": "Limitedly", "question_code": "Q5" },
      { "area": "Finance & accounting automation", "area_idx": 6, "code": 3, "label": "Moderately", "question_code": "Q5" },
      { "area": "Supply chain & logistics", "area_idx": 7, "code": 1, "label": "Not at all", "question_code": "Q5" },
      { "area": "Marketing & customer acquisition", "area_idx": 8, "code": 2, "label": "Limitedly", "question_code": "Q5" },
      { "area": "Product development & R&D", "area_idx": 9, "code": 3, "label": "Moderately", "question_code": "Q5" },
      { "area": "Cybersecurity & risk management", "area_idx": 10, "code": 4, "label": "Extensively", "question_code": "Q5" },
      { "area": "Legal & compliance", "area_idx": 11, "code": 2, "label": "Limitedly", "question_code": "Q5" },
      { "area": "Sales & CRM", "area_idx": 12, "code": 3, "label": "Moderately", "question_code": "Q5" },
      { "area": "Executive decision support", "area_idx": 13, "code": 4, "label": "Extensively", "question_code": "Q5" }
    ],

    // Per-row coded grid: Q6 — AI priority importance (3 rows, codes 1–7)
    "ai_priority_importance": [
      { "priority": "Reducing operational costs", "priority_idx": 1, "code": 7, "label": "7 - Extremely important", "question_code": "Q6_Area_AIUse" },
      { "priority": "Improving customer experience", "priority_idx": 2, "code": 7, "label": "7 - Extremely important", "question_code": "Q6_Area_AIUse" },
      { "priority": "Accelerating product/service innovation", "priority_idx": 3, "code": 6, "label": "6 - Very important", "question_code": "Q6_Area_AIUse" }
    ],

    // Per-row coded grid: Q7 — AI priority direction (3 rows, codes 1–5)
    "ai_priority_direction": [
      { "priority": "Reducing operational costs", "priority_idx": 1, "code": 4, "label": "Increase somewhat", "question_code": "Q7" },
      { "priority": "Improving customer experience", "priority_idx": 2, "code": 4, "label": "Increase somewhat", "question_code": "Q7" },
      { "priority": "Accelerating product/service innovation", "priority_idx": 3, "code": 4, "label": "Increase somewhat", "question_code": "Q7" }
    ],

    // Multi-select — binary 0/1 per option → array of selected labels
    "ai_outcomes": [
      "Cost reduction",
      "Improved decision-making",
      "Enhanced customer experience",
      "Increased revenue"
    ],
    "vendor_types_current": [
      "Large global consulting firms",
      "Cloud hyperscalers",
      "Specialist AI vendors"
    ],
    "vendor_types_preferred": [
      "Large global consulting firms",
      "Cloud hyperscalers"
    ],
    "q13_other": null,
    "tsp_attributes_valued": [
      "AI capability & expertise",
      "Track record of delivery",
      "Industry domain knowledge",
      "Pricing & commercial flexibility"
    ],
    "tsp_challenges": [
      "Difficulty measuring ROI",
      "Integration with existing systems",
      "Data security & privacy concerns"
    ],
    "tsp_dissuaders": [
      "Too expensive",
      "Lack of domain expertise"
    ],
    "tsp_criteria": [
      "Technical capability",
      "Industry experience",
      "Pricing"
    ],
    "vendor_selection_factors": [
      "Case studies & proven outcomes",
      "Reputation & brand"
    ],
    "tsp_confidence_brands": [
      "Accenture",
      "Deloitte",
      "Microsoft (Azure & Copilot)"
    ],
    "tsp_unaware_brands": [],
    "tsp_perception_brands": [
      "Cognizant",
      "Accenture"
    ],
    "sources_of_info": [
      "Analyst reports (e.g. Gartner, Forrester)",
      "Peer recommendations",
      "Industry events & conferences"
    ],
    "sources_other": null,
    "q29": ["Improved operational efficiency", "Cost savings"],
    "q30": ["Talent shortage", "Budget constraints"],
    "positioning_q31": ["Strong AI credentials", "Proven delivery track record"],
    "positioning_q32": ["End-to-end capabilities"],
    "positioning_q33": ["Cognizant", "Accenture"],
    "positioning_q34": ["Microsoft (Azure & Copilot)", "Accenture"],
    "q42": ["Cloud migration", "AI/ML model development"],
    "q42_other": null,
    "q46": ["Generative AI", "Cloud infrastructure", "Cybersecurity"],
    "q46_other": null
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VERBATIMS (embedded)
  // ─────────────────────────────────────────────────────────────────────────
  "verbatims": {
    "unmet_needs": {
      "text": "We are yet to realize the full potential of AI",
      "char_count": 46,
      "question_code": "Q17_UnmetNeeds"
    },
    "unaided_raw": {
      "slot_1": "magneto",
      "slot_2": "byte technolap",
      "slot_3": null,
      "slot_4": null,
      "slot_5": null,
      "question_code": "S8_Unaided"
    },
    "other_specify": {
      "industry": null,
      "function": null,
      "pricing": null,
      "q13": null,
      "q15_challenges": null,
      "q16_dissuade": null,
      "q21_confidence": null,
      "q29": null,
      "q33": null,
      "q37_sources": null,
      "q42": null,
      "q46": null,
      "q50": null
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // META
  // ─────────────────────────────────────────────────────────────────────────
  "_meta": {
    "completion_time_sec": 2995.634,
    "start_date": "2025-10-31T17:09:00.000Z",
    "panel_list": 5,
    "vlist": 6,
    "dropout_flag": 0,
    "os": null,
    "browser": null,
    "mobile_device": null,
    "mobile_os": null,
    "quota_markers": "qualified,/Industry Quota/MCKKK,...",
    "respondent_status": {
      "code": 3,
      "label": "Qualified"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PROVENANCE
  // ─────────────────────────────────────────────────────────────────────────
  "_provenance": {
    "source_file": "Cognizant_Raw_Data.xlsx",
    "sheet": "A1",
    "import_batch_id": { "$oid": "67e3a1b2c3d4e5f600000001" },
    "imported_at": { "$date": "2026-03-26T10:00:00.000Z" },
    "schema_version": "1.0"
  }
}
```

---

## 2. Codebook document

Example for `S1_HQ` — a single-coded scalar with 4 answer codes. The `_id` field equals
`variable_code` so the ETL can do O(1) key-based lookups: `db.codebook.findOne({_id: "S1_HQ"})`.

```json
{
  "_id": "S1_HQ",
  "variable_code": "S1_HQ",
  "question_text": "S1_HQ: In which of the following best describes your organization's headquarters location?",
  "question_type": "single_coded",
  "scale_min": 1,
  "scale_max": 4,
  "answer_codes": {
    "1": "Headquartered in the U.S. (domestic only)",
    "2": "Headquartered in the U.S. with international operations",
    "3": "Headquartered outside the U.S. with U.S. operations",
    "4": "Headquartered outside the U.S. (minimal U.S. presence)"
  },
  "sub_items": null,
  "_provenance": {
    "source_file": "Cognizant_Raw_Data.xlsx",
    "sheet": "Datamap",
    "import_batch_id": { "$oid": "67e3a1b2c3d4e5f600000001" }
  }
}
```

### Additional codebook shape: grid question with sub_items

Example for `Q1_TSP_Now` — a branded grid question. One codebook document covers the
question-level scale and answer codes; `sub_items` lists the 16 brand rows.

```json
{
  "_id": "Q1_TSP_Now",
  "variable_code": "Q1_TSP_Now",
  "question_text": "Q1_TSP_Now: How would you currently rate each of the following as a technology service provider?",
  "question_type": "grid_coded",
  "scale_min": 1,
  "scale_max": 7,
  "answer_codes": {
    "1": "1",
    "2": "1",
    "3": "1",
    "4": "1",
    "5": "1",
    "6": "2",
    "7": "3-Best in class"
  },
  "sub_items": [
    { "idx": 1, "column_code": "Q1_TSP_Nowr1",  "label": "Cognizant" },
    { "idx": 2, "column_code": "Q1_TSP_Nowr2",  "label": "Accenture" },
    { "idx": 3, "column_code": "Q1_TSP_Nowr3",  "label": "IBM Consulting" },
    { "idx": 4, "column_code": "Q1_TSP_Nowr4",  "label": "Infosys" },
    { "idx": 5, "column_code": "Q1_TSP_Nowr5",  "label": "Capgemini" },
    { "idx": 6, "column_code": "Q1_TSP_Nowr6",  "label": "Wipro" },
    { "idx": 7, "column_code": "Q1_TSP_Nowr7",  "label": "Tata Consultancy Services (TCS)" },
    { "idx": 8, "column_code": "Q1_TSP_Nowr8",  "label": "EY" },
    { "idx": 9, "column_code": "Q1_TSP_Nowr9",  "label": "HCL Technologies" },
    { "idx": 10, "column_code": "Q1_TSP_Nowr10", "label": "Deloitte" },
    { "idx": 11, "column_code": "Q1_TSP_Nowr11", "label": "McKinsey & Company" },
    { "idx": 12, "column_code": "Q1_TSP_Nowr12", "label": "Google (Cloud & Gemini)" },
    { "idx": 13, "column_code": "Q1_TSP_Nowr13", "label": "DXC Technology" },
    { "idx": 14, "column_code": "Q1_TSP_Nowr14", "label": "ServiceNow" },
    { "idx": 15, "column_code": "Q1_TSP_Nowr15", "label": "Microsoft (Azure & Copilot)" },
    { "idx": 16, "column_code": "Q1_TSP_Nowr16", "label": "Amazon Web Services (AWS)" }
  ],
  "_provenance": {
    "source_file": "Cognizant_Raw_Data.xlsx",
    "sheet": "Datamap",
    "import_batch_id": { "$oid": "67e3a1b2c3d4e5f600000001" }
  }
}
```

### Additional codebook shape: multi-select question

Example for `S6_Function` — binary 0/1 per row; `answer_codes` is null; `sub_items` lists options.

```json
{
  "_id": "S6_Function",
  "variable_code": "S6_Function",
  "question_text": "S6_Function: Which of the following functional areas do you have primary responsibility for?",
  "question_type": "multi_select",
  "scale_min": null,
  "scale_max": null,
  "answer_codes": null,
  "sub_items": [
    { "idx": 1,  "column_code": "S6_Functionr1",   "label": "Finance" },
    { "idx": 2,  "column_code": "S6_Functionr2",   "label": "IT" },
    { "idx": 3,  "column_code": "S6_Functionr3",   "label": "Cloud Infrastructure" },
    { "idx": 4,  "column_code": "S6_Functionr4",   "label": "Operations" },
    { "idx": 5,  "column_code": "S6_Functionr5",   "label": "AI/ML & Data Science" },
    { "idx": 6,  "column_code": "S6_Functionr6",   "label": "Strategy & Corporate Development" },
    { "idx": 7,  "column_code": "S6_Functionr7",   "label": "Software Engineering" },
    { "idx": 8,  "column_code": "S6_Functionr8",   "label": "Marketing" },
    { "idx": 9,  "column_code": "S6_Functionr9",   "label": "Cybersecurity" },
    { "idx": 10, "column_code": "S6_Functionr10",  "label": "Product Management" },
    { "idx": 20, "column_code": "S6_Functionr20",  "label": "Human Resources" },
    { "idx": 22, "column_code": "S6_Functionr22",  "label": "Other (specify)" }
  ],
  "_provenance": {
    "source_file": "Cognizant_Raw_Data.xlsx",
    "sheet": "Datamap",
    "import_batch_id": { "$oid": "67e3a1b2c3d4e5f600000001" }
  }
}
```

---

## 3. Q17 verbatim document

One document per non-null `Q17_UnmetNeeds` response. Source: `A1.Q17_UnmetNeeds`.
`respondent_snapshot` is denormalised at import for join-free segment filtering.

```json
{
  "_id": { "$oid": "67e3a1b2c3d4e5f600000010" },
  "respondent_uuid": "5wyz442eaecekd4s",
  "question_code": "Q17_UnmetNeeds",
  "question_label": "Unmet needs from technology service providers",
  "slot": null,
  "text": "We are yet to realize the full potential of AI",
  "text_normalised": null,
  "char_count": 46,
  "word_count": 10,

  "respondent_snapshot": {
    "industry": {
      "code": 11,
      "label": "Financial Services"
    },
    "emp_count": {
      "code": 6,
      "label": "2,500-4,999"
    },
    "revenue": {
      "code": 9,
      "label": "$250 million – $499.99 million"
    },
    "seniority": {
      "code": 3,
      "label": "Director or equivalent"
    },
    "decision_involvement": {
      "code": 1,
      "label": "Final decision maker"
    },
    "current_brands": [
      "Accenture",
      "Deloitte"
    ],
    "ai_maturity_code": 7
  },

  "analysis": {
    "embedding_model": null,
    "embedding": null,
    "themes": [],
    "sentiment": null,
    "resolved_brand": null,
    "resolution_method": null,
    "flagged": false,
    "claim_ids": []
  },

  "_provenance": {
    "source_file": "Cognizant_Raw_Data.xlsx",
    "sheet": "A1",
    "original_column": "Q17_UnmetNeeds",
    "import_batch_id": { "$oid": "67e3a1b2c3d4e5f600000001" },
    "imported_at": { "$date": "2026-03-26T10:00:00.000Z" }
  }
}
```

---

## 4. S8 unaided verbatim document

One document per non-null slot in `S8_Unaidedr1oe`–`S8_Unaidedr5oe`.
This respondent had two non-null slots; this shows slot 1.

`resolved_brand` and `resolution_method` are null at import and populated by the
brand normalisation pass (which maps raw text like "magneto" to a known brand or
flags it as unresolvable).

```json
{
  "_id": { "$oid": "67e3a1b2c3d4e5f600000020" },
  "respondent_uuid": "5wyz442eaecekd4s",
  "question_code": "S8_Unaided",
  "question_label": "Unaided brand awareness — technology service providers",
  "slot": 1,
  "text": "magneto",
  "text_normalised": null,
  "char_count": 7,
  "word_count": 1,

  "respondent_snapshot": {
    "industry": {
      "code": 11,
      "label": "Financial Services"
    },
    "emp_count": {
      "code": 6,
      "label": "2,500-4,999"
    },
    "revenue": {
      "code": 9,
      "label": "$250 million – $499.99 million"
    },
    "seniority": {
      "code": 3,
      "label": "Director or equivalent"
    },
    "decision_involvement": {
      "code": 1,
      "label": "Final decision maker"
    },
    "current_brands": [
      "Accenture",
      "Deloitte"
    ],
    "ai_maturity_code": 7
  },

  "analysis": {
    "embedding_model": null,
    "embedding": null,
    "themes": [],
    "sentiment": null,
    "resolved_brand": null,              // null until normalisation pass
    "resolution_method": null,           // will be: "exact_match" | "fuzzy_match" | "manual" | "unresolved"
    "flagged": false,
    "claim_ids": []
  },

  "_provenance": {
    "source_file": "Cognizant_Raw_Data.xlsx",
    "sheet": "A1",
    "original_column": "S8_Unaidedr1oe",
    "import_batch_id": { "$oid": "67e3a1b2c3d4e5f600000001" },
    "imported_at": { "$date": "2026-03-26T10:00:00.000Z" }
  }
}
```

**Slot 2 document** (`S8_Unaidedr2oe`) would be identical in shape with:
- `_id`: a different ObjectId
- `slot`: 2
- `text`: "byte technolap"
- `char_count`: 14
- `word_count`: 2
- `original_column`: "S8_Unaidedr2oe"

---

## 5. import_batches document

Created at ETL start (`status: "running"`), updated on completion (`status: "completed"`).
`md5` hashes are computed from the source files at import time for change detection.

```json
{
  "_id": { "$oid": "67e3a1b2c3d4e5f600000001" },
  "batch_label": "initial-load-2026-03-26",
  "started_at": { "$date": "2026-03-26T10:00:00.000Z" },
  "completed_at": { "$date": "2026-03-26T10:04:37.000Z" },
  "status": "completed",

  "source_files": [
    {
      "filename": "Cognizant_Raw_Data.xlsx",
      "sheet": "A1",
      "row_count": 600,
      "md5": "a3f8c2d1e4b7091623456789abcdef01"
    },
    {
      "filename": "Cognizant_Raw_Data.xlsx",
      "sheet": "Datamap",
      "row_count": 1768,
      "md5": "a3f8c2d1e4b7091623456789abcdef01"
    }
  ],

  "counts": {
    "codebook_inserted": 187,
    "respondents_inserted": 600,
    "verbatims_inserted": 1791,
    "errors": 0
  },

  "schema_version": "1.0",
  "script_version": "etl/import.py v0.1.0",
  "notes": "Initial load from Cognizant survey wave Oct 2025. All 600 qualified respondents imported. Zero errors."
}
```

---

## Shape summary

| Collection | Key nesting decisions |
|-----------|----------------------|
| `respondents` | `brand_scores` always 16 elements. `shown: false` → all sub-fields null, `response_status: "not_shown"`. Q24 is the only brand question with `"not_answered"` state. `verbatims` embedded for co-located access. |
| `codebook` | `_id = variable_code` for O(1) ETL lookups. `answer_codes` is a string-keyed map (`"1"`, `"2"`, …) to handle mixed int/string code lookups. `sub_items` null for non-grid questions. |
| `verbatims` | `respondent_snapshot` denormalised at import — no join needed for segment-filtered queries. `analysis` block fully present at import (all nulls/empty arrays); downstream passes update in-place. |
| `import_batches` | Created first (`status: "running"`), updated last (`status: "completed"`). Provides audit trail and change-detection hashes. `_id` is referenced as FK in all other collections. |

---

*All field names confirmed against IMPLEMENTATION_PLAN.md §4–§7.
All values confirmed against A1 row 0, uuid `5wyz442eaecekd4s` (record 7).
Area/priority labels in Q5/Q6/Q7 are illustrative pending final Datamap parsing in ETL step 1.*
