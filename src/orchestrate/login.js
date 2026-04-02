import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { writeCredentials } from "./credentials.js";

export async function login({ interactive } = {}) {
  if (!interactive) {
    console.error("Login requires a TTY");
    return 2;
  }
  const rl = createInterface({ input, output });
  try {
    const token = (await rl.question("OpenAI OAuth token: ")).trim();
    if (!token) return 1;
    writeCredentials({ openai_oauth_token: token });
    output.write("Saved credentials to ~/.orchestrate/credentials.json\n");
    return 0;
  } finally {
    rl.close();
  }
}
