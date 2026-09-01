import { existsSync, readFileSync } from "node:fs";

const MIN_NODE = [22, 19, 0];
const currentNode = process.versions.node.split(".").map(Number);

function atLeast([major, minor, patch], [minMajor, minMinor, minPatch]) {
  if (major !== minMajor) return major > minMajor;
  if (minor !== minMinor) return minor > minMinor;
  return patch >= minPatch;
}

const requiredFiles = [
  "BOOTSTRAP_MANIFEST.txt",
  "GEMINI.md",
  "docs/FIRST_SESSIONS.md",
  "docs/KICKOFF.md",
  "docs/PACKET1_DIRECTION.md",
  "docs/VISUAL_QUALITY_CONTRACT.md",
  "docs/VISUAL_ASSET_STRATEGY.md",
  "docs/BASEMAP_RUNTIME.md",
  "design/MODERN_INTERACTION_REFERENCES.md",
  "design/reference-board/manifest.json",
  "design/reviews/README.md",
  "scripts/sync-visual-references.mjs",
  "astro.config.mjs",
  "tsconfig.json",
  "src/pages/index.astro",
  "src/layouts/BaseLayout.astro",
  "src/components/map/MapViewport.astro",
  "src/components/inspector/EntityInspector.astro",
  "src/components/timeline/TimelineRail.astro",
  "src/components/evidence/EvidenceBadge.astro",
  "src/lib/domain/types.ts",
  "src/lib/map/config.ts",
  "src/lib/map/visualPolicy.ts",
  "src/lib/map/applyVisualPolicy.ts",
  "src/lib/map/developmentAnchors.ts",
  "src/lib/time/config.ts",
  "src/lib/paths.ts",
  "src/lib/state/selection.ts",
  "src/lib/data/loadPublished.ts",
  "public/data/README.md",
  "public/robots.txt",
];

const failures = [];

if (!atLeast(currentNode, MIN_NODE)) {
  failures.push(`Node ${process.versions.node} is too old; use Node >=22.19.0 (see .nvmrc).`);
}

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing required bootstrap file: ${file}`);
}

if (existsSync("package.json")) {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  for (const script of ["preflight", "dev", "check", "build", "verify", "refs:sync"]) {
    if (!packageJson.scripts?.[script]) failures.push(`package.json is missing script: ${script}`);
  }
}

if (failures.length > 0) {
  console.error("Charted Currents preflight failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Charted Currents preflight OK (Node ${process.versions.node}).`);
console.log(
  existsSync("package-lock.json")
    ? "package-lock.json present."
    : "package-lock.json not present yet; npm install should create it and Packet 1 should keep it.",
);
console.log(
  existsSync("node_modules")
    ? "Dependencies appear installed; run npm run refs:sync, then npm run verify."
    : "Dependencies are not installed yet; run npm install, npm run refs:sync, then npm run verify.",
);
