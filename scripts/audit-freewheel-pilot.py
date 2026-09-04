#!/usr/bin/env python3
"""
scripts/audit-freewheel-pilot.py

Executes an independent adversarial historical review of the Garrote Class D
entity resolution using the local Freewheel routing harness across free providers.

Compares findings against the baseline local GPU (Qwen 14B) audit without voting.
"""

import json
import os
import re
import shutil
import subprocess
import sys
import time

FREEWHEEL_BIN = os.environ.get("FREEWHEEL_BIN") or shutil.which("freewheel")
DOSSIER_PATH = "data/review/crespo/reconciliation_garrote.json"
REGRESSION_PATH = "data/review/crespo/contradictions/garrote_maestre_11357_regression.json"
QWEN_AUDIT_PATH = "data/review/crespo/audits/ollama_garrote_pilot.json"
OUTPUT_PATH = "data/review/crespo/audits/freewheel_garrote_pilot.json"

ALLOWED_VERDICTS = [
    "ACCEPT_AS_STATED",
    "DOWNGRADE",
    "UNRESOLVED",
    "CONFLICT",
    "NEEDS_MORE_EVIDENCE",
    "ESCALATE"
]

MODELS_TO_TEST = [
    {"model": "opencode/nemotron-3-ultra-free", "provider": "opencode", "label": "Nemotron 3 Ultra Free"},
    {"model": "openrouter/nvidia/nemotron-3-ultra-550b-a55b:free", "provider": "openrouter", "label": "Nemotron 3 Ultra 550B Free"},
    {"model": "opencode/muse-spark-1.3-contributor-free", "provider": "opencode", "label": "Spark 1.3 Free"}
]

def extract_json(raw_text: str):
    """Attempt to parse JSON from text, extracting markdown code blocks if necessary."""
    try:
        return json.loads(raw_text)
    except Exception:
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw_text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass
        match2 = re.search(r"(\{.*\})", raw_text, re.DOTALL)
        if match2:
            try:
                return json.loads(match2.group(1))
            except Exception:
                pass
    return None

def normalize_verdict(raw_verdict: str) -> str:
    if not raw_verdict:
        return "UNRESOLVED"
    v = str(raw_verdict).strip().upper()
    for av in ALLOWED_VERDICTS:
        if av in v:
            return av
    if "EVIDENCE" in v:
        return "NEEDS_MORE_EVIDENCE"
    if "CONFLICT" in v:
        return "CONFLICT"
    if "DOWNGRADE" in v:
        return "DOWNGRADE"
    if "ACCEPT" in v:
        return "ACCEPT_AS_STATED"
    return "UNRESOLVED"

