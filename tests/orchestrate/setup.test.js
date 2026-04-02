import assert from "node:assert/strict";
import { before, test } from "node:test";
import { isConfigValid, loadConfig } from "../../src/orchestrate/config.js";
import { detectTargets, writeConfig } from "../../src/orchestrate/setup.js";
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

// fake PATH detection via injected resolver

test("detectTargets returns known targets", () => {
  const targets = detectTargets({
    which: (cmd) => (cmd === "oh-my-opencode" ? "/usr/bin/oh-my-opencode" : null),
  });
  assert.ok(targets.find((t) => t.name === "opencode"));
});

test("writeConfig writes file", () => {
  const cfgPath = path.join(tmp, "config.json");
  writeConfig(cfgPath, {
    default_target: "opencode",
    targets: { opencode: { command: "oh-my-opencode" } },
  });
  const raw = fs.readFileSync(cfgPath, "utf8");
  assert.ok(raw.includes("default_target"));
});

test("writeConfig throws on write failure", () => {
  assert.throws(() =>
    writeConfig("/root/forbidden.json", {
      default_target: "opencode",
      targets: { opencode: { command: "oh-my-opencode" } },
    }),
  );
});
