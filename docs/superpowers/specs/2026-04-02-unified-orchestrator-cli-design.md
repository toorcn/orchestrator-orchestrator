# Unified Orchestrator CLI Design

**Goal**: Provide a single local CLI wrapper that routes a user prompt to one of several installed orchestrator CLIs (oh-my-opencode, oh-my-codex, free-code/claude code) without the user needing to choose skills/modes manually.

**Scope (v1)**
- macOS-first
- One command routes prompts
- Config-driven default target selection
- Streaming output passthrough
- Minimal error handling for missing config/CLI

**Non-Goals (v1)**
- Merging upstream codebases
- Background daemon
- Rich UI or TUI
- Advanced routing heuristics

---

## Architecture
A single `orchestrate` CLI accepts a prompt, loads a simple local config file, selects a target orchestrator (default or explicit flag), and invokes the target’s native CLI with the prompt. The wrapper streams stdout/stderr back to the user and exits with the target process exit code.

## Components
1. **CLI Entry Point**
   - Command: `orchestrate "<prompt>"`
   - Flags: `--target <name>` (optional override)

2. **Config Loader**
   - Reads a local config file (JSON or YAML)
   - Minimal required fields: `default_target`, `targets` map

3. **Target Runner**
   - Maps target name to a local CLI command
   - Spawns process with prompt argument
   - Streams output to user

4. **Error Handling**
   - Missing config → print setup instructions
   - Unknown target → list available targets
   - Missing CLI binary → print install hint
   - Target failure → pass through exit code

## Data Flow
User prompt → CLI parses args → loads config → selects target → spawns target CLI → streams output → exit code passthrough

## Testing Strategy
- Unit tests: config parsing, target selection, error cases
- Integration test: stubbed process execution and output streaming

## Open Questions
- Config format preference (JSON vs YAML)
- Target CLI invocation specifics for each orchestrator

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
