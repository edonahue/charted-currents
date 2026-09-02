#!/usr/bin/env python3
"""Manage the local ignored packet marker used by Charted Currents Antigravity hooks."""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AGENT_DIR = ROOT / ".agent"
MARKER = AGENT_DIR / "active-packet.json"
LOG_DIR = AGENT_DIR / "command-log"


def git(*args: str) -> str:
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def save(marker: dict) -> None:
    AGENT_DIR.mkdir(parents=True, exist_ok=True)
    MARKER.write_text(json.dumps(marker, indent=2) + "\n", encoding="utf-8")


def successful_commands() -> list[str]:
    commands: list[str] = []
    if not LOG_DIR.exists():
        return commands
    for path in LOG_DIR.glob("*.json"):
        try:
            entry = load_json(path)
        except Exception:
            continue
        if entry.get("result") == "passed":
            commands.append(str(entry.get("command", "")))
    return commands


def missing_required(marker: dict) -> list[str]:
    passed = successful_commands()
    required = [str(x) for x in marker.get("required_commands", []) if str(x).strip()]
    return [req for req in required if not any(req in command for command in passed)]


def resolve_contract(raw: str) -> Path:
    path = Path(raw)
    if not path.is_absolute():
        path = ROOT / path
    return path


def start(args: argparse.Namespace) -> None:
    contract_path = resolve_contract(args.contract)
    contract = load_json(contract_path)
    branch = git("rev-parse", "--abbrev-ref", "HEAD")
    expected = args.branch or contract.get("working_branch")
    if branch == "main":
        raise SystemExit("Refusing to activate a substantial packet on main. Start/use the packet feature branch or worktree first.")
    if expected and branch != expected:
        raise SystemExit(f"Current branch is {branch!r}, contract expects {expected!r}.")

    AGENT_DIR.mkdir(parents=True, exist_ok=True)
    if LOG_DIR.exists():
        for path in LOG_DIR.glob("*.json"):
            path.unlink()

    marker = {
        "packet": contract.get("packet"),
        "title": contract.get("title"),
        "contract": str(contract_path.relative_to(ROOT)) if contract_path.is_relative_to(ROOT) else str(contract_path),
        "base_commit": contract.get("base_commit"),
        "working_branch": expected or branch,
        "state": "implementing",
        "required_commands": contract.get("required_commands", []),
    }
    save(marker)
    print(f"Activated packet {marker.get('packet')} on {branch} in IMPLEMENTING state.")
    print(f"Local marker: {MARKER.relative_to(ROOT)} (gitignored)")


def status(_: argparse.Namespace) -> None:
    if not MARKER.exists():
        print("No active local packet marker.")
        return
    marker = load_json(MARKER)
    print(json.dumps(marker, indent=2))
    missing = missing_required(marker)
    if missing:
        print("Missing successful proof commands:")
        for item in missing:
            print(f"  - {item}")
    else:
        print("All configured required commands have been observed successfully.")


def self_verified(_: argparse.Namespace) -> None:
    if not MARKER.exists():
        raise SystemExit("No active packet marker.")
    marker = load_json(MARKER)
    branch = git("rev-parse", "--abbrev-ref", "HEAD")
    if branch != marker.get("working_branch"):
        raise SystemExit(f"Current branch {branch!r} does not match active packet branch {marker.get('working_branch')!r}.")

    missing = missing_required(marker)
    if missing:
        raise SystemExit("Cannot mark SELF_VERIFIED; missing successful proof commands: " + "; ".join(missing))

    if git("status", "--porcelain"):
        raise SystemExit("Cannot mark SELF_VERIFIED with a dirty working tree. Commit/review intended packet changes first.")

    marker["state"] = "review_pending"
    marker["self_verified_head"] = git("rev-parse", "HEAD")
    save(marker)
    print("Packet moved to REVIEW_PENDING locally.")
    print("This does NOT mark the packet ACCEPTED. External maintainer/reviewer acceptance is still required.")


def accept(_: argparse.Namespace) -> None:
    if not MARKER.exists():
        raise SystemExit("No active packet marker.")
    marker = load_json(MARKER)
    if marker.get("state") != "review_pending":
        raise SystemExit("Packet must be REVIEW_PENDING before external acceptance is recorded.")
    marker["state"] = "accepted"
    marker["accepted_head"] = git("rev-parse", "HEAD")
    save(marker)
    print("Recorded local ACCEPTED state. This command is intended for the maintainer after external review.")


def deployed(_: argparse.Namespace) -> None:
    if not MARKER.exists():
        raise SystemExit("No active packet marker.")
    marker = load_json(MARKER)
    if marker.get("state") != "accepted":
        raise SystemExit("Packet must be ACCEPTED before DEPLOYED can be recorded.")
    marker["state"] = "deployed"
    marker["deployed_head"] = git("rev-parse", "HEAD")
    save(marker)
    print("Recorded DEPLOYED state. Ensure hosted verification was actually observed before using this command.")


def clear(_: argparse.Namespace) -> None:
    if MARKER.exists():
        MARKER.unlink()
    print("Cleared local active packet marker. Command history under .agent/ is retained locally unless removed manually.")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)

    p_start = sub.add_parser("start")
    p_start.add_argument("--contract", required=True)
    p_start.add_argument("--branch")
    p_start.set_defaults(func=start)

    p_status = sub.add_parser("status")
    p_status.set_defaults(func=status)

    p_self = sub.add_parser("self-verified")
    p_self.set_defaults(func=self_verified)

    p_accept = sub.add_parser("accept", help="Maintainer-only transition after external review")
    p_accept.set_defaults(func=accept)

    p_deployed = sub.add_parser("deployed", help="Record only after hosted verification")
    p_deployed.set_defaults(func=deployed)

    p_clear = sub.add_parser("clear")
    p_clear.set_defaults(func=clear)
    return parser


if __name__ == "__main__":
    parsed = build_parser().parse_args()
    parsed.func(parsed)
