import assert from "node:assert/strict";
import { test } from "node:test";
import { runSetupFlow } from "../../src/orchestrate/setup.js";

test("runSetupFlow returns config from selections", async () => {
  const cfg = await runSetupFlow({
    detected: [
      { name: "opencode", command: "oh-my-opencode" },
      { name: "codex", command: "oh-my-codex" },
    ],
    prompt: async () => ({
      targets: ["opencode"],
      defaultTarget: "opencode",
      configPath: "/tmp/config.json",
      confirmPath: true,
      confirmWrite: true,
    }),
  });
  assert.equal(cfg.default_target, "opencode");
});

test("rejects when no targets selected", async () => {
  await assert.rejects(() =>
    runSetupFlow({
      detected: [{ name: "opencode", command: "oh-my-opencode" }],
      prompt: async () => ({
        targets: [],
        defaultTarget: "opencode",
        configPath: "/tmp/config.json",
        confirmPath: true,
        confirmWrite: true,
      }),
    }),
  );
});

test("auto-default when only one target", async () => {
  const cfg = await runSetupFlow({
    detected: [{ name: "opencode", command: "oh-my-opencode" }],
    prompt: async () => ({
      targets: ["opencode"],
      defaultTarget: "opencode",
      configPath: "/tmp/config.json",
      confirmPath: true,
      confirmWrite: true,
    }),
  });
  assert.equal(cfg.default_target, "opencode");
});

test("rejects when default not in selected", async () => {
  await assert.rejects(() =>
    runSetupFlow({
      detected: [{ name: "opencode", command: "oh-my-opencode" }],
      prompt: async () => ({
        targets: ["opencode"],
        defaultTarget: "codex",
        configPath: "/tmp/config.json",
        confirmPath: true,
        confirmWrite: true,
      }),
    }),
  );
});

test("requires confirm path before write", async () => {
  await assert.rejects(() =>
    runSetupFlow({
      detected: [{ name: "opencode", command: "oh-my-opencode" }],
      prompt: async () => ({
        targets: ["opencode"],
        defaultTarget: "opencode",
        configPath: "/tmp/config.json",
        confirmPath: false,
        confirmWrite: true,
      }),
    }),
  );
});

test("custom command flow when none detected", async () => {
  const cfg = await runSetupFlow({
    detected: [],
    prompt: async () => ({
      name: "custom",
      command: "custom-cli",
      defaultTarget: "custom",
      configPath: "/tmp/config.json",
      confirmPath: true,
      confirmWrite: true,
    }),
  });
  assert.equal(cfg.default_target, "custom");
});
