#!/usr/bin/env node
/**
 * scripts/scan-private-leaks.mjs
 *
 * Lightweight, zero-dependency scanner for private/workstation path leaks
 * in Git-tracked files. Enforces public-private boundary in preflight/CI.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();

// Patterns that should never appear in public git-tracked files
const FORBIDDEN_PATTERNS = [
  { pattern: /file:\/\/\/home\//, name: "file:///home/ URI" },
  { pattern: /\/home\/(?!(?:username|<user>|user|node|runner)\b)[a-zA-Z0-9_.-]+\//i, name: "Absolute Unix user home path" },
  { pattern: /C:\\Users\\/i, name: "Windows user path" },
  { pattern: /\.gemini\/antigravity-cli\/brain\//, name: "Antigravity brain scratch path" },
  { pattern: /100\.\d{1,3}\.\d{1,3}\.\d{1,3}/, name: "Tailscale / CGNAT IP pattern" },
];

// Files / extensions ignored during scanning
const IGNORED_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico",
  ".pdf", ".zip", ".tar", ".gz", ".mdb", ".sqlite",
  ".parquet", ".pmtiles", ".woff", ".woff2", ".ttf"
]);

function getTrackedFiles() {
  try {
    const stdout = execSync("git ls-files", { cwd: repoRoot, encoding: "utf-8" });
    return stdout.split("\n").map(f => f.trim()).filter(Boolean);
  } catch (err) {
    console.error("[ERROR] Failed to get tracked files from git:", err);
    process.exit(1);
  }
}

function scan() {
  const trackedFiles = getTrackedFiles();
  const violations = [];

  for (const relPath of trackedFiles) {
    const ext = path.extname(relPath).toLowerCase();
    if (IGNORED_EXTENSIONS.has(ext)) {
      continue;
    }

    const fullPath = path.join(repoRoot, relPath);
    if (!fs.existsSync(fullPath)) {
      continue;
    }

    try {
      const content = fs.readFileSync(fullPath, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, idx) => {
        // Skip scan-private-leaks.mjs regex definitions itself
        if (relPath.includes("scan-private-leaks.mjs")) return;

        for (const { pattern, name } of FORBIDDEN_PATTERNS) {
          if (pattern.test(line)) {
            violations.push({
              file: relPath,
              line: idx + 1,
              rule: name,
              snippet: line.trim()
            });
          }
        }
      });
    } catch {
      // Ignore binary or unreadable files
    }
  }

  if (violations.length > 0) {
    console.error(`\n[FAIL] Found ${violations.length} private workstation path leak(s):`);
    for (const v of violations) {
      console.error(`  - ${v.file}:${v.line} [${v.rule}] -> ${v.snippet}`);
    }
    process.exit(1);
  }

  console.log(`[PASS] Private leak scan passed: 0 workstation paths found in ${trackedFiles.length} tracked files.`);
}

scan();
