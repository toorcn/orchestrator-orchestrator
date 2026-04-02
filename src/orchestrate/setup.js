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
