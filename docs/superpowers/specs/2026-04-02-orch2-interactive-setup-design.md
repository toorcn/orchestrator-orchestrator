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

3. **Prompt Flow (Claude Code‑style)**
   - Show detected targets as a checklist (multi-select; must pick at least one)
   - Choose default target (single-select from chosen)
   - Confirm config path before write
   - If none detected, prompt user to enter at least one custom command (name + command)

4. **Config Writer**
   - Ensures `~/.orchestrate/` exists
   - Writes JSON config
   - Confirms path on success

## Config Format
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
- `args` is optional; if present it must be an array of strings.

## Validation (used to trigger setup)
- Missing file or unreadable file
- JSON parse error
- `default_target` missing or not string
- `targets` missing or not object
- No targets defined
- Any target missing a non-empty `command`
- `default_target` not present in `targets`

## Data Flow
User runs `orch2` → config missing/invalid → setup flow → detect targets → show checklist + multi-select → choose default → confirm config path → write config → success + next steps → proceed.
User runs `orch2 setup` → setup flow directly.

## Error Handling
- No CLIs detected → prompt for custom command or exit
- Write failure → show error and path, allow retry
- User cancels → exit cleanly
- Non-interactive (no TTY) → print message and exit with non-zero

## Merge Rules
- If a custom command uses the same target name as a detected target, prompt to confirm override.

## Testing Strategy
- Unit tests: detection + config writer + validation rules
- CLI tests: missing/invalid config triggers setup (stubbed prompts)
- Prompt flow tests: no CLIs detected, custom command entry, user cancel
- Default selection when only one target exists
