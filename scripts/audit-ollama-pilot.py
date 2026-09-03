#!/usr/bin/env python3
"""
scripts/audit-ollama-pilot.py

Adversarial historical-review pilot using local Ollama with Qwen 2.5 14B
running on the local RTX 4060 Ti.

Audits the Garrote MAESTRE 11357 reconciliation dossier under Charted Currents
scholarly integrity standards (docs/SCHOLARLY_INTEGRITY.md and docs/HISTORICAL_ASSERTION_POLICY.md).
"""

import json
import os
import sys
import urllib.request
import urllib.error

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen2.5:14b-instruct-q4_K_M"

DOSSIER_PATH = "data/review/crespo/reconciliation_garrote.json"
REGRESSION_PATH = "data/review/crespo/contradictions/garrote_maestre_11357_regression.json"
OUTPUT_PATH = "data/review/crespo/audits/ollama_garrote_pilot.json"

def check_ollama_alive() -> bool:
    try:
        req = urllib.request.Request("http://localhost:11434/api/tags")
        with urllib.request.urlopen(req, timeout=3) as resp:
            return resp.status == 200
    except Exception:
        return False

def run_ollama_audit():
    print(f"\n=== Charted Currents Local GPU Historical-Auditor Pilot ===")
    print(f"Target Model: {MODEL_NAME}")

    if not check_ollama_alive():
        print("[!] ERROR: Ollama is not accessible on localhost:11434.", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists(DOSSIER_PATH):
        print(f"[!] ERROR: Dossier not found at {DOSSIER_PATH}", file=sys.stderr)
        sys.exit(1)

    with open(DOSSIER_PATH, "r", encoding="utf-8") as f:
        dossier = json.load(f)

    with open(REGRESSION_PATH, "r", encoding="utf-8") as f:
        regression = json.load(f)

    system_prompt = (
        "You are an adversarial historical auditor for Charted Currents, an academic atlas of the Greater Caribbean.\n"
        "Your role is strict evidentiary critique, NOT corroboration or cheerleading.\n\n"
        "Key Historical Invariants:\n"
        "1. Evidence precedes entities. A shared foreign key in a modern scholarly database (e.g. Crespo MAESTRE 11357)\n"
        "   is an upstream scholarly assertion, NOT direct primary proof of identity.\n"
        "2. Same/similar names do not prove identity; contradictory given names (Francisco vs Bartolomé) are a direct conflict signal.\n"
        "3. Review strength cannot upgrade evidence strength. AI agreement is process QA, not historical corroboration.\n"
        "4. You must NEVER merge contradictory entities or invent biographical bridges (e.g. claiming 'Francisco must have used an alias' without proof).\n"
        "5. Output must be valid JSON."
    )

    user_prompt = f"""
Audit the following historical candidate dossier from the Crespo Atlantic dataset:

{json.dumps(dossier, indent=2)}

Automated Contradiction Scan Result:
{json.dumps(regression, indent=2)}

Task:
Evaluate whether linking `occ_person_crespo_6820_master` (Francisco Antonio Garrote, 1684) into the canonical entity `person_bartolome_antonio_garrote` is justified.

Respond ONLY with a JSON object in this exact schema:
{{
  "verdict": "CONFLICT_SIGNAL" | "PASS" | "UNRESOLVED",
  "evidence_summary": "<summary of candidate records and discrepancies>",
  "upstream_fk_evaluation": "<critique of MAESTRE 11357 reliability>",
  "recommended_resolution_posture": "<how the project should handle Francisco vs Bartolomé>",
  "reversibility_assessment": "<assessment of whether the identity should be reversible>",
  "epistemic_class": "Class D"
}}
"""

    payload = {
        "model": MODEL_NAME,
        "prompt": f"{system_prompt}\n\n{user_prompt}",
        "format": "json",
        "stream": False,
        "options": {
            "temperature": 0.1,
            "num_predict": 1024
        }
    }

    print(f"[*] Dispatching prompt to {MODEL_NAME} via Ollama...")
    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        OLLAMA_URL,
        data=req_data,
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw_response = resp.read().decode("utf-8")
            resp_json = json.loads(raw_response)
            model_output = json.loads(resp_json.get("response", "{}"))
    except Exception as e:
        print(f"[!] Failed to call Ollama: {e}", file=sys.stderr)
        sys.exit(1)

    # Save output
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    audit_record = {
        "audit_name": "garrote_maestre_11357_adversarial_pilot",
        "model": MODEL_NAME,
        "input_dossier": DOSSIER_PATH,
        "model_evaluation": model_output
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(audit_record, f, indent=2)
        f.write("\n")

    print(f"[SUCCESS] Audit completed and written to: {OUTPUT_PATH}\n")
    print(f"Model Verdict: {model_output.get('verdict')}")
    print(f"Summary:       {model_output.get('evidence_summary')}")
    print(f"Critique:      {model_output.get('upstream_fk_evaluation')}")
    print(f"Posture:       {model_output.get('recommended_resolution_posture')}")

if __name__ == "__main__":
    run_ollama_audit()
