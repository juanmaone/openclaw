import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveImplicitProviders } from "./models-config.providers.js";

describe("NVIDIA provider", () => {
  it("should not include nvidia when no API key is configured", async () => {
    const agentDir = mkdtempSync(join(tmpdir(), "openclaw-test-"));
    const providers = await resolveImplicitProviders({ agentDir });

    // NVIDIA requires explicit configuration via NVIDIA_API_KEY env var or profile
    expect(providers?.nvidia).toBeUndefined();
  });

  it("should include nvidia provider when NVIDIA_API_KEY is set", async () => {
    const agentDir = mkdtempSync(join(tmpdir(), "openclaw-test-"));
    process.env.NVIDIA_API_KEY = "nvapi-test-key";

    try {
      const providers = await resolveImplicitProviders({ agentDir });

      // Provider should be defined with NVIDIA_API_KEY set
      expect(providers?.nvidia).toBeDefined();
      expect(providers?.nvidia?.apiKey).toBe("NVIDIA_API_KEY");
      expect(providers?.nvidia?.baseUrl).toBe("https://integrate.api.nvidia.com/v1");
      expect(providers?.nvidia?.api).toBe("openai-completions");
    } finally {
      delete process.env.NVIDIA_API_KEY;
    }
  });

  it("should have correct model structure for NVIDIA provider", async () => {
    const agentDir = mkdtempSync(join(tmpdir(), "openclaw-test-"));
    process.env.NVIDIA_API_KEY = "nvapi-test-key";

    try {
      const providers = await resolveImplicitProviders({ agentDir });

      expect(providers?.nvidia?.models).toBeDefined();
      expect(providers?.nvidia?.models?.length).toBeGreaterThan(0);

      const model = providers?.nvidia?.models?.[0];
      expect(model?.id).toBe("moonshot/kimi-2-5");
      expect(model?.name).toBe("Kimi 2.5 (NVIDIA)");
      expect(model?.reasoning).toBe(false);
      expect(model?.input).toEqual(["text"]);
      expect(model?.cost).toEqual({
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
      });
      expect(model?.contextWindow).toBe(256000);
      expect(model?.maxTokens).toBe(8192);
    } finally {
      delete process.env.NVIDIA_API_KEY;
    }
  });
});
