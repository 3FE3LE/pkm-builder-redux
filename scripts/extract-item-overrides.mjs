import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DOC_PATH = path.join(ROOT, "Documentation", "Item Changes.txt");
const OUTPUT_DIR = path.join(ROOT, "data", "reference");

function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/['’.:]/g, "")
    .replace(/\s+/g, "-");
}

function clean(value) {
  return value
    .replace(/^['"]|['"]$/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseItemOverrides(text) {
  const overrides = {};
  const lines = text.replace(/\r/g, "").split("\n");
  let mode = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (line === "The following items have been replaced for new items:") {
      mode = "replacements";
      continue;
    }

    if (line === "The following items have had adjustments to their costs:") {
      mode = "costs";
      continue;
    }

    if (line === 'The following items now have a "Use" option like evolutionary stones:') {
      mode = "use";
      continue;
    }

    if (/^=+$/m.test(line)) {
      mode = null;
      continue;
    }

    if (mode === "replacements") {
      const match = line.match(/^-\s+(.+?)\s+->\s+(.+)$/);
      if (!match) {
        continue;
      }
      const from = clean(match[1]);
      const to = clean(match[2]);
      const key = normalize(from);
      overrides[key] = {
        ...(overrides[key] ?? {}),
        name: from,
        replacedBy: to,
      };
      continue;
    }

    if (mode === "costs") {
      const match = line.match(/^-\s+(.+?)\s+\(\$(\d+)\s+->\s+\$(\d+)\)$/);
      if (!match) {
        continue;
      }
      const itemName = clean(match[1]);
      const key = normalize(itemName);
      overrides[key] = {
        ...(overrides[key] ?? {}),
        name: itemName,
        cost: {
          from: Number(match[2]),
          to: Number(match[3]),
        },
      };
      continue;
    }

    if (mode === "use") {
      const match = line.match(/^-\s+(.+)$/);
      if (!match) {
        continue;
      }
      const itemName = clean(match[1]);
      const key = normalize(itemName);
      overrides[key] = {
        ...(overrides[key] ?? {}),
        name: itemName,
        hasUseOption: true,
      };
    }
  }

  return overrides;
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const source = await readFile(DOC_PATH, "utf8");
  const overrides = parseItemOverrides(source);

  await writeFile(path.join(OUTPUT_DIR, "item-redux-overrides.json"), JSON.stringify(overrides, null, 2));
  await writeFile(path.join(OUTPUT_DIR, "ability-redux-overrides.json"), JSON.stringify({}, null, 2));

  console.log("Wrote data/reference/item-redux-overrides.json");
  console.log("Wrote data/reference/ability-redux-overrides.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
