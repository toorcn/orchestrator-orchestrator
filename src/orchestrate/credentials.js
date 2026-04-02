import fs from "node:fs";
import path from "node:path";

const CREDS_PATH = path.join(process.env.HOME, ".orchestrate", "credentials.json");

export function readCredentials() {
  try {
    const raw = fs.readFileSync(CREDS_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function writeCredentials(creds) {
  fs.mkdirSync(path.dirname(CREDS_PATH), { recursive: true });
  fs.writeFileSync(CREDS_PATH, `${JSON.stringify(creds, null, 2)}\n`);
}
