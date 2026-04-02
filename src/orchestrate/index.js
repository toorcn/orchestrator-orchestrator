import { loadConfig } from "./config.js";
import { runTarget } from "./runner.js";

const CONFIG_HINT = `Missing or invalid config. Create ~/.orchestrate/config.json with default_target and targets. Example:\n{\n  "default_target": "opencode",\n  "targets": {\n    "opencode": {"command": "oh-my-opencode"}\n  }\n}\n`;
const MISSING_BINARY_HINT = (command) =>
  `Missing CLI binary: ${command}. Install it or update your config.`;

export async function main(argv) {
  const args = argv.slice(2);
  const list = args.includes("--list-targets");
  const targetIdx = args.indexOf("--target");
  const target = targetIdx >= 0 ? args[targetIdx + 1] : null;
  const configIdx = args.indexOf("--config");
  const configPath = configIdx >= 0 ? args[configIdx + 1] : null;
  const promptFileIdx = args.indexOf("--prompt-file");
  const promptFile = promptFileIdx >= 0 ? args[promptFileIdx + 1] : null;

  if (targetIdx >= 0 && !target) {
    console.error("Missing value for --target");
    return 1;
  }
  if (configIdx >= 0 && !configPath) {
    console.error("Missing value for --config");
    return 1;
  }
  if (promptFileIdx >= 0 && !promptFile) {
    console.error("Missing value for --prompt-file");
    return 1;
  }
  const nonFlagArgs = args.filter(
    (a, i) =>
      !a.startsWith("--") &&
      args[i - 1] !== "--target" &&
      args[i - 1] !== "--config" &&
      args[i - 1] !== "--prompt-file"
  );
  const prompt = nonFlagArgs[0] || "";

  let cfg;
  try {
    cfg = loadConfig({ configPath });
  } catch (err) {
    console.error(CONFIG_HINT);
    return 1;
  }

  if (list) {
    console.log(Object.keys(cfg.targets).join("\n"));
    return 0;
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
