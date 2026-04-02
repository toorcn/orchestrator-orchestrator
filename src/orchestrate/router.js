export async function routePrompt({
  prompt,
  context,
  targets,
  runTarget,
}) {
  const choices = Object.keys(targets);
  const results = [];

  for (const name of choices) {
    const routerPrompt = `You are a routing assistant.\n\nTask: ${prompt}\n\nRecent context:\n${context.join("\n---\n")}\n\nChoose if this target (${name}) is the best fit. Reply with: \"yes\" or \"no\" only.`;
    const t = targets[name];
    const result = await runTarget({ command: t.command, args: t.args ?? [], prompt: routerPrompt, interactive: false });
    const yes = (result.output || "").toLowerCase().includes("yes");
    results.push({ name, ok: !result.error, exitCode: result.exitCode, yes });
  }

  const winner = results.find((r) => r.ok && r.exitCode === 0 && r.yes);
  return winner ? winner.name : choices[0];
}
