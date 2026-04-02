# Orch2 Interactive Setup Design

**Goal**: Let users run `orch2` without manually editing config by providing an interactive setup flow that writes `~/.orchestrate/config.json`.

**Scope (v1)**
- `orch2 setup` command
- Auto-run setup when config is missing/invalid
- Detect known CLI binaries on PATH
- Interactive prompts to select targets and default
- Write config file

**Non-Goals (v1)**
- GUI/TUI
- Auto-installing missing CLIs
- Complex routing rules

---

## Architecture
Add a `setup` subcommand and a shared setup flow that can be invoked either explicitly (`orch2 setup`) or automatically on missing/invalid config. The flow detects known CLIs, prompts the user to select targets/default, and writes the config to `~/.orchestrate/config.json`.

## Components
1. **Setup Command**
   - `orch2 setup` entry point
   - Reuses shared setup flow

2. **Target Discovery**
   - Checks for known CLIs on PATH (e.g., `oh-my-opencode`, `oh-my-codex`, `free-code`)

3. **Prompt Flow**
   - Multi-select: which targets to include
   - Single-select: default target
   - Optional: custom command entries if none detected

4. **Config Writer**
   - Writes JSON config
   - Confirms path on success

## Data Flow
User runs `orch2` → config missing/invalid → setup flow → detect targets → prompt user → write config → proceed.
User runs `orch2 setup` → setup flow directly.

## Error Handling
- No CLIs detected → prompt for custom command or exit
- Write failure → show error and path
- User cancels → exit cleanly

## Testing Strategy
- Unit tests: detection + config writer
- CLI tests: missing config triggers setup (stubbed prompts)
