import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

for (const line of readFileSync(new URL(".env", import.meta.url), "utf8").split("\n")) {
  const separator = line.indexOf("=");
  if (separator < 1 || line.trimStart().startsWith("#")) continue;
  const key = line.slice(0, separator).trim();
  if (!process.env[key]) process.env[key] = line.slice(separator + 1).trim();
}

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)), "server-only": fileURLToPath(new URL("./src/test/server-only.ts", import.meta.url)) } },
  test: { environment: "node", coverage: { reporter: ["text", "html"] } },
});
