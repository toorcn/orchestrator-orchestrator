import { readCredentials } from "./credentials.js";

export async function routePrompt({
  prompt,
  context,
  targets,
}) {
  const choices = Object.keys(targets);
  const { openai_oauth_token } = readCredentials();
  if (!openai_oauth_token) return choices[0];

  const routerPrompt = `You are a routing assistant.\n\nTask: ${prompt}\n\nRecent context:\n${context.join("\n---\n")}\n\nAvailable targets: ${choices.join(", ")}\n\nPick the best target name from the list. Reply with the name only.`;

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openai_oauth_token}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      input: routerPrompt,
    }),
  });
  if (!res.ok) return choices[0];
  const data = await res.json();
  const text = (data.output_text || data.output?.[0]?.content?.[0]?.text || "").trim();
  return choices.includes(text) ? text : choices[0];
}
