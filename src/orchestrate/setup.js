import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const KNOWN = [
  { name: "opencode", command: "oh-my-opencode" },
  { name: "codex", command: "oh-my-codex" },
  { name: "claude", command: "free-code" },
];

export function detectTargets({ which } = {}) {
  const resolver =
    which ||
    ((cmd) => {
      try {
        execFileSync("which", [cmd], { stdio: "ignore" });
        return cmd;
      } catch {
        return null;
      }
    });

  return KNOWN.filter((t) => resolver(t.command));
}

export function writeConfig(filePath, cfg) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(cfg, null, 2)}\n`);
}

export async function runSetupFlow({ detected, prompt }) {
  if (!prompt) throw new Error("Prompt required");

  if (!detected || detected.length === 0) {
    const res = await prompt({ mode: "custom" });
    if (!res.name || !res.command || !res.defaultTarget) {
      throw new Error("Invalid selection");
    }
    if (!res.confirmPath || !res.confirmWrite) throw new Error("Confirm required");
    return {
      default_target: res.defaultTarget,
      targets: { [res.name]: { command: res.command } },
      configPath: res.configPath,
      confirmWrite: res.confirmWrite,
    };
  }

  const res = await prompt({ mode: "detected", detected, requireAtLeastOne: true });
  if (!res.targets || res.targets.length === 0) throw new Error("Invalid selection");
  if (!res.targets.includes(res.defaultTarget)) throw new Error("Invalid selection");
  if (!res.confirmPath || !res.confirmWrite) throw new Error("Confirm required");

  const targets = {};
  for (const name of res.targets) {
    const match = detected.find((d) => d.name === name);
    targets[name] = { command: match.command };
  }

  return {
    default_target: res.defaultTarget,
    targets,
    configPath: res.configPath,
    confirmWrite: res.confirmWrite,
  };
}
