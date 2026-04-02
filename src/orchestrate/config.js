import fs from "node:fs";
import path from "node:path";

const DEFAULT_PATH = path.join(process.env.HOME, ".orchestrate", "config.json");

export function resolveConfigPath({ configPath, env = process.env } = {}) {
  if (configPath) return configPath;
  if (env.ORCHESTRATE_CONFIG) return env.ORCHESTRATE_CONFIG;
  return DEFAULT_PATH;
}

export function isConfigValid(cfg) {
  if (!cfg || typeof cfg !== "object") return false;
  if (typeof cfg.default_target !== "string") return false;
  if (!cfg.targets || typeof cfg.targets !== "object") return false;
  const names = Object.keys(cfg.targets);
  if (names.length === 0) return false;
  for (const name of names) {
    const t = cfg.targets[name];
    if (!t || typeof t.command !== "string" || t.command.length === 0) return false;
    if (t.args && (!Array.isArray(t.args) || t.args.some((a) => typeof a !== "string"))) {
      return false;
    }
  }
  if (!cfg.targets[cfg.default_target]) return false;
  return true;
}

export function loadConfig({ configPath } = {}) {
  const filePath = resolveConfigPath({ configPath });
  const raw = fs.readFileSync(filePath, "utf8");
  const cfg = JSON.parse(raw);
  if (!isConfigValid(cfg)) throw new Error("Invalid config");
  return cfg;
}
