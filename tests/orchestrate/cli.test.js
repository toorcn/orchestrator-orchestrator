import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { before, test } from "node:test";
import assert from "node:assert/strict";

const fixtures = path.join(process.cwd(), "tests/fixtures");

before(() => {
  fs.mkdirSync(fixtures, { recursive: true });
});

test("lists targets", () => {
  const out = execSync(
    "node bin/orchestrate --list-targets --config tests/fixtures/config.json",
    { encoding: "utf8" }
  );
  assert.ok(out.includes("opencode"));
});

test("runs prompt from file", () => {
  fs.writeFileSync(path.join(fixtures, "prompt.txt"), "hello\nworld");
  const out = execSync(
    "node bin/orchestrate --prompt-file tests/fixtures/prompt.txt --config tests/fixtures/config.json",
    { encoding: "utf8" }
  );
  assert.ok(out.includes("ok"));
});
