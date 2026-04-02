import assert from "node:assert/strict";
import { test } from "node:test";
import { runRepl } from "../../src/orchestrate/repl.js";

const fakeSetup = async () => 0;
const fakeLoad = () => ({
  default_target: "opencode",
  targets: { opencode: { command: "echo" } },
});

const fakeRun = async () => ({ exitCode: 0 });

// Minimal test that REPL exits on /exit

test("repl exits on /exit", async () => {
  const inputs = ["/exit", ""]; // command + blank line submit
  let idx = 0;
  const mockRl = {
    question: async () => inputs[idx++],
    close: () => {},
  };

  const code = await runRepl({
    setup: fakeSetup,
    loadConfig: () => fakeLoad(),
    isConfigValid: () => true,
    resolveConfigPath: () => "/tmp/config.json",
    runTarget: fakeRun,
    configPath: "/tmp/config.json",
    listTargets: () => ["opencode"],
    _mockRl: mockRl,
  });

  assert.equal(code, 0);
});
