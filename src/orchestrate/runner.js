import { spawn } from "node:child_process";
import fs from "node:fs";

export function runTarget({ command, args = [], prompt, stdinPath }) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const finalArgs = stdinPath ? args : [...args, prompt];
    const child = spawn(command, finalArgs, { stdio: ["pipe", "inherit", "inherit"] });
    if (stdinPath) {
      const stream = fs.createReadStream(stdinPath);
      stream.on("error", () => finish({ exitCode: 1, error: "stdin-failed" }));
      child.stdin.on("error", (err) => {
        if (err?.code === "EPIPE") return;
        finish({ exitCode: 1, error: "stdin-failed" });
      });
      stream.pipe(child.stdin);
    }
    child.on("close", (code, signal) => {
      if (code === null) return finish({ exitCode: 1, error: "signal-terminated" });
      return finish({ exitCode: code });
    });
    child.on("error", () => finish({ exitCode: 1, error: "spawn-failed" }));
  });
}
