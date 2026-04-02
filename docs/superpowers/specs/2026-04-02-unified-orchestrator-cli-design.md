# Unified Orchestrator CLI Design

**Goal**: Provide a single local CLI wrapper that routes a user prompt to one of several installed orchestrator CLIs (oh-my-opencode, oh-my-codex, free-code/claude code) without the user needing to choose skills/modes manually.

**Scope (v1)**
- macOS-first
- One command routes prompts
- Config-driven default target selection
- Streaming output passthrough
- Minimal error handling for missing config/CLI
- Config discovery order and schema defined
- Simple multi-line prompt handling

**Non-Goals (v1)**
- Merging upstream codebases
- Background daemon
- Rich UI or TUI
- Advanced routing heuristics

**Scope (v2)**
- Per-target adapters for full CLI capabilities (modes/flags/env)
- Pass-through flags and env overrides per target
- Verified prompt-delivery strategy per target (arg vs stdin vs flag)

---

## Architecture
A single `orchestrate` CLI accepts a prompt, loads a simple local config file, selects a target orchestrator (default or explicit flag), and invokes the target’s native CLI with the prompt. The wrapper streams stdout/stderr back to the user and exits with the target process exit code.

## Components
1. **CLI Entry Point**
   - Command: `orchestrate "<prompt>"`
   - Flags: `--target <name>` (optional override), `--list-targets`
   - Multi-line prompt: allow `--prompt-file <path>` as optional input

2. **Config Loader**
   - Config file: `~/.orchestrate/config.json` (JSON only in v1)
   - Discovery: `--config <path>` > `ORCHESTRATE_CONFIG` env > default path
   - Minimal required fields: `default_target`, `targets` map
   - Schema (v1):
     - `default_target`: string
     - `targets`: map of name → { `command`: string, `args`: optional string[] }

3. **Target Runner**
   - Maps target name to a local CLI command + args
   - Spawns process with prompt argument (or stdin when `--prompt-file` used)
   - Streams output to user

4. **Error Handling**
   - Missing config → print setup instructions + example file
   - Unknown target → list available targets
   - Missing CLI binary → print install hint
   - Target failure → pass through exit code

## Data Flow
User prompt → CLI parses args → loads config → selects target → spawns target CLI → streams output → exit code passthrough

## Testing Strategy
- Unit tests: config parsing, target selection, error cases
- Integration tests: CLI-level golden tests for `--list-targets`, missing config, and prompt routing with stubbed process execution

## Open Questions
- None for v1. v2 will document full CLI surface for each target.

## v2 Adapter Notes (Draft)
- **oh-my-openagent (oh-my-opencode)**: CLI-centric flows via `opencode` and `ultrawork`/`ulw`. Likely requires passing explicit subcommands and may depend on repo-local config files. Adapter should allow pass-through subcommands and environment variables.
- **oh-my-codex**: wrapper commands like `omx` with modes (`setup`, `doctor`, `team`, `hud`) and role commands inside the session. Adapter should map `--mode`/`--command` to appropriate `omx` invocation and pass prompt as quoted arg when required.
- **free-code (claude code clone)**: interactive REPL default; one-shot mode uses `-p` for prompt, `--model` for model selection, and relies on env vars for provider selection. Adapter should default to one-shot `-p` with env overrides.

## Example Config (Draft)
```
{
  "default_target": "opencode",
  "targets": {
    "opencode": {"command": "oh-my-opencode"},
    "codex": {"command": "oh-my-codex"},
    "claude": {"command": "free-code"}
  }
}
```
