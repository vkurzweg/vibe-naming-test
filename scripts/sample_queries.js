// =============================================================================
// sample_queries.js — Starter queries for the survey intelligence dataset
//
// Run individual queries in mongosh:
//   mongosh "$MONGODB_URI/$MONGODB_DATABASE" --file scripts/sample_queries.js
//
// Or copy a single named block into mongosh interactively.
//
// SCALE REFERENCE
// ───────────────
//   Q1/Q2/Q3 (TSP performance rating)   code 1–7 → label -3.."3- Best in class"
//                                        positive = code ≥ 5 (labels 1, 2, 3)
//   Q27 (purchase intent)               code 1–6 → label "0-No chance".."5-Almost certainly"
//                                        high intent = code ≥ 5 (labels "4", "5-Almost certainly")
//   Q24 (attribute rating)              direct integer –3..+3, no code wrapper
//                                        positive > 0, neutral = 0, negative < 0
//   S9_Aided (familiarity)              code 1=Currently using  2=Past use
//                                            3=Considering       4=Familiar/never used
//                                            5=Heard name only   6=Never heard of
//   brand_awareness.current_brands      array of brand names where S9 = code 1
//   brand_scores.shown                  true only for brands in brand_awareness.shown_brands
// =============================================================================

const DB = db; // shorthand

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 1 — Current providers vs. purchase intent
// ─────────────────────────────────────────────────────────────────────────────

// Q1-A  Current users vs. non-users: does being a current user predict
//       higher retention intent?
//       Business use: size the "renewal at risk" and "upsell" pools per brand.
print("\n── Q1-A  Current-user vs non-user purchase intent by brand ──────────────");
DB.respondents.aggregate([
  { $unwind: "$brand_scores" },
  { $match: {
    "brand_scores.shown": true,
    "brand_scores.purchase_intent.response_status": "answered"
  }},
  { $addFields: {
    is_current_user: { $in: ["$brand_scores.brand", "$brand_awareness.current_brands"] }
  }},
  { $group: {
    _id: {
      brand:           "$brand_scores.brand",
      is_current_user: "$is_current_user"
    },
    n:                { $sum: 1 },
    avg_intent_code:  { $avg: "$brand_scores.purchase_intent.code" },
    // pct of respondents who gave label "4" or "5 - Almost certainly" (codes 5–6)
    pct_high_intent: {
      $avg: { $cond: [{ $gte: ["$brand_scores.purchase_intent.code", 5] }, 1, 0] }
    }
  }},
  { $addFields: {
    pct_high_intent: { $round: [{ $multiply: ["$pct_high_intent", 100] }, 1] }
  }},
  { $sort: { "_id.brand": 1, "_id.is_current_user": -1 } }
]).forEach(printjson);


// Q1-B  Leaderboard: brands ranked by purchase-intent score (shown base only)
//       Business use: quick cross-brand ranking to answer "where does Cognizant
//       sit on likelihood to be retained or selected?"
print("\n── Q1-B  Brand purchase-intent leaderboard ──────────────────────────────");
DB.respondents.aggregate([
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
    // map code avg back to approximate 0–5 label scale for readability
    approx_label_avg: { $round: [{ $subtract: ["$avg_intent_code", 1] }, 2] },
    pct_high_intent:  { $round: [{ $multiply: ["$pct_high_intent", 100] }, 1] }
  }},
  { $sort: { avg_intent_code: -1 } }
]).forEach(printjson);


// Q1-C  Performance trajectory: current rating vs. 2-year-future rating
//       Business use: identify brands gaining or losing ground; flag brands
//       where current users rate them lower than they rate their likely future.
print("\n── Q1-C  Performance trajectory (Q1 now vs Q3 future) by brand ─────────");
DB.respondents.aggregate([
  { $unwind: "$brand_scores" },
  { $match: {
    "brand_scores.shown": true,
    "brand_scores.tsp_rating_now.response_status":        "answered",
    "brand_scores.tsp_rating_2yrs_future.response_status": "answered"
  }},
  { $group: {
    _id:              "$brand_scores.brand",
    n:                { $sum: 1 },
    avg_rating_now:   { $avg: "$brand_scores.tsp_rating_now.code" },
    avg_rating_future:{ $avg: "$brand_scores.tsp_rating_2yrs_future.code" }
  }},
  { $addFields: {
    momentum: { $round: [
      { $subtract: ["$avg_rating_future", "$avg_rating_now"] }, 3
    ]}
  }},
  { $sort: { momentum: -1 } }
]).forEach(printjson);


// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 2 — Cognizant performance by segment
// ─────────────────────────────────────────────────────────────────────────────

// Q2-A  Cognizant: average purchase intent and current-period rating by industry
//       Business use: identify verticals where Cognizant is strongest / weakest
//       for targeted outreach messaging.
print("\n── Q2-A  Cognizant intent + rating by industry ──────────────────────────");
DB.respondents.aggregate([
  { $unwind: "$brand_scores" },
  { $match: {
    "brand_scores.brand": "Cognizant",
    "brand_scores.shown": true,
    "brand_scores.purchase_intent.response_status": "answered"
  }},
  { $group: {
    _id:              "$profile.industry.label",
    n:                { $sum: 1 },
    avg_intent_code:  { $avg: "$brand_scores.purchase_intent.code" },
    avg_rating_now:   { $avg: {
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
]).forEach(printjson);


// Q2-B  Cognizant vs. market average: intent gap by company size
//       Business use: understand whether Cognizant over- or under-indexes
//       among enterprise vs. mid-market buyers.
print("\n── Q2-B  Cognizant vs market intent gap by employee count band ──────────");
DB.respondents.aggregate([
  { $unwind: "$brand_scores" },
  { $match: {
    "brand_scores.shown": true,
    "brand_scores.purchase_intent.response_status": "answered"
  }},
  { $group: {
    _id: {
      emp_band: "$profile.emp_count.label",
      brand:    "$brand_scores.brand"
    },
    n:           { $sum: 1 },
    avg_intent:  { $avg: "$brand_scores.purchase_intent.code" }
  }},
  // Second group: pivot Cognizant vs market average within each band
  { $group: {
    _id: "$_id.emp_band",
    cognizant_intent: {
      $max: {
        $cond: [{ $eq: ["$_id.brand", "Cognizant"] }, "$avg_intent", null]
      }
    },
    market_avg_intent: { $avg: "$avg_intent" },
    n_cognizant: {
      $max: {
        $cond: [{ $eq: ["$_id.brand", "Cognizant"] }, "$n", null]
      }
    }
  }},
  { $addFields: {
    cognizant_gap: { $round: [
      { $subtract: ["$cognizant_intent", "$market_avg_intent"] }, 3
    ]}
  }},
  { $sort: { cognizant_gap: -1 } }
]).forEach(printjson);


// Q2-C  Cognizant: intent by buyer seniority and decision-making role
//       Business use: understand where C-suite vs. Directors respond differently.
print("\n── Q2-C  Cognizant intent by seniority ──────────────────────────────────");
DB.respondents.aggregate([
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
]).forEach(printjson);


// Q2-D  Cognizant: AI-maturity segment cut
//       Business use: are high-maturity buyers more or less likely to retain Cognizant?
//       (Low maturity = codes 1–3, Mid = 4–6, High = 7–10)
print("\n── Q2-D  Cognizant intent by AI maturity band ───────────────────────────");
DB.respondents.aggregate([
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
]).forEach(printjson);


// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 3 — Q24 attribute comparisons across brands (shown respondents only)
// ─────────────────────────────────────────────────────────────────────────────
// Q24 scale: –3 (strongly disagree) .. +3 (strongly agree), direct integers.
// Only respondents for whom the brand was shown AND who gave a response
// (response_status = "answered") are included.

// Q3-A  Per-attribute average rating for every brand
//       Business use: full brand-by-attribute grid — the core competitive
//       perceptions map.
print("\n── Q3-A  Q24 attribute average by brand (shown base) ────────────────────");
DB.respondents.aggregate([
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
    n_rated:     { $sum: 1 },
    avg_value:   { $avg: "$brand_scores.attribute_ratings.value" },
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
]).forEach(printjson);


// Q3-B  Attribute leaders: for each attribute, which brand scores highest?
//       Business use: quickly identify where Cognizant leads or lags the field
//       on individual dimensions.
print("\n── Q3-B  Attribute leaders across brands ────────────────────────────────");
DB.respondents.aggregate([
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
    _id:    "$_id.attribute",
    leader: { $first: "$_id.brand" },
    leader_avg: { $first: { $round: ["$avg_value", 3] } },
    all_brands: { $push: {
      brand: "$_id.brand",
      avg:   { $round: ["$avg_value", 3] },
      n:     "$n"
    }}
  }},
  { $sort: { "_id": 1 } }
]).forEach(printjson);


// Q3-C  Cognizant attribute profile vs. one named competitor
//       Business use: direct head-to-head perceptions comparison for a
//       competitive brief or sales battlecard.
//       Change "Accenture" to any other brand as needed.
print("\n── Q3-C  Cognizant vs Accenture — Q24 attribute gap ─────────────────────");
DB.respondents.aggregate([
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
  // Pivot brand into separate fields per attribute
  { $group: {
    _id: { attribute: "$_id.attribute", attribute_idx: "$_id.attribute_idx" },
    cognizant_avg: {
      $max: { $cond: [{ $eq: ["$_id.brand", "Cognizant"]  }, { $round: ["$avg_value", 3] }, null] }
    },
    accenture_avg: {
      $max: { $cond: [{ $eq: ["$_id.brand", "Accenture"] }, { $round: ["$avg_value", 3] }, null] }
    },
    cognizant_n:   {
      $max: { $cond: [{ $eq: ["$_id.brand", "Cognizant"]  }, "$n", null] }
    }
  }},
  { $addFields: {
    gap_cognizant_minus_accenture: {
      $round: [{ $subtract: ["$cognizant_avg", "$accenture_avg"] }, 3]
    }
  }},
  { $sort: { "_id.attribute_idx": 1 } }
]).forEach(printjson);


// Q3-D  Q24 Financial Services cut: attribute ratings for Cognizant
//       among Financial Services respondents only
//       Business use: vertical-specific perceptions for FS pitch decks.
print("\n── Q3-D  Cognizant Q24 attributes — Financial Services respondents ───────");
DB.respondents.aggregate([
  { $match: { "profile.industry.code": 11 } },      // 11 = Financial Services
  { $unwind: "$brand_scores" },
  { $match: {
    "brand_scores.brand": "Cognizant",
    "brand_scores.shown": true
  }},
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
]).forEach(printjson);


// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 4 — Verbatims by theme and segment
// ─────────────────────────────────────────────────────────────────────────────
// NOTE: analysis.themes, analysis.resolved_brand, and analysis.sentiment are
// populated by the downstream NLP normalisation pass (not the ETL).
// The queries below use $regex for pre-NLP keyword search and field filters
// for post-NLP theme/sentiment/brand fields.

// Q4-A  Unmet-needs verbatims from Financial Services respondents (pre-NLP)
//       Business use: surface raw voice-of-customer pain points for a specific
//       vertical before the NLP pass runs.
print("\n── Q4-A  Q17 unmet-needs — Financial Services, keyword search ────────────");
DB.verbatims.find(
  {
    question_code: "Q17_UnmetNeeds",
    "respondent_snapshot.industry": 11,                // 11 = Financial Services
    text: { $regex: /AI|automation|data/i }
  },
  {
    _id: 0,
    respondent_uuid: 1,
    text: 1,
    "respondent_snapshot.seniority_label": 1,
    "respondent_snapshot.emp_count_label": 1
  }
).limit(20).forEach(printjson);


// Q4-B  After NLP: Q17 verbatims tagged with a specific theme, by industry
//       Business use: cross-tab "how many FS respondents mentioned talent gaps
//       as an unmet need?"
print("\n── Q4-B  Q17 post-NLP theme filter + industry count ─────────────────────");
DB.verbatims.aggregate([
  {
    $match: {
      question_code:    "Q17_UnmetNeeds",
      "analysis.themes": "talent"          // replace with any resolved theme tag
    }
  },
  {
    $group: {
      _id:   "$respondent_snapshot.industry_label",
      count: { $sum: 1 },
      samples: { $push: { $substrCP: ["$text", 0, 120] } }
    }
  },
  { $sort: { count: -1 } }
]).forEach(printjson);


// Q4-C  S8 unaided mentions resolved to Cognizant (post-NLP)
//       Business use: how many respondents unprompted named Cognizant?
//       Which segments are most likely to recall Cognizant unaided?
print("\n── Q4-C  S8 unaided — resolved to Cognizant by segment ──────────────────");
DB.verbatims.aggregate([
  {
    $match: {
      question_code:          "S8_Unaided",
      "analysis.resolved_brand": "Cognizant"
    }
  },
  {
    $group: {
      _id: {
        industry:   "$respondent_snapshot.industry_label",
        emp_count:  "$respondent_snapshot.emp_count_label"
      },
      n:       { $sum: 1 },
      mentions: { $push: "$text" }
    }
  },
  { $sort: { n: -1 } }
]).forEach(printjson);


// Q4-D  Q17 verbatims from high-AI-maturity respondents (maturity code ≥ 7)
//       Business use: understand what sophisticated AI buyers say they still
//       can't get from providers — Cognizant's highest-value prospect segment.
print("\n── Q4-D  Q17 unmet needs — high AI maturity respondents (code ≥ 7) ──────");
DB.verbatims.find(
  {
    question_code: "Q17_UnmetNeeds",
    "respondent_snapshot.ai_maturity_code": { $gte: 7 }
  },
  {
    _id: 0,
    respondent_uuid: 1,
    text: 1,
    char_count: 1,
    "respondent_snapshot.ai_maturity_code": 1,
    "respondent_snapshot.industry_label": 1
  }
).sort({ "respondent_snapshot.ai_maturity_code": -1, char_count: -1 })
 .limit(30).forEach(printjson);


// Q4-E  Q17 verbatim volume + avg length by segment
//       Business use: which segments gave the most detailed open-text feedback
//       (proxy for engagement / strength of opinion)?
print("\n── Q4-E  Q17 verbatim length by segment ─────────────────────────────────");
DB.verbatims.aggregate([
  { $match: { question_code: "Q17_UnmetNeeds" } },
  { $group: {
    _id: {
      industry:  "$respondent_snapshot.industry_label",
      seniority: "$respondent_snapshot.seniority_label"
    },
    n:             { $sum: 1 },
    avg_word_count: { $avg: "$word_count" },
    avg_char_count: { $avg: "$char_count" }
  }},
  { $addFields: {
    avg_word_count: { $round: ["$avg_word_count", 1] },
    avg_char_count: { $round: ["$avg_char_count", 0] }
  }},
  { $sort: { n: -1 } }
]).forEach(printjson);


// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 5 — White-space analysis
// ─────────────────────────────────────────────────────────────────────────────
// "White space" = attributes where a brand underperforms (≤ 0) relative to
// competitors — areas where buyers are unconvinced and a competitor could win.

// Q5-A  Attributes where Cognizant underperforms (avg Q24 value ≤ 0)
//       Business use: internal messaging audit — what claims aren't landing?
print("\n── Q5-A  Cognizant Q24 weakness attributes (avg ≤ 0) ────────────────────");
DB.respondents.aggregate([
  { $unwind: "$brand_scores" },
  { $match: {
    "brand_scores.brand": "Cognizant",
    "brand_scores.shown": true
  }},
  { $unwind: "$brand_scores.attribute_ratings" },
  { $match: { "brand_scores.attribute_ratings.response_status": "answered" } },
  { $group: {
    _id: {
      attribute:     "$brand_scores.attribute_ratings.attribute",
      attribute_idx: "$brand_scores.attribute_ratings.attribute_idx"
    },
    n:             { $sum: 1 },
    avg_value:     { $avg: "$brand_scores.attribute_ratings.value" },
    pct_negative:  {
      $avg: { $cond: [{ $lt: ["$brand_scores.attribute_ratings.value", 0] }, 1, 0] }
    }
  }},
  { $match: { avg_value: { $lte: 0 } } },
  { $addFields: {
    avg_value:    { $round: ["$avg_value", 3] },
    pct_negative: { $round: [{ $multiply: ["$pct_negative", 100] }, 1] }
  }},
  { $sort: { avg_value: 1 } }
]).forEach(printjson);


// Q5-B  Cross-brand white-space map: attributes where Cognizant trails the
//       field average by the largest margin
//       Business use: prioritise which perceptions gaps to close first.
print("\n── Q5-B  Cognizant perceptions gap vs field average per attribute ────────");
DB.respondents.aggregate([
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
    gap_vs_field: { $round: [{ $subtract: ["$cognizant_avg", "$field_avg"] }, 3] },
    cognizant_avg: { $round: ["$cognizant_avg", 3] },
    field_avg:     { $round: ["$field_avg", 3] }
  }},
  { $sort: { gap_vs_field: 1 } }                    // most negative gaps first
]).forEach(printjson);


