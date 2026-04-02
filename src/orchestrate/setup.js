import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { resolveConfigPath } from "./config.js";

const KNOWN = [
  { name: "opencode", command: "opencode" },
  { name: "codex", command: "codex" },
  { name: "claude", command: "free-code" },
];

export function detectTargets({ which } = {}) {
  const resolver =
    which ||
    ((cmd) => {
      try {
        const bin = process.platform === "win32" ? "where" : "which";
        execFileSync(bin, [cmd], { stdio: "ignore" });
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

export async function setup({ interactive, configPath } = {}) {
  if (!interactive) {
    console.error("Interactive setup requires a TTY");
    return 2;
  }

  const rl = createInterface({ input, output });
  const ask = (q) => rl.question(q);
  const askYesNo = async (q) => {
    while (true) {
      const ans = (await ask(q)).trim().toLowerCase();
      if (ans === "q") return null;
      if (ans === "y" || ans === "n") return ans === "y";
    }
  };

  try {
    const detected = detectTargets();

    let selected = [];
    let defaultTarget = null;
    let customName = null;
    let customCommand = null;

    if (!detected || detected.length === 0) {
      output.write("No supported CLIs detected on PATH.\n");
      while (true) {
        const name = (await ask("Enter a target name (or 'q' to cancel): ")).trim();
        if (name.toLowerCase() === "q") return 1;
        if (!name) continue;
        const cmd = (await ask("Enter command for this target (or 'q' to cancel): ")).trim();
        if (cmd.toLowerCase() === "q") return 1;
        if (!cmd) continue;
        const collision = KNOWN.find((d) => d.name === name);
        if (collision) {
          const overwrite = await askYesNo("Name exists. Override? (y/n, q to cancel): ");
          if (overwrite !== true) return 1;
        }
        customName = name;
        customCommand = cmd;
        selected = [customName];
        defaultTarget = customName;
        break;
      }
    } else {
      output.write("Select targets to include (comma-separated numbers, or 'q' to cancel):\n");
      detected.forEach((t, i) => output.write(`  ${i + 1}) ${t.name} (${t.command})\n`));
      while (true) {
        const raw = (await ask("Targets: ")).trim();
        if (raw.toLowerCase() === "q") return 1;
        const indices = raw
          .split(",")
          .map((s) => parseInt(s.trim(), 10) - 1)
          .filter((n) => Number.isInteger(n) && n >= 0 && n < detected.length);
        selected = Array.from(new Set(indices.map((i) => detected[i].name)));
        if (selected.length > 0) break;
      }

      if (selected.length === 1) {
        defaultTarget = selected[0];
      } else {
        output.write("Choose a default target (or 'q' to cancel):\n");
        selected.forEach((name, i) => output.write(`  ${i + 1}) ${name}\n`));
        while (true) {
          const rawDefault = (await ask("Default: ")).trim();
          if (rawDefault.toLowerCase() === "q") return 1;
          const d = parseInt(rawDefault, 10) - 1;
          if (Number.isInteger(d) && d >= 0 && d < selected.length) {
            defaultTarget = selected[d];
            break;
          }
        }
      }
    }

    let pathChoice = configPath ?? resolveConfigPath({});
    while (true) {
      output.write(`Config path: ${pathChoice}\n`);
      const ok = await askYesNo("Use this path? (y/n, q to cancel): ");
      if (ok === null) return 1;
      if (ok) break;
      const alt = (await ask("Enter new path (or 'q' to cancel): ")).trim();
      if (alt.toLowerCase() === "q") return 1;
      if (alt) pathChoice = alt;
    }

    const confirmWrite = await askYesNo("Write config now? (y/n, q to cancel): ");
    if (confirmWrite !== true) return 1;

    const targets = {};
    if (customName) {
      const collision = detected.find((d) => d.name === customName);
      if (collision) {
        const overwrite = await askYesNo("Name exists. Override? (y/n, q to cancel): ");
        if (overwrite !== true) return 1;
      }
      targets[customName] = { command: customCommand };
    } else {
      for (const name of selected) {
        const match = detected.find((d) => d.name === name);
        if (!match) return 1;
        targets[name] = { command: match.command };
      }
    }

    while (true) {
      try {
        writeConfig(pathChoice, { default_target: defaultTarget, targets });
        break;
      } catch {
        const retry = await askYesNo("Write failed. Retry? (y/n, q to cancel): ");
        if (retry !== true) return 1;
      }
    }

    output.write("Setup complete. Try: orch2 --list-targets\n");
    return 0;
  } finally {
    rl.close();
  }
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
    if (!match) throw new Error("Invalid selection");
    targets[name] = { command: match.command };
  }

  return {
    default_target: res.defaultTarget,
    targets,
    configPath: res.configPath,
    confirmWrite: res.confirmWrite,
  };
}
