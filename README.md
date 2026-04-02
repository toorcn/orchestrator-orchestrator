# Unified Orchestrator CLI

A single local CLI wrapper that routes prompts to installed orchestrator CLIs (oh-my-openagent/oh-my-opencode, oh-my-codex, free-code) so you don’t have to remember which tool, mode, or skill to use.

## Quick Install

This repo ships a local CLI script you can run via Node:

```bash
orch2 "your prompt here"
```

### Short command name (orch2)

Create a symlink so you can run `orch2` directly:

```bash
sudo ln -s "$(pwd)/bin/orchestrate" /usr/local/bin/orch2
```

Then use:

```bash
orch2 "your prompt here"
```

## Requirements
- Node.js 20+ (tested with Node 22)
- Target CLIs installed locally (e.g., `oh-my-opencode`, `oh-my-codex`, `free-code`)

## Usage

### One‑shot prompt
```bash
orch2 "summarize this repo"
```

### Select a specific target
```bash
orch2 --target opencode "analyze auth flow"
```

### Prompt from file (multi‑line)
```bash
orch2 --prompt-file ./prompt.txt
```

### List configured targets
```bash
orch2 --list-targets
```

## Configuration

Create `~/.orchestrate/config.json`:

```json
{
  "default_target": "opencode",
  "targets": {
    "opencode": {"command": "oh-my-opencode"},
    "codex": {"command": "oh-my-codex"},
    "claude": {"command": "free-code"}
  }
}
```

### Config discovery order
1. `--config <path>`
2. `ORCHESTRATE_CONFIG` environment variable
3. `~/.orchestrate/config.json`

### Target schema
```json
{
  "default_target": "<name>",
  "targets": {
    "<name>": {
      "command": "<binary>",
      "args": ["<optional>", "<args>"]
    }
  }
}
```

## Examples

### Route to oh-my-codex
```bash
orch2 --target codex "plan the refactor"
```

### Route to free-code with OpenAI provider
```bash
CLAUDE_CODE_USE_OPENAI=1 orch2 --target claude "explain this test"
```

## Error Handling
- Missing/invalid config: prints setup hint + example config
- Unknown target: lists available targets
- Missing CLI binary: prints install hint

## Troubleshooting
- Ensure the target CLI is installed and on your PATH
- Verify `~/.orchestrate/config.json` is valid JSON
- Use `--list-targets` to confirm target names

## License
MIT
