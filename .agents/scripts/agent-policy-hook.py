#!/usr/bin/env python3
"""Proxy for Charted Currents agent policy hook."""

import os
import sys

script_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "scripts", "agent-policy-hook.py"))
if os.path.exists(script_path):
    with open(script_path, "rb") as f:
        code = compile(f.read(), script_path, "exec")
        exec(code, {"__file__": script_path, "__name__": "__main__"})
else:
    sys.exit(0)
