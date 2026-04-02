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
  if (!cfg.default_target || !cfg.targets) throw new Error("Invalid config");
  return cfg;
}
