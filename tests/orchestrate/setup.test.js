import assert from "node:assert/strict";
import { before, test } from "node:test";
import { isConfigValid, loadConfig } from "../../src/orchestrate/config.js";
import fs from "node:fs";
import path from "node:path";

const tmp = path.join(process.cwd(), "tests/.tmp");

before(() => fs.mkdirSync(tmp, { recursive: true }));

test("valid config passes", () => {
  const ok = isConfigValid({
    default_target: "opencode",
    targets: { opencode: { command: "oh-my-opencode" } },
  });
  assert.equal(ok, true);
});

test("invalid config fails", () => {
  const ok = isConfigValid({ default_target: 1, targets: {} });
  assert.equal(ok, false);
});

test("loadConfig throws on missing file", () => {
  assert.throws(() => loadConfig({ configPath: "/tmp/does-not-exist.json" }));
});

test("loadConfig throws on parse error", () => {
  const bad = path.join(tmp, "bad.json");
  fs.writeFileSync(bad, "{not-json}");
  assert.throws(() => loadConfig({ configPath: bad }));
});
