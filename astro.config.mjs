import { defineConfig } from "astro/config";

// Packet 1 starts from a real static Astro application. Do not add an adapter
// unless the architecture contract changes: Cloudflare Pages serves `dist/`.
export default defineConfig({
  output: "static",
});