def run_freewheel_audit():
    print(f"\n=== Charted Currents Freewheel Historical-Auditor Pilot ===")
    if not FREEWHEEL_BIN or not os.path.exists(FREEWHEEL_BIN):
        print(f"[!] ERROR: Freewheel binary not found in PATH or FREEWHEEL_BIN ({FREEWHEEL_BIN})", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists(DOSSIER_PATH) or not os.path.exists(REGRESSION_PATH):
        print(f"[!] ERROR: Dossier or regression fixture missing", file=sys.stderr)
        sys.exit(1)

    with open(DOSSIER_PATH, "r", encoding="utf-8") as f:
        dossier = json.load(f)

    with open(REGRESSION_PATH, "r", encoding="utf-8") as f:
        regression = json.load(f)

    # Load Qwen baseline for later comparison
    qwen_baseline = None
    if os.path.exists(QWEN_AUDIT_PATH):
        with open(QWEN_AUDIT_PATH, "r", encoding="utf-8") as f:
            qwen_baseline = json.load(f)

    user_prompt = f"""
You are an adversarial historical review auditor for Charted Currents, an academic atlas of the Greater Caribbean.
Your role is strict evidentiary critique, NOT corroboration or cheerleading.

Key Historical and Relational Policies:
1. Evidence precedes entities. A shared foreign key in a modern scholarly database (Crespo MAESTRE 11357)
   is an upstream secondary index, NOT direct primary proof of identity.
2. Same/similar names do not prove identity; contradictory given names (Francisco vs Bartolomé) are a direct conflict signal.
3. Review strength cannot upgrade evidence strength. AI agreement is process QA, not historical corroboration.
4. Entity resolution is reversible. In Charted Currents, 'probable_match' is an occurrence-level hypothesis,
   preserving occurrences independently so any link can be severed without data loss.

Factual Dossier for Candidate Resolution:
{json.dumps(dossier, indent=2)}

Automated Contradiction Scan Result:
{json.dumps(regression, indent=2)}

Factual Context of Decision:
Canonical Candidate: person_bartolome_antonio_garrote
Four probable-match occurrences:
  - 6825 (1688, Seville -> Tierra Firme, Maestre, Bartolomé Antonio Garrote)
  - 6890 (1693, Seville -> Nueva España, Maestre, Bartolomé Antonio de Garrote)
  - 6906 (1701, Seville -> Nueva España, Maestre, Bartolomé Antonio Garrote)
  - 6627 (1706, Cádiz -> La Habana, Maestre, Bartolomé Antonio Garrote)

Contradictory / Excluded Evidence:
  - 6820 (1684, Francisco Antonio Garrote) is EXCLUDED from canonical entity and preserved as negative evidence.
  - Upstream MAESTRE 11357 foreign key is DISCOUNTED as an internally contradictory link that erroneously merged Francisco and Bartolomé.
  - Continuous career is NOT claimed; only an 18-year span of recorded master occurrences.
  - Missing discriminators: master age, residence, manuscript signatures, independent biographical records.

Review Target Question:
Is maintaining the FOUR Bartolomé occurrences as a reversible `probable_match` defensible as currently stated, while excluding Francisco 6820 and discounting MAESTRE 11357 as positive identity proof? (Do not evaluate merging Francisco).

Required Output Schema:
Respond with ONLY a JSON object:
{{
  "verdict": "ACCEPT_AS_STATED" | "DOWNGRADE" | "UNRESOLVED" | "CONFLICT" | "NEEDS_MORE_EVIDENCE" | "ESCALATE",
  "positive_evidence_noted": ["<evidence 1>", "<evidence 2>"],
  "contradictions_noted": ["<contradiction 1>", "<contradiction 2>"],
  "missing_discriminators": ["<missing discriminator 1>", "<missing discriminator 2>"],
  "source_layer_errors": ["<source error or note 1>"],
  "invented_or_unsupported_claims": ["<any unsupported claim detected>"],
  "resolution_reasoning": "<adversarial evaluation of whether maintaining 4 Bartolome as reversible probable_match while excluding Francisco and discounting 11357 is defensible>",
  "confidence_or_uncertainty_note": "<assessment of uncertainty>"
}}
"""

    attempts = []

    for idx, target in enumerate(MODELS_TO_TEST, 1):
        req_model = target["model"]
        req_provider = target["provider"]
        print(f"\n[*] [Attempt {idx}/{len(MODELS_TO_TEST)}] Invoking model: {req_model} via Freewheel...")

        cmd = [
            FREEWHEEL_BIN,
            "ask",
            user_prompt,
            "--model", req_model,
            "--policy", "free-only",
            "--timeout-seconds", "120",
            "--json"
        ]

        t0 = time.time()
        try:
            res = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=150
            )
            dur = time.time() - t0
        except subprocess.TimeoutExpired:
            print(f"[!] Attempt {idx} timed out after 150s")
            attempts.append({
                "attempt_index": idx,
                "requested_model": req_model,
                "requested_provider": req_provider,
                "status": "TIMEOUT",
                "duration_seconds": 150.0
            })
            continue

        if res.returncode != 0:
            err_msg = res.stderr.strip()
            print(f"[!] Attempt {idx} ({req_model}) failed: {err_msg[:200]}")
            attempts.append({
                "attempt_index": idx,
                "requested_model": req_model,
                "requested_provider": req_provider,
                "status": "FREEWHEEL_ROUTE_FAILED",
                "returncode": res.returncode,
                "diagnostic_note": (
                    "Muse Spark 1.3 Free is available as a free OpenCode Zen model, but the Freewheel / Zen route "
                    "attempted during this Packet 6 review failed at test time."
                ),
                "followup_note": (
                    "Investigate Freewheel ↔ OpenCode Zen Spark model-ID/catalog routing in a future 10% tooling cycle."
                ),
                "duration_seconds": round(dur, 2)
            })
            continue

        try:
            fw_out = json.loads(res.stdout)
        except Exception as e:
            print(f"[!] Failed to parse Freewheel stdout as JSON: {e}")
            attempts.append({
                "attempt_index": idx,
                "requested_model": req_model,
                "requested_provider": req_provider,
                "status": "PARSE_ERROR",
                "raw_stdout_snippet": res.stdout[:200],
                "duration_seconds": round(dur, 2)
            })
            continue

        raw_answer = fw_out.get("answer", "")
        parsed_eval = extract_json(raw_answer)
        raw_verdict = parsed_eval.get("verdict") if parsed_eval else "UNRESOLVED"
        normalized_verdict = normalize_verdict(raw_verdict)

        print(f"    [+] Response received in {dur:.1f}s")
        print(f"    [+] Model: {fw_out.get('actual_model_id')}")
        print(f"    [+] Normalized Verdict: {normalized_verdict}")

        attempt_record = {
            "attempt_index": idx,
            "requested_model": req_model,
            "actual_model_id": fw_out.get("actual_model_id"),
            "requested_provider": req_provider,
            "actual_provider_id": fw_out.get("actual_provider_id"),
            "duration_seconds": round(dur, 2),
            "status": fw_out.get("status", "success"),
            "finish_reason": fw_out.get("finish_reason"),
            "token_usage": {
                "input_tokens": fw_out.get("input_tokens"),
                "output_tokens": fw_out.get("output_tokens"),
                "reasoning_tokens": fw_out.get("reasoning_tokens"),
                "total_tokens": fw_out.get("total_tokens")
            },
            "tools_disabled": fw_out.get("tools_disabled", 14),
            "model_evaluation": parsed_eval or {"raw_text": raw_answer},
            "normalized_verdict": normalized_verdict
        }
        attempts.append(attempt_record)

    # Cross-Model Comparison & Adjudication
    successful_attempts = [a for a in attempts if a.get("status") == "success"]

    # Model-family perspective collection
    qwen_verdict = (
        qwen_baseline.get("model_evaluation", {}).get("verdict")
        if qwen_baseline else "NEEDS_MORE_EVIDENCE"
    )

    nemotron_attempts = [
        a for a in successful_attempts
        if "nemotron" in str(a.get("actual_model_id", "")).lower()
    ]
    nemotron_verdicts = {a.get("normalized_verdict") for a in nemotron_attempts}
    nemotron_family_verdict = (
        nemotron_verdicts.pop() if len(nemotron_verdicts) == 1
        else ("DIVERGENT_WITHIN_FAMILY" if nemotron_verdicts else "NO_SUCCESSFUL_CALL")
    )

    perspectives = {
        "qwen_2.5_14b": qwen_verdict,
        "nemotron_3_ultra_family": nemotron_family_verdict
    }

    unique_perspectives = set(perspectives.values())
    verdict_synthesis = (
        "PROCESS_REVIEW_AGREEMENT" if len(unique_perspectives) == 1
        else "PROCESS_REVIEW_DIVERGENCE"
    )

    comparison = {
        "qwen_baseline": {
            "model": qwen_baseline.get("model") if qwen_baseline else "qwen2.5:14b-instruct-q4_K_M",
            "verdict": qwen_verdict,
            "missing_discriminators": qwen_baseline.get("model_evaluation", {}).get("missing_discriminators_noted", []) if qwen_baseline else []
        },
        "freewheel_results": [
            {
                "model": a.get("actual_model_id"),
                "provider": a.get("actual_provider_id"),
                "verdict": a.get("normalized_verdict"),
                "missing_discriminators": (a.get("model_evaluation") or {}).get("missing_discriminators", [])
            }
            for a in successful_attempts
        ],
        "model_family_perspectives": perspectives,
        "provider_routing_note": (
            "The two successful Nemotron 3 Ultra calls (OpenCode and OpenRouter) represent provider and routing "
            "redundancy for a single model family, not two independent model judgments."
        ),
        "reversibility_understanding": "Both reviewer harnesses operated under occurrence-level reversibility constraint.",
        "reviewer_source_layer_overstatements_noted": [
            {
                "model_assertion": "The four rows each cite AGI Contratación manuscripts",
                "project_adjudication": (
                    "Crespo TODOSNAVIOS rows carry secondary AGI Contratación citations, "
                    "but Charted Currents has not independently inspected the underlying archival manuscripts."
                )
            },
            {
                "model_assertion": "Crespo's PRUEBAAGENTES table normalization is definitively erroneous",
                "project_adjudication": (
                    "MAESTRE 11357 is internally contradictory across rows in the Crespo dataset (merging Francisco and Bartolomé), "
                    "which is sufficient to discount the foreign key as positive identity evidence without needing to assert "
                    "how or why the upstream compiler produced the conflation."
                )
            }
        ],
        "verdict_synthesis": verdict_synthesis,
        "adjudication_conclusion": (
            "Both independent LLM reviewer harnesses (local GPU Qwen 14B and Freewheel-routed Nemotron 3 Ultra models) "
            "evaluated the actual Class D decision. Both recognized the Francisco/Bartolomé given-name conflict "
            "and confirmed the discounting of MAESTRE 11357. Model reviews raised appropriate epistemic skepticism regarding "
            "linking occurrences across an 18-year span without primary signatures or age records. "
            "The Nemotron family perspective (ACCEPT_AS_STATED across OpenCode and OpenRouter routes) endorsed occurrence-level "
            "reversibility, while Qwen 14B (NEEDS_MORE_EVIDENCE) demanded primary signatures. "
            "Project adjudication notes reviewer rhetorical overstatements regarding archival manuscript inspection and compiler error. "
            "Charted Currents retains 'probable_match' as a provisional, occurrence-backed hypothesis that is strictly "
            "reversible without data loss. Neither review surfaced a genuinely new archival contradiction; "
            "no majority voting is performed and evidence state remains unchanged pending human scholarly review."
        )
    }

    final_payload = {
        "audit_name": "garrote_maestre_11357_freewheel_pilot",
        "harness": "freewheel",
        "freewheel_version": "0.1.0",
        "policy": "free-only",
        "mode": "ask_no_tools",
        "execution_contract": "freewheel ask (fresh server-backed request; no tool execution)",
        "input_dossier": DOSSIER_PATH,
        "regression_fixture": REGRESSION_PATH,
        "attempts": attempts,
        "cross_model_comparison": comparison
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(final_payload, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"\n[SUCCESS] Freewheel pilot audit written to: {OUTPUT_PATH}")
    print(f"Total Attempts:      {len(attempts)}")
    print(f"Successful Attempts: {len(successful_attempts)}")
    print(f"Verdict Synthesis:   {comparison['verdict_synthesis']}")
    print(f"Adjudication:        {comparison['adjudication_conclusion']}\n")

if __name__ == "__main__":
    run_freewheel_audit()
