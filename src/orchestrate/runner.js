import { spawn } from "node:child_process";
import fs from "node:fs";

export function runTarget({ command, args = [], prompt, stdinPath }) {
  return new Promise((resolve) => {
    const finalArgs = stdinPath ? args : [...args, prompt];
    const child = spawn(command, finalArgs, { stdio: ["pipe", "inherit", "inherit"] });
    if (stdinPath) fs.createReadStream(stdinPath).pipe(child.stdin);
    child.on("close", (code) => resolve({ exitCode: code ?? 1 }));
    child.on("error", () => resolve({ exitCode: 1, error: "spawn-failed" }));
  });
}
