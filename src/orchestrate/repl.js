import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const HELP = `Commands:
  /help            Show this help
  /exit            Exit REPL
  /setup           Run interactive setup
  /list            List configured targets
  /config          Show config path and current default
  /target <name>   Set active target
  /history         Show recent prompts
  /clear           Clear screen
`;

export async function runRepl({
  setup,
  loadConfig,
  isConfigValid,
  resolveConfigPath,
  runTarget,
  configPath,
  listTargets,
  _mockRl,
}) {
  const rl = _mockRl ?? createInterface({ input, output });
  const history = [];
  let activeTarget = null;

  const ensureConfig = async () => {
    let cfg;
    try {
      cfg = loadConfig({ configPath });
    } catch {
      return await setup({ configPath, interactive: process.stdin.isTTY });
    }
    if (!isConfigValid(cfg)) {
      return await setup({ configPath, interactive: process.stdin.isTTY });
    }
    return cfg;
  };

  try {
    let cfg = await ensureConfig();
    if (typeof cfg === "number") return cfg;
    activeTarget = cfg.default_target;

    output.write("orch2 REPL. Type /help for commands.\n\n");

    while (true) {
      const buffer = [];
      let multiline = false;
      const first = await rl.question("> ");
      if (first.trim() === "") continue;
      if (first.trim().startsWith("/")) {
        buffer.push(first.trim());
      } else if (first.trim().endsWith("\\")) {
        multiline = true;
        buffer.push(first.replace(/\\$/, ""));
      } else {
        buffer.push(first);
      }

      if (multiline) {
        while (true) {
          const line = await rl.question("> ");
          if (line.trim() === "") break;
          buffer.push(line);
        }
      }

      const text = buffer.join("\n");

      if (text.startsWith("/")) {
        const [cmd, ...args] = text.trim().split(/\s+/);
        if (cmd === "/help") {
          output.write(HELP);
          continue;
        }
        if (cmd === "/exit") {
          return 0;
        }
        if (cmd === "/setup") {
          const code = await setup({ configPath, interactive: process.stdin.isTTY });
          if (code !== 0) return code;
          cfg = await ensureConfig();
          if (typeof cfg === "number") return cfg;
          activeTarget = cfg.default_target;
          continue;
        }
        if (cmd === "/list") {
          output.write(listTargets(cfg).join("\n") + "\n");
          continue;
        }
        if (cmd === "/config") {
          const path = resolveConfigPath({ configPath });
          output.write(`Config: ${path}\nDefault: ${cfg.default_target}\n`);
          continue;
        }
        if (cmd === "/target") {
          const name = args[0];
          if (!name || !cfg.targets[name]) {
            output.write("Unknown target.\n");
            continue;
          }
          activeTarget = name;
          output.write(`Active target: ${activeTarget}\n`);
          continue;
        }
        if (cmd === "/history") {
          output.write(history.join("\n\n") + "\n");
          continue;
        }
        if (cmd === "/clear") {
          output.write("\u001b[2J\u001b[H");
          continue;
        }
        output.write("Unknown command. Type /help.\n");
        continue;
      }

      const t = cfg.targets[activeTarget];
      const result = await runTarget({ command: t.command, args: t.args ?? [], prompt: text, interactive: true });
      history.push(text);
      if (result.error === "spawn-failed") return 1;
    }
  } finally {
    rl.close();
  }
}
