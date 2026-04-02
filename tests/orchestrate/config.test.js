import { loadConfig, resolveConfigPath } from "../../src/orchestrate/config.js";
import fs from "node:fs";
import path from "node:path";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";

const tmp = path.join(process.cwd(), "tests/.tmp");

before(() => fs.mkdirSync(tmp, { recursive: true }));

after(() => fs.rmSync(tmp, { recursive: true, force: true }));

test("loads config from explicit path", () => {
  const cfgPath = path.join(tmp, "config.json");
  fs.writeFileSync(
    cfgPath,
    JSON.stringify({ default_target: "x", targets: { x: { command: "foo" } } })
  );
  const cfg = loadConfig({ configPath: cfgPath });
  assert.equal(cfg.default_target, "x");
});

test("resolveConfigPath prefers explicit path then env then default", () => {
  const p = resolveConfigPath({
    configPath: "/tmp/a.json",
    env: { ORCHESTRATE_CONFIG: "/tmp/b.json" },
  });
  assert.equal(p, "/tmp/a.json");
});

test("resolveConfigPath uses env when no explicit path", () => {
  const p = resolveConfigPath({ env: { ORCHESTRATE_CONFIG: "/tmp/b.json" } });
  assert.equal(p, "/tmp/b.json");
});
