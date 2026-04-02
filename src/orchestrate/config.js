import fs from "node:fs";
import path from "node:path";

const DEFAULT_PATH = path.join(process.env.HOME, ".orchestrate", "config.json");

export function resolveConfigPath({ configPath, env = process.env } = {}) {
  if (configPath) return configPath;
  if (env.ORCHESTRATE_CONFIG) return env.ORCHESTRATE_CONFIG;
  return DEFAULT_PATH;
}

export function loadConfig({ configPath } = {}) {
  const filePath = resolveConfigPath({ configPath });
  const raw = fs.readFileSync(filePath, "utf8");
  const cfg = JSON.parse(raw);
  if (!cfg || typeof cfg !== "object") throw new Error("Invalid config");
  if (typeof cfg.default_target !== "string") throw new Error("Invalid config");
  if (!cfg.targets || typeof cfg.targets !== "object") throw new Error("Invalid config");
  const targetNames = Object.keys(cfg.targets);
  if (targetNames.length === 0) throw new Error("Invalid config");
  for (const name of targetNames) {
    const t = cfg.targets[name];
    if (!t || typeof t.command !== "string" || t.command.length === 0) {
      throw new Error("Invalid config");
    }
  }
  if (!cfg.targets[cfg.default_target]) throw new Error("Invalid config");
  return cfg;
}
