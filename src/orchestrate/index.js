import { isConfigValid, loadConfig, resolveConfigPath } from "./config.js";
import { runTarget } from "./runner.js";
import { setup as defaultSetup } from "./setup.js";
import { runRepl } from "./repl.js";

const CONFIG_HINT = `Missing or invalid config. Create ~/.orchestrate/config.json with default_target and targets. Example:\n{\n  "default_target": "opencode",\n  "targets": {\n    "opencode": {"command": "oh-my-opencode"}\n  }\n}\n`;
const MISSING_BINARY_HINT = (command) =>
  `Missing CLI binary: ${command}. Install it or update your config.`;

export async function main(argv, { setup, configPath } = {}) {
  const setupFn = setup ?? defaultSetup;
  const args = argv.slice(2);
  const list = args.includes("--list-targets");
  const oneShot = args.includes("--one-shot");
  const targetIdx = args.indexOf("--target");
  const target = targetIdx >= 0 ? args[targetIdx + 1] : null;
  const configIdx = args.indexOf("--config");
  const resolvedConfigPath =
    configPath ?? (configIdx >= 0 ? args[configIdx + 1] : null);
  const promptFileIdx = args.indexOf("--prompt-file");
  const promptFile = promptFileIdx >= 0 ? args[promptFileIdx + 1] : null;
  const nonFlagArgs = args.filter(
    (a, i) =>
      !a.startsWith("--") &&
      args[i - 1] !== "--target" &&
      args[i - 1] !== "--config" &&
      args[i - 1] !== "--prompt-file"
  );
  const prompt = nonFlagArgs[0] || "";
  const isSetup = nonFlagArgs[0] === "setup";
  const finalConfigPath = resolveConfigPath({
    configPath: resolvedConfigPath,
  });

  if (targetIdx >= 0 && !target) {
    console.error("Missing value for --target");
    return 1;
  }
  if (configIdx >= 0 && !resolvedConfigPath) {
    console.error("Missing value for --config");
    return 1;
  }
  if (promptFileIdx >= 0 && !promptFile) {
    console.error("Missing value for --prompt-file");
    return 1;
  }

  if (isSetup) {
    return await setupFn({
      configPath: finalConfigPath,
      interactive: process.stdin.isTTY,
    });
  }

  let cfg;
  try {
    cfg = loadConfig({ configPath: finalConfigPath });
  } catch (err) {
    if (setupFn) {
      return await setupFn({
        configPath: finalConfigPath,
        interactive: process.stdin.isTTY,
      });
    }
    console.error(CONFIG_HINT);
    return 1;
  }

  if (!isConfigValid(cfg)) {
    if (setupFn) {
      return await setupFn({
        configPath: finalConfigPath,
        interactive: process.stdin.isTTY,
      });
    }
    console.error(CONFIG_HINT);
    return 1;
  }

  if (list) {
    console.log(Object.keys(cfg.targets).join("\n"));
    return 0;
  }

  if (!oneShot && !prompt && !promptFile) {
    return await runRepl({
      setup: setupFn,
      loadConfig,
      isConfigValid,
      resolveConfigPath,
      runTarget,
      configPath: finalConfigPath,
      listTargets: (c) => Object.keys(c.targets),
    });
  }

  const selected = target ?? cfg.default_target;
  const t = cfg.targets[selected];
  if (!t) {
    console.error(
      `Unknown target: ${selected}. Available: ${Object.keys(cfg.targets).join(", ")}`
    );
    return 1;
  }

  const result = await runTarget({
    command: t.command,
    args: t.args ?? [],
    prompt,
    stdinPath: promptFile,
  });

  if (result.error === "spawn-failed") {
    console.error(MISSING_BINARY_HINT(t.command));
    return 1;
  }

  return result.exitCode;
}
