import { test } from "node:test";
import assert from "node:assert/strict";
import { runTarget } from "../../src/orchestrate/runner.js";

test("runs target command with prompt arg", async () => {
  const result = await runTarget({ command: "echo", args: ["hello"], prompt: "ping" });
  assert.equal(result.exitCode, 0);
});

test("returns error on missing binary", async () => {
  const result = await runTarget({ command: "definitely-not-a-real-cmd", args: [], prompt: "ping" });
  assert.equal(result.exitCode, 1);
});
