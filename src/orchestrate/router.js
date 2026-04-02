export async function routePrompt({
  prompt,
  context,
  targets,
}) {
  const choices = Object.keys(targets);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return choices[0];

  const routerPrompt = `You are a routing assistant.\n\nTask: ${prompt}\n\nRecent context:\n${context.join("\n---\n")}\n\nAvailable targets: ${choices.join(", ")}\n\nPick the best target name from the list. Reply with the name only.`;

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
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
