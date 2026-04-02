import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { writeCredentials } from "./credentials.js";
import { execFileSync } from "node:child_process";

function openBrowser(url) {
  const cmd = process.platform === "darwin" ? "open" : "xdg-open";
  try {
    execFileSync(cmd, [url], { stdio: "ignore" });
  } catch {
    // ignore if open fails
  }
}

export async function login({ interactive } = {}) {
  if (!interactive) {
    console.error("Login requires a TTY");
    return 2;
  }

  const clientId = process.env.OPENAI_CLIENT_ID;
  const deviceUrl = process.env.OPENAI_DEVICE_CODE_URL;
  const tokenUrl = process.env.OPENAI_TOKEN_URL;
  if (!clientId || !deviceUrl || !tokenUrl) {
    console.error("Missing OAuth env vars: OPENAI_CLIENT_ID, OPENAI_DEVICE_CODE_URL, OPENAI_TOKEN_URL");
    return 1;
  }

  const rl = createInterface({ input, output });
  try {
    const deviceRes = await fetch(deviceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, scope: "openid" }),
    });
    if (!deviceRes.ok) {
      console.error("Failed to start device login");
      return 1;
    }
    const deviceData = await deviceRes.json();
    const verifyUrl = deviceData.verification_uri_complete || deviceData.verification_uri;
    output.write(`Open this URL to authorize:\n${verifyUrl}\n`);
    openBrowser(verifyUrl);

    const interval = (deviceData.interval || 5) * 1000;
    const deviceCode = deviceData.device_code;

    while (true) {
      await new Promise((r) => setTimeout(r, interval));
      const tokenRes = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          device_code: deviceCode,
          client_id: clientId,
        }),
      });
      const data = await tokenRes.json();
      if (data.access_token) {
        writeCredentials({ openai_oauth_token: data.access_token });
        output.write("Saved credentials to ~/.orchestrate/credentials.json\n");
        return 0;
      }
      if (data.error && data.error !== "authorization_pending") {
        console.error("Login failed: " + data.error);
        return 1;
      }
    }
  } finally {
    rl.close();
  }
}