// Q5-C  Segment-specific white space: Financial Services respondents,
//       Cognizant vs Accenture on each attribute
//       Business use: vertical battlecard — where to focus FS positioning.
print("\n── Q5-C  FS respondents: Cognizant vs Accenture attribute gap ───────────");
DB.respondents.aggregate([
  { $match: { "profile.industry.code": 11 } },
  { $unwind: "$brand_scores" },
  { $match: {
    "brand_scores.brand":  { $in: ["Cognizant", "Accenture"] },
    "brand_scores.shown":  true
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
]).forEach(printjson);


// Q5-D  "Not-answered" rate by brand per attribute among shown respondents
//       Business use: high not-answered rates signal low awareness / uncertainty —
//       itself a white-space signal distinct from negative ratings.
print("\n── Q5-D  Not-answered rate by attribute per brand ───────────────────────");
DB.respondents.aggregate([
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
  { $limit: 40 }                                     // top 40 highest-uncertainty slots
]).forEach(printjson);


// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 6 — Reusable aggregation patterns
// ─────────────────────────────────────────────────────────────────────────────

// PATTERN A — Shown-brand base expansion (paste at top of any brand pipeline)
//   Reduces 600 respondent documents → N×shown_brands rows.
//   Always filter shown: true before grouping on brand_scores fields.
//
//   { $unwind: "$brand_scores" },
//   { $match:  { "brand_scores.shown": true } }


// PATTERN B — Double-unwind for Q24 attribute analysis
//   Reduces shown rows → rows-per-attribute; filter answered before grouping.
//
//   { $unwind: "$brand_scores" },
//   { $match:  { "brand_scores.shown": true } },
//   { $unwind: "$brand_scores.attribute_ratings" },
//   { $match:  { "brand_scores.attribute_ratings.response_status": "answered" } }


// PATTERN C — Segment pre-filter before unwind (more efficient on large datasets)
//   Pushing the $match on profile fields BEFORE $unwind reduces the docs
//   MongoDB must unwind. Always do this when filtering to one segment.
//
//   { $match:  { "profile.industry.code": 11 } },    // ← BEFORE unwind
//   { $unwind: "$brand_scores" },
//   { $match:  { "brand_scores.shown": true } }


// PATTERN D — Cognizant-vs-market pivot within a single aggregation
//   Groups by (brand, segment), then re-groups to put Cognizant and market
//   average side-by-side in one row per segment.
//
//   { $group: {
//     _id:        { brand: "$brand_scores.brand", seg: "$profile.XXX.label" },
//     avg_metric: { $avg: "$brand_scores.YYY.code" }
//   }},
//   { $group: {
//     _id: "$_id.seg",
//     cognizant_metric: {
//       $max: { $cond: [{ $eq: ["$_id.brand","Cognizant"] }, "$avg_metric", null] }
//     },
//     market_avg: { $avg: "$avg_metric" }
//   }}


// PATTERN E — Verbatim segment cross-tab (fully self-contained)
//   Works pre-NLP (keyword filter) or post-NLP (theme filter).
print("\n── Pattern E demo: Q17 verbatim count by decision role ──────────────────");
DB.verbatims.aggregate([
  { $match: { question_code: "Q17_UnmetNeeds" } },
  { $group: {
    _id:   "$respondent_snapshot.decision_involvement_label",
    count: { $sum: 1 },
    avg_word_count: { $avg: "$word_count" }
  }},
  { $addFields: { avg_word_count: { $round: ["$avg_word_count", 1] } } },
  { $sort: { count: -1 } }
]).forEach(printjson);


// PATTERN F — S8 unaided mention frequency table (pre-NLP, raw text)
//   Shows raw mention counts before brand resolution — useful for auditing
//   NLP output or finding misspellings that need resolution rules.
print("\n── Pattern F: S8 unaided raw mention frequency ──────────────────────────");
DB.verbatims.aggregate([
  { $match: { question_code: "S8_Unaided" } },
  { $group: {
    _id:   { $toLower: { $trim: { input: "$text" } } },
    count: { $sum: 1 }
  }},
  { $sort: { count: -1 } },
  { $limit: 40 }
]).forEach(printjson);


// PATTERN G — Brand association word cloud input (Q22)
//   Q22 stores one text string per shown brand per respondent.
//   This extracts all associations for one brand for downstream word-frequency.
print("\n── Pattern G: Q22 brand associations for Cognizant ─────────────────────");
DB.respondents.aggregate([
  { $unwind: "$responses.q22_brand_associations" },
  { $match: { "responses.q22_brand_associations.brand": "Cognizant" } },
  { $project: {
    _id: 0,
    text: "$responses.q22_brand_associations.text",
    industry: "$profile.industry.label",
    seniority: "$profile.seniority.label"
  }}
]).forEach(printjson);

print("\n═══════════════════════════════════════════════════════════════════════════");
print("  sample_queries.js complete.");
print("═══════════════════════════════════════════════════════════════════════════");
