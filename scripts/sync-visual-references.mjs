import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const repoRoot = process.cwd();
const boardRoot = resolve(repoRoot, "design/reference-board");
const manifestPath = resolve(boardRoot, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const checksums = {};

const userAgent =
  "ChartedCurrents/0.0.0 visual-reference sync (https://github.com/edonahue/charted-currents)";

for (const reference of manifest.references) {
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("format", "json");
  api.searchParams.set("prop", "imageinfo");
  api.searchParams.set("iiprop", "url|mime|size");
  api.searchParams.set("iiurlwidth", String(manifest.thumbnail_width));
  api.searchParams.set("titles", `File:${reference.commons_file}`);

  const metadataResponse = await fetch(api, {
    headers: { "User-Agent": userAgent },
  });
  if (!metadataResponse.ok) {
    throw new Error(`Commons metadata request failed for ${reference.id}: ${metadataResponse.status}`);
  }

  const metadata = await metadataResponse.json();
  const page = Object.values(metadata.query?.pages ?? {})[0];
  const imageInfo = page?.imageinfo?.[0];
  const imageUrl = imageInfo?.thumburl ?? imageInfo?.url;

  if (!imageUrl) {
    throw new Error(`No Commons image URL returned for ${reference.id}`);
  }

  const imageResponse = await fetch(imageUrl, {
    headers: { "User-Agent": userAgent },
  });
  if (!imageResponse.ok) {
    throw new Error(`Image download failed for ${reference.id}: ${imageResponse.status}`);
  }

  const contentType = imageResponse.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Unexpected content type for ${reference.id}: ${contentType || "unknown"}`);
  }

  const bytes = Buffer.from(await imageResponse.arrayBuffer());
  const destination = resolve(boardRoot, reference.local_file);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, bytes);

  checksums[reference.id] = {
    local_file: reference.local_file,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.length,
    content_type: contentType,
    commons_file: reference.commons_file,
  };

  console.log(`synced ${reference.id} -> ${reference.local_file}`);
}

await writeFile(
  resolve(boardRoot, "checksums.json"),
  `${JSON.stringify({ generated_from: "manifest.json", references: checksums }, null, 2)}\n`,
);

console.log("Visual reference board synced. Review the images and manifest before committing generated assets.");
