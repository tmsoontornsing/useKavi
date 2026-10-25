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
          max_tokens: 1024,
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

// Picks the provider from env. Defaults to Ollama so local dev never calls paid APIs by accident.
export function providerFromEnv(env: (key: string) => string | undefined): PlanProvider {
  if (env("KAVI_PLAN_PROVIDER") === "claude") {
    const key = env("ANTHROPIC_API_KEY");
    if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
    return claudeProvider(key);
  }
  return ollamaProvider(env("OLLAMA_HOST"), env("OLLAMA_MODEL"));
}
