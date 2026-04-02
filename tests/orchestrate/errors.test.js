import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { before, test } from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const fixtures = path.join(repoRoot, "tests/fixtures");

before(() => {
  fs.mkdirSync(fixtures, { recursive: true });
});

test("missing config prints setup hint", () => {
  try {
    execSync("node bin/orchestrate --list-targets", {
      encoding: "utf8",
      cwd: repoRoot,
      env: { ...process.env, ORCHESTRATE_CONFIG: "/tmp/does-not-exist.json" },
    });
    throw new Error("expected failure");
  } catch (err) {
    assert.ok(err.stderr?.includes("Missing or invalid config"));
  }
});

test("missing flag value prints usage error", () => {
  try {
    execSync("node bin/orchestrate --config", { encoding: "utf8", cwd: repoRoot });
    throw new Error("expected failure");
  } catch (err) {
    assert.ok(err.stderr?.includes("Missing value for --config"));
  }
});

test("unknown target lists available targets", () => {
  try {
    execSync(
      "node bin/orchestrate --target nope --config tests/fixtures/config.json",
      { encoding: "utf8", cwd: repoRoot }
    );
    throw new Error("expected failure");
  } catch (err) {
    assert.ok(err.stderr?.includes("Unknown target"));
    assert.ok(err.stderr?.includes("opencode"));
  }
});

test("missing binary prints install hint", () => {
  const badConfig = path.join(fixtures, "bad-config.json");
  fs.writeFileSync(
    badConfig,
    JSON.stringify({
      default_target: "missing",
      targets: {
        missing: { command: "definitely-not-a-real-cmd" },
      },
    })
  );

  try {
    execSync(`node bin/orchestrate --config ${badConfig}`, { encoding: "utf8", cwd: repoRoot });
    throw new Error("expected failure");
  } catch (err) {
    assert.ok(err.stderr?.includes("Missing CLI binary"));
  }
});
