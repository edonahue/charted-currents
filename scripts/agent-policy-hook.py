#!/usr/bin/env python3
"""Workspace Antigravity hook for active Charted Currents packet sessions.

The hook is inert unless `.agent/active-packet.json` exists. The `.agent/`
directory is gitignored and is controlled locally by the maintainer/worktree.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path


def emit(payload: dict) -> None:
    print(json.dumps(payload, separators=(",", ":")))


def stdin_json() -> dict:
    try:
        return json.load(sys.stdin)
    except Exception:
        return {}


def workspace(payload: dict) -> Path:
    paths = payload.get("workspacePaths") or []
    return Path(paths[0]) if paths else Path.cwd()


def marker_path(root: Path) -> Path:
    return root / ".agent" / "active-packet.json"


def load_marker(root: Path) -> dict | None:
    path = marker_path(root)
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def log_dir(root: Path) -> Path:
    path = root / ".agent" / "command-log"
    path.mkdir(parents=True, exist_ok=True)
    return path


def git(root: Path, *args: str) -> str:
    try:
        return subprocess.check_output(["git", *args], cwd=root, text=True, stderr=subprocess.DEVNULL).strip()
    except Exception:
        return "UNAVAILABLE"


def pre_tool(payload: dict) -> None:
    root = workspace(payload)
    marker = load_marker(root)
    if not marker:
        emit({"decision": "allow"})
        return

    call = payload.get("toolCall") or {}
    if call.get("name") != "run_command":
        emit({"decision": "allow"})
        return

    args = call.get("args") or {}
    command = str(args.get("CommandLine") or "")
    step = str(payload.get("stepIdx", "unknown"))
    state = str(marker.get("state", "implementing"))
    current_branch = git(root, "rev-parse", "--abbrev-ref", "HEAD")

    (log_dir(root) / f"{step}.json").write_text(
        json.dumps({"step": step, "command": command, "result": "pending"}, indent=2),
        encoding="utf-8",
    )

    destructive = [r"(^|[;&|]\s*)sudo\b", r"(^|[;&|]\s*)rm\s+-rf\b", r"\bgit\s+clean\b", r"\bgit\s+reset\b"]
    if any(re.search(pattern, command) for pattern in destructive):
        emit({"decision": "force_ask", "reason": "Active packet: destructive/privileged command requires explicit maintainer approval."})
        return

    main_switch = re.search(r"\bgit\s+(?:checkout|switch)\s+(?:--\s+)?main\b", command)
    main_merge = current_branch == "main" and re.search(r"\bgit\s+merge\b", command)
    main_push = re.search(r"\bgit\s+push(?:\s+[^;&|]*)?\s+(?:origin\s+)?main(?:\s|$)", command)
    commit_on_main = current_branch == "main" and re.search(r"\bgit\s+commit\b", command)

    if state not in {"accepted", "deployed"}:
        if main_switch or main_merge or main_push or commit_on_main:
            emit({
                "decision": "deny",
                "reason": "Active packet is not ACCEPTED. Stay on the feature branch/worktree; push the feature branch and hand off for external review instead of changing main.",
            })
            return
    elif main_push:
        emit({"decision": "force_ask", "reason": "Packet is accepted, but pushing main is still a human-visible publication gate."})
        return

    emit({"decision": "allow"})


def post_tool(payload: dict) -> None:
    root = workspace(payload)
    marker = load_marker(root)
    if not marker:
        emit({})
        return

    step = str(payload.get("stepIdx", "unknown"))
    path = log_dir(root) / f"{step}.json"
    if path.exists():
        try:
            entry = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            entry = {"step": step, "command": "unknown"}
        entry["result"] = "failed" if payload.get("error") else "passed"
        entry["error"] = payload.get("error") or ""
        path.write_text(json.dumps(entry, indent=2), encoding="utf-8")
    emit({})


def successful_commands(root: Path) -> list[str]:
    commands: list[str] = []
    directory = root / ".agent" / "command-log"
    if not directory.exists():
        return commands
    for path in directory.glob("*.json"):
        try:
            entry = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        if entry.get("result") == "passed":
            commands.append(str(entry.get("command", "")))
    return commands


def stop(payload: dict) -> None:
    root = workspace(payload)
    marker = load_marker(root)
    if not marker:
        emit({"decision": "allow"})
        return

    if not payload.get("fullyIdle", True):
        emit({"decision": "continue", "reason": "Active packet still has background work running. Wait for it and inspect the result before stopping."})
        return

    state = str(marker.get("state", "implementing"))
    if state in {"review_pending", "accepted", "deployed"}:
        emit({"decision": "allow"})
        return

    required = [str(x) for x in marker.get("required_commands", []) if str(x).strip()]
    passed = successful_commands(root)
    missing = [req for req in required if not any(req in command for command in passed)]

    if missing:
        emit({
            "decision": "continue",
            "reason": "Packet closeout gate is incomplete. Successful observations are missing for: " + "; ".join(missing) + ". Run the exact required proof or report a genuine blocker; do not weaken the packet contract.",
        })
        return

    emit({
        "decision": "continue",
        "reason": "Required local proof commands have been observed, but the packet is still IMPLEMENTING. Run `python3 scripts/agent-packet-state.py self-verified`, inspect `npm run packet:report`, then hand off as REVIEW_PENDING. Do not declare the packet accepted.",
    })


def main() -> None:
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    payload = stdin_json()
    if mode == "pre":
        pre_tool(payload)
    elif mode == "post":
        post_tool(payload)
    elif mode == "stop":
        stop(payload)
    else:
        emit({})


if __name__ == "__main__":
    main()
