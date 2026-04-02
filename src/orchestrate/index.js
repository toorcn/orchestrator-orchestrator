import { loadConfig } from "./config.js";
import { runTarget } from "./runner.js";

export async function main(argv) {
  const args = argv.slice(2);
  const list = args.includes("--list-targets");
  const targetIdx = args.indexOf("--target");
  const target = targetIdx >= 0 ? args[targetIdx + 1] : null;
  const configIdx = args.indexOf("--config");
  const configPath = configIdx >= 0 ? args[configIdx + 1] : null;
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

  const cfg = loadConfig({ configPath });
  if (list) {
    console.log(Object.keys(cfg.targets).join("\n"));
    return 0;
  }
  const selected = target ?? cfg.default_target;
  const t = cfg.targets[selected];
  if (!t) throw new Error("Unknown target");

  const result = await runTarget({
    command: t.command,
    args: t.args ?? [],
    prompt,
    stdinPath: promptFile,
  });
  return result.exitCode;
}
