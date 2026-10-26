import { basicPlan } from "./planner.ts";
import { buildPrompt, parsePlan, type PlanInput, type PlanProvider } from "./provider.ts";

// Production: Claude API. Key is read from an Edge Function secret, never sent to the client.
export function claudeProvider(apiKey: string, model = "claude-sonnet-5-5"): PlanProvider {
  return {
    name: "claude",
    async generate(input: PlanInput) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: 2048,
          messages: [{ role: "user", content: buildPrompt(input) }],
        }),
      });
      if (!res.ok) throw new Error(`Claude request failed: ${res.status}`);
      const data = await res.json();
      const text = data.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";
      return parsePlan(text, input);
    },
  };
}

// Dev only: local Ollama for testing without API cost.
export function ollamaProvider(host = "http://localhost:11434", model = "llama3.1:8b"): PlanProvider {
  return {
    name: "ollama",
    async generate(input: PlanInput) {
      const res = await fetch(`${host}/api/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: buildPrompt(input),
          format: "json",
          stream: false,
        }),
      });
      if (!res.ok) throw new Error(`Ollama request failed: ${res.status}`);
      const data = await res.json();
      return parsePlan(data.response ?? "", input);
    },
  };
}

// Built in: no model and no cost. Used until an AI key is set, and as the fallback when a model fails.
export function basicProvider(rng?: () => number): PlanProvider {
  return {
    name: "basic",
    generate: (input: PlanInput) => Promise.resolve(basicPlan(input, rng)),
  };
}

// Picks the provider from env. Claude when ANTHROPIC_API_KEY is set (or KAVI_PLAN_PROVIDER=claude),
// Ollama only when asked for by name, and otherwise the built-in planner, so nothing calls a paid API by accident.
export function providerFromEnv(env: (key: string) => string | undefined): PlanProvider {
  const choice = env("KAVI_PLAN_PROVIDER") ?? (env("ANTHROPIC_API_KEY") ? "claude" : "basic");
  if (choice === "claude") {
    const key = env("ANTHROPIC_API_KEY");
    if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
    return claudeProvider(key);
  }
  if (choice === "ollama") return ollamaProvider(env("OLLAMA_HOST"), env("OLLAMA_MODEL"));
  return basicProvider();
}
